import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from "openai";
import { storage } from '../storage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VerificationResult {
  status: 'verified' | 'failed' | 'needs_review' | 'completed';
  details: string;
  aiSuggestions?: string;
}

interface ContentAnalysis {
  isValid: boolean;
  suggestions?: string;
  confidence: number;
}

export class PostVerificationService {
  private async analyzeContentWithAI(content: string, requirements: string): Promise<ContentAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a content verification expert. Analyze the content and verify if it meets the requirements. Respond with JSON in this format: { meetsRequirements: boolean, confidence: number, suggestions: string }"
          },
          {
            role: "user",
            content: `Please analyze this content and verify if it meets these requirements:\n\nContent: ${content}\n\nRequirements: ${requirements}`
          }
        ],
        response_format: { type: "json_object" },
      });

      // Parse the response, ensuring it matches our expected format
      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      return {
        isValid: Boolean(parsed.meetsRequirements),
        suggestions: String(parsed.suggestions || ""),
        confidence: Number(parsed.confidence || 0)
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        isValid: false,
        suggestions: "Failed to analyze content with AI",
        confidence: 0
      };
    }
  }

  private async scrapeContent(url: string, platform: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extract content based on platform
      const content = $('meta[property="og:description"]').attr('content');
      return content || '';
    } catch (error) {
      console.error(`Failed to scrape content from ${platform}:`, error);
      return '';
    }
  }

  public async verifyPost(submissionId: number): Promise<void> {
    try {
      // Get the submission and related offer details
      const submissions = await storage.getPostSubmissionsByClaim(submissionId);
      const submission = submissions[0];

      if (!submission) {
        throw new Error('Submission not found');
      }

      // First verify if the post exists and is accessible
      let verificationResult: VerificationResult;
      const content = await this.scrapeContent(submission.postUrl, submission.platform);

      if (!content) {
        verificationResult = {
          status: 'failed',
          details: `Unable to access or verify the ${submission.platform} post`
        };
      } else {
        // Analyze content with AI
        const analysis = await this.analyzeContentWithAI(
          content,
          "Post should be engaging, relevant to the campaign, and follow platform guidelines"
        );

        if (analysis.confidence > 0.8 && analysis.isValid) {
          verificationResult = {
            status: 'verified',
            details: 'Post verified successfully by AI'
          };
        } else if (analysis.confidence < 0.5) {
          verificationResult = {
            status: 'needs_review',
            details: 'AI confidence too low, requires manual review',
            aiSuggestions: analysis.suggestions
          };
        } else {
          verificationResult = {
            status: 'needs_review',
            details: 'Content may need improvements',
            aiSuggestions: analysis.suggestions
          };
        }
      }

      // Update the submission status
      await storage.updatePostSubmissionVerification(
        submission.id,
        verificationResult.status === 'verified' ? 'completed' : verificationResult.status,
        JSON.stringify({
          details: verificationResult.details,
          suggestions: verificationResult.aiSuggestions
        })
      );

      // If verified, update the claim status
      if (verificationResult.status === 'verified') {
        await storage.updateOfferClaimStatus(submission.claimId, 'completed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Update submission as failed if there's an error
      await storage.updatePostSubmissionVerification(
        submissionId,
        'failed',
        'Internal verification error occurred'
      );
    }
  }
}

export const verificationService = new PostVerificationService();