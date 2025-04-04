/**
 * Service for calculating recommended rates for influencers based on various metrics
 */

import { SocialPlatform } from "../../shared/schema";

export interface RateRecommendation {
  minRate: number;
  maxRate: number;
  idealRate: number;
  rateCurrency: string;
  rateUnit: 'post' | 'story' | 'reel' | 'video';
  rateFactors: {
    platformFactor: number;
    followerFactor: number;
    engagementFactor: number;
    contentTypeFactor: number;
    nicheFactor: number;
  };
  // Industry benchmarks for comparison
  benchmarks: {
    industryAverage: number;
    topPerformerRate: number;
    beginnerRate: number;
  };
  // Rate for different content types
  contentTypeRates: {
    post: number;
    story: number;
    reel: number;
    video: number;
  };
}

/**
 * Service for calculating recommended rates for influencers based on various metrics
 */
export class RateCalculatorService {
  /**
   * Calculate recommended rates based on social platform, followers, and engagement rate
   * Uses platform-specific calculations with industry benchmarks
   * 
   * @param platform The platform type (instagram, tiktok, youtube)
   * @param followers Number of followers
   * @param engagementRate Engagement rate as a percentage (e.g., 4.5 for 4.5%)
   * @param niche Optional niche/category to adjust rates for premium categories
   * @returns Rate recommendation with detailed breakdown
   */
  calculateRecommendedRate(
    platform: string,
    followers: number,
    engagementRate: number,
    niche?: string
  ): RateRecommendation {
    // Initialize rate factors
    const rateFactors = {
      platformFactor: this.getPlatformFactor(platform),
      followerFactor: this.getFollowerFactor(followers),
      engagementFactor: this.getEngagementFactor(engagementRate),
      contentTypeFactor: 1.0, // Default factor
      nicheFactor: this.getNicheFactor(niche)
    };
    
    // Base rate calculation (per 1000 followers)
    const baseRate = 5.0; // $5 per 1000 followers as starting point
    
    // Calculate ideal rate based on all factors
    const idealRate = baseRate * 
      (followers / 1000) * 
      rateFactors.platformFactor * 
      rateFactors.followerFactor * 
      rateFactors.engagementFactor * 
      rateFactors.nicheFactor;
    
    // Min and max ranges
    const minRate = Math.round(idealRate * 0.7);
    const maxRate = Math.round(idealRate * 1.3);
    
    // Content type specific rates
    const contentTypeRates = this.getContentTypeRates(platform, idealRate);
    
    // Industry benchmarks
    const benchmarks = this.getIndustryBenchmarks(platform, followers);
    
    return {
      minRate: minRate,
      maxRate: maxRate,
      idealRate: Math.round(idealRate),
      rateCurrency: 'USD',
      rateUnit: 'post',
      rateFactors,
      benchmarks,
      contentTypeRates
    };
  }
  
  /**
   * Get platform-specific rate factor
   * Different platforms command different rates due to audience engagement and advertising value
   * 
   * @param platform Platform type
   * @returns Platform rate multiplier
   */
  private getPlatformFactor(platform: string): number {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 1.0; // Baseline platform
      case 'tiktok':
        return 0.9; // Slightly lower than Instagram on average
      case 'youtube':
        return 1.5; // Higher than Instagram due to video content value
      default:
        return 1.0; // Default factor
    }
  }
  
  /**
   * Get follower count factor
   * Accounts with lower follower counts tend to have higher engagement %
   * But rates don't scale linearly with more followers
   * 
   * @param followers Follower count
   * @returns Follower count rate multiplier
   */
  private getFollowerFactor(followers: number): number {
    if (followers < 10000) {
      return 0.8; // Nano-influencers get a reduced rate
    } else if (followers < 50000) {
      return 1.0; // Micro-influencers get the standard rate
    } else if (followers < 100000) {
      return 1.3; // Medium influencers get a premium
    } else if (followers < 500000) {
      return 1.8; // Large influencers get a higher premium
    } else {
      return 2.2; // Celebrities/mega-influencers get top premium
    }
  }
  
  /**
   * Get engagement rate factor
   * Higher engagement rates command higher rate premiums
   * 
   * @param engagementRate Engagement rate as percentage
   * @returns Engagement rate multiplier
   */
  private getEngagementFactor(engagementRate: number): number {
    if (engagementRate < 1) {
      return 0.6; // Very low engagement
    } else if (engagementRate < 2) {
      return 0.8; // Below average engagement
    } else if (engagementRate < 4) {
      return 1.0; // Average engagement
    } else if (engagementRate < 7) {
      return 1.3; // Good engagement
    } else if (engagementRate < 10) {
      return 1.6; // Excellent engagement
    } else {
      return 2.0; // Exceptional engagement
    }
  }
  
  /**
   * Get niche/category factor
   * Some niches like beauty, finance, technology command premium rates
   * 
   * @param niche Optional niche/category
   * @returns Niche rate multiplier
   */
  private getNicheFactor(niche?: string): number {
    if (!niche) return 1.0;
    
    const lowercaseNiche = niche.toLowerCase();
    
    // Premium niches
    if (['beauty', 'finance', 'technology', 'luxury', 'fitness', 'health', 'business'].includes(lowercaseNiche)) {
      return 1.3;
    }
    
    // Standard niches
    if (['fashion', 'travel', 'food', 'lifestyle', 'parenting'].includes(lowercaseNiche)) {
      return 1.1;
    }
    
    // Less commercial niches
    if (['art', 'music', 'education', 'gaming'].includes(lowercaseNiche)) {
      return 0.9;
    }
    
    return 1.0; // Default factor for unknown niches
  }
  
  /**
   * Get content type specific rates
   * Different content types have different production costs and engagement levels
   * 
   * @param platform Platform type
   * @param baseRate Base rate for standard post
   * @returns Rates for different content types
   */
  private getContentTypeRates(platform: string, baseRate: number): { post: number; story: number; reel: number; video: number } {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return {
          post: Math.round(baseRate),
          story: Math.round(baseRate * 0.5),
          reel: Math.round(baseRate * 1.5),
          video: Math.round(baseRate * 1.8)
        };
      case 'tiktok':
        return {
          post: Math.round(baseRate),
          story: Math.round(baseRate * 0.5), // Not applicable really
          reel: Math.round(baseRate * 1.0), // Standard TikTok content
          video: Math.round(baseRate * 1.5) // Longer format videos
        };
      case 'youtube':
        return {
          post: Math.round(baseRate * 0.7), // Community post
          story: Math.round(baseRate * 0.5), // Shorts
          reel: Math.round(baseRate * 0.8), // Shorts with more production
          video: Math.round(baseRate * 1.0) // Standard YT video
        };
      default:
        return {
          post: Math.round(baseRate),
          story: Math.round(baseRate * 0.5),
          reel: Math.round(baseRate * 1.2),
          video: Math.round(baseRate * 1.5)
        };
    }
  }
  
  /**
   * Get industry benchmarks for comparison
   * Provides context for the calculated rates
   * 
   * @param platform Platform type
   * @param followers Follower count
   * @returns Industry benchmarks
   */
  private getIndustryBenchmarks(platform: string, followers: number): { industryAverage: number; topPerformerRate: number; beginnerRate: number } {
    let industryAverage = 0;
    
    // Industry average baseline calculations by platform
    switch (platform.toLowerCase()) {
      case 'instagram':
        industryAverage = Math.min(10000, Math.max(25, followers * 0.008));
        break;
      case 'tiktok':
        industryAverage = Math.min(8000, Math.max(20, followers * 0.007));
        break;
      case 'youtube':
        industryAverage = Math.min(20000, Math.max(50, followers * 0.012));
        break;
      default:
        industryAverage = Math.min(10000, Math.max(30, followers * 0.008));
    }
    
    return {
      industryAverage: Math.round(industryAverage),
      topPerformerRate: Math.round(industryAverage * 1.8),
      beginnerRate: Math.round(industryAverage * 0.5)
    };
  }
  
  /**
   * Calculate recommended rates for all connected platforms
   * 
   * @param platforms List of social platforms
   * @param niche Optional niche/category
   * @returns Map of platform IDs to rate recommendations
   */
  calculateRatesForAllPlatforms(platforms: SocialPlatform[], niche?: string): Map<string, RateRecommendation> {
    const rateMap = new Map<string, RateRecommendation>();
    
    for (const platform of platforms) {
      if (platform.followers && platform.engagementRate) {
        // Convert engagement rate from string to number if needed
        const engagementRateNum = typeof platform.engagementRate === 'string' 
          ? parseFloat(platform.engagementRate) 
          : platform.engagementRate;
        
        const rate = this.calculateRecommendedRate(
          platform.platform,
          platform.followers,
          engagementRateNum,
          niche
        );
        
        // Ensure we're using string ID
        const platformId = typeof platform.id === 'number' 
          ? platform.id.toString() 
          : platform.id;
          
        rateMap.set(platformId, rate);
      }
    }
    
    return rateMap;
  }
  
  /**
   * Suggest optimal pricing for an offer based on target reach and budget
   * 
   * @param totalBudget Total campaign budget
   * @param targetReach Desired audience reach
   * @param contentType Type of content required
   * @returns Recommendation object with suggested influencer mix and pricing
   */
  suggestOptimalPricing(totalBudget: number, targetReach: number, contentType: string = 'post'): any {
    // This would be expanded with a more complex algorithm to suggest
    // a mix of influencer tiers (nano, micro, mid-tier, macro) to maximize reach
    // within the given budget. For now, we return a simpler suggestion.
    
    const avgCostPer1kFollowers = {
      nano: 15, // $15 per 1k for nano (1k-10k)
      micro: 10, // $10 per 1k for micro (10k-50k)
      mid: 8,   // $8 per 1k for mid-tier (50k-100k)
      macro: 5  // $5 per 1k for macro (100k+)
    };
    
    // Simplified recommendation logic
    let recommendation: any = {
      suggestedMix: [],
      estimatedReach: 0,
      estimatedEngagement: 0,
      remainingBudget: totalBudget
    };
    
    // More sophisticated algorithm would be implemented here
    // For now, return placeholder recommendations
    
    return recommendation;
  }
}

export const rateCalculatorService = new RateCalculatorService();