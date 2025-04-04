import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define types for the API responses
export interface IndustryTemplate {
  title: string;
  description: string;
  contentType: string;
  category: string;
  suggestedPostsRequired: number;
  suggestedTimeframe: number;
  suggestedTags: string[];
  suggestedRequirements: {
    minFollowers: number;
    minEngagement: number;
  };
}

export interface BudgetRecommendation {
  suggestedReward: string;
  rewardType: string;
  estimatedReach: number;
  estimatedEngagement: number;
  estimatedROI: string;
  recommendedInfluencerTier: string;
}

export interface MatchPreview {
  potentialMatches: number;
  matchDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  mostRestrictiveCriteria: string[];
  suggestedAdjustments: {
    field: string;
    currentValue: any;
    suggestedValue: any;
    potentialIncrease: number;
  }[];
}

export interface ContentBriefSuggestion {
  suggestedFormat: string;
  keyMessages: string[];
  dosDonts: {
    dos: string[];
    donts: string[];
  };
  platformSpecificTips: string[];
  exampleCaptions: string[];
  estimatedPerformance: {
    expectedEngagementRate: string;
    viewsEstimate: string;
    conversionPotential: string;
  };
}

export interface CampaignObjective {
  name: string;
  description: string;
  suitableFor: string[];
  recommendedKPIs: string[];
  suggestedContentTypes: string[];
  suggestedPlatforms: string[];
  timeframeRecommendation: number;
}

export type OfferDraft = {
  minFollowers?: number;
  minEngagement?: number;
  category?: string;
  contentType?: string;
  location?: string;
  tags?: string[];
};

/**
 * Hook for accessing AI-powered offer creation tools
 */
export function useAIOfferTools() {
  const { toast } = useToast();
  
  // Get industry-specific template
  const useIndustryTemplate = () => {
    return useQuery<IndustryTemplate, Error>({
      queryKey: ['/api/offers/template'],
      queryFn: async () => {
        const response = await apiRequest('GET', '/api/offers/template');
        if (!response.ok) {
          throw new Error('Failed to fetch industry template');
        }
        return response.json() as Promise<IndustryTemplate>;
      },
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
  };
  
  // Get budget recommendations
  const useBudgetRecommendation = (budget: number, targetReach: number, contentType: string) => {
    return useQuery<BudgetRecommendation, Error>({
      queryKey: ['/api/offers/budget-recommendation', budget, targetReach, contentType],
      queryFn: async () => {
        const response = await apiRequest('GET', 
          `/api/offers/budget-recommendation?budget=${budget}&targetReach=${targetReach}&contentType=${contentType}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch budget recommendation');
        }
        return response.json() as Promise<BudgetRecommendation>;
      },
      enabled: budget > 0 && targetReach > 0, // Only run when budget and reach are set
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
  };
  
  // Generate offer match preview
  const useMatchPreview = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    const generateMatchPreview = async (draftOffer: OfferDraft): Promise<MatchPreview> => {
      try {
        setIsGenerating(true);
        const response = await apiRequest('POST', '/api/offers/match-preview', draftOffer);
        if (!response.ok) {
          throw new Error('Failed to generate match preview');
        }
        return await response.json();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to generate match preview",
          variant: "destructive"
        });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    };
    
    return { generateMatchPreview, isGenerating };
  };
  
  // Get content brief suggestions
  const useContentBrief = (category: string, contentType: string, platform: string = 'instagram') => {
    return useQuery<ContentBriefSuggestion, Error>({
      queryKey: ['/api/offers/content-brief', category, contentType, platform],
      queryFn: async () => {
        const response = await apiRequest('GET', 
          `/api/offers/content-brief?category=${category}&contentType=${contentType}&platform=${platform}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch content brief');
        }
        return response.json() as Promise<ContentBriefSuggestion>;
      },
      enabled: !!category && !!contentType, // Only run when category and content type are set
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
  };
  
  // Get campaign objectives
  const useCampaignObjectives = (marketingGoal: string = 'awareness') => {
    return useQuery<CampaignObjective[], Error>({
      queryKey: ['/api/offers/campaign-objectives', marketingGoal],
      queryFn: async () => {
        const response = await apiRequest('GET', 
          `/api/offers/campaign-objectives?marketingGoal=${marketingGoal}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch campaign objectives');
        }
        return response.json() as Promise<CampaignObjective[]>;
      },
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
  };
  
  return {
    useIndustryTemplate,
    useBudgetRecommendation,
    useMatchPreview,
    useContentBrief,
    useCampaignObjectives
  };
}