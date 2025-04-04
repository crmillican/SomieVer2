/**
 * Service for AI-driven offer creation
 * Provides intelligent templates, suggestions, and optimization features
 */

import { BusinessProfile, InfluencerProfile } from "../../shared/schema";
import { rateCalculatorService } from "./rate-calculator";
import { matchingService } from "./matching";
import { storage } from "../storage";

/**
 * Interface for industry-specific templates
 */
interface OfferTemplate {
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

/**
 * Interface for optimized budget recommendation
 */
interface BudgetRecommendation {
  suggestedReward: string;
  rewardType: string;
  estimatedReach: number;
  estimatedEngagement: number;
  estimatedROI: string;
  recommendedInfluencerTier: string;
}

/**
 * Interface for influencer match preview
 */
interface MatchPreview {
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

/**
 * Interface for content brief suggestion
 */
interface ContentBriefSuggestion {
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

/**
 * Interface for campaign objective suggestion
 */
interface CampaignObjective {
  name: string;
  description: string;
  suitableFor: string[];
  recommendedKPIs: string[];
  suggestedContentTypes: string[];
  suggestedPlatforms: string[];
  timeframeRecommendation: number;
}

/**
 * Service for AI-driven offer creation
 */
export class OfferCreationService {
  /**
   * Get industry-specific template for offer creation
   * 
   * @param businessProfile Business profile to base template on
   * @returns Industry-specific offer template
   */
  getIndustryTemplate(businessProfile: BusinessProfile): OfferTemplate {
    const industry = businessProfile.industry?.toLowerCase() || 'general';
    
    // Industry-specific templates with pre-filled values
    const templates: Record<string, OfferTemplate> = {
      'beauty': {
        title: 'Partner with us on our new beauty product launch',
        description: 'We\'re looking for beauty enthusiasts to create authentic content featuring our new product. Share your honest review and creative application techniques with your followers.',
        contentType: 'image',
        category: 'beauty',
        suggestedPostsRequired: 2,
        suggestedTimeframe: 14,
        suggestedTags: ['beauty', 'skincare', 'makeup', 'productreview'],
        suggestedRequirements: {
          minFollowers: 5000,
          minEngagement: 3.0
        }
      },
      'fashion': {
        title: 'Showcase our new fashion collection',
        description: 'We\'re seeking style-conscious creators to feature our latest fashion pieces. Show your unique styling and tell your audience what you love about the items.',
        contentType: 'image',
        category: 'fashion',
        suggestedPostsRequired: 1,
        suggestedTimeframe: 10,
        suggestedTags: ['fashion', 'style', 'ootd', 'outfitinspo'],
        suggestedRequirements: {
          minFollowers: 3000,
          minEngagement: 2.5
        }
      },
      'food': {
        title: 'Create content featuring our food product',
        description: 'We\'re looking for foodies to create mouthwatering content with our product. Show how you incorporate it into your recipes or daily routine.',
        contentType: 'image',
        category: 'food',
        suggestedPostsRequired: 1,
        suggestedTimeframe: 14,
        suggestedTags: ['food', 'foodie', 'recipe', 'cooking'],
        suggestedRequirements: {
          minFollowers: 2000,
          minEngagement: 4.0
        }
      },
      'fitness': {
        title: 'Partner with us on our fitness product',
        description: 'We\'re seeking fitness enthusiasts to showcase our product in action. Share your routine and how our product enhances your workout experience.',
        contentType: 'video',
        category: 'fitness',
        suggestedPostsRequired: 2,
        suggestedTimeframe: 21,
        suggestedTags: ['fitness', 'workout', 'active', 'wellness'],
        suggestedRequirements: {
          minFollowers: 5000,
          minEngagement: 3.5
        }
      },
      'technology': {
        title: 'Review our new tech product',
        description: 'We\'re looking for tech-savvy creators to review our latest product. Share your honest thoughts on features, performance, and user experience.',
        contentType: 'video',
        category: 'technology',
        suggestedPostsRequired: 1,
        suggestedTimeframe: 21,
        suggestedTags: ['tech', 'gadgets', 'review', 'technology'],
        suggestedRequirements: {
          minFollowers: 8000,
          minEngagement: 2.0
        }
      },
      'travel': {
        title: 'Feature our destination/travel product',
        description: 'We\'re seeking travel content creators to showcase our destination/product. Share your authentic experience and inspire your audience to explore.',
        contentType: 'image',
        category: 'travel',
        suggestedPostsRequired: 3,
        suggestedTimeframe: 30,
        suggestedTags: ['travel', 'adventure', 'explore', 'destination'],
        suggestedRequirements: {
          minFollowers: 10000,
          minEngagement: 3.0
        }
      },
      'general': {
        title: 'Partner with us on our product promotion',
        description: 'We\'re looking for creators to feature our product in authentic content. Share your experience with our product and why you recommend it.',
        contentType: 'image',
        category: 'lifestyle',
        suggestedPostsRequired: 1,
        suggestedTimeframe: 14,
        suggestedTags: ['sponsored', 'partnership', 'review'],
        suggestedRequirements: {
          minFollowers: 3000,
          minEngagement: 3.0
        }
      }
    };
    
    // Try to match business industry to template
    let bestMatch = 'general';
    const industryLower = industry.toLowerCase();
    
    // Try direct match first
    if (industryLower in templates) {
      bestMatch = industryLower;
    } 
    // Try partial match
    else {
      for (const key of Object.keys(templates)) {
        if (industryLower.includes(key) || key.includes(industryLower)) {
          bestMatch = key;
          break;
        }
      }
    }
    
    // Customize template based on business profile
    const template = { ...templates[bestMatch] };
    
    // Personalize with business name if available
    if (businessProfile.businessName) {
      template.title = template.title.replace('us', businessProfile.businessName);
      template.description = template.description.replace('We\'re', `${businessProfile.businessName} is`);
      template.description = template.description.replace('our', 'their');
    }
    
    return template;
  }
  
  /**
   * Calculate optimized budget recommendations based on business goals
   * 
   * @param budget Total available budget
   * @param targetReach Desired audience reach 
   * @param industry Business industry
   * @param contentType Desired content type
   * @returns Budget recommendation with ROI estimates
   */
  calculateBudgetRecommendation(
    budget: number,
    targetReach: number = 0,
    industry: string = 'general',
    contentType: string = 'image'
  ): BudgetRecommendation {
    // Industry-specific engagement metrics
    const industryMetrics: Record<string, {avgEngagement: number, conversionRate: number}> = {
      'beauty': { avgEngagement: 4.3, conversionRate: 2.1 },
      'fashion': { avgEngagement: 3.8, conversionRate: 1.9 },
      'food': { avgEngagement: 5.2, conversionRate: 1.5 },
      'fitness': { avgEngagement: 4.7, conversionRate: 2.3 },
      'technology': { avgEngagement: 2.9, conversionRate: 1.8 },
      'travel': { avgEngagement: 4.1, conversionRate: 1.2 },
      'general': { avgEngagement: 3.5, conversionRate: 1.5 }
    };
    
    // Find best matching industry
    let bestMatch = 'general';
    const industryLower = industry.toLowerCase();
    
    if (industryLower in industryMetrics) {
      bestMatch = industryLower;
    } else {
      for (const key of Object.keys(industryMetrics)) {
        if (industryLower.includes(key) || key.includes(industryLower)) {
          bestMatch = key;
          break;
        }
      }
    }
    
    const metrics = industryMetrics[bestMatch];
    
    // Calculate optimal influencer tier based on budget
    let influencerTier = 'nano';
    let suggestedReward = '';
    let estimatedReach = 0;
    
    if (budget < 100) {
      influencerTier = 'nano';
      suggestedReward = '$50-100 per post';
      estimatedReach = budget * 200; // Approx 10k reach per $50
    } else if (budget < 500) {
      influencerTier = 'micro';
      suggestedReward = '$100-300 per post';
      estimatedReach = budget * 150; // Better rate for larger budget
    } else if (budget < 2000) {
      influencerTier = 'mid-tier';
      suggestedReward = '$300-800 per post';
      estimatedReach = budget * 120;
    } else {
      influencerTier = 'macro';
      suggestedReward = '$1000+ per post';
      estimatedReach = budget * 100;
    }
    
    // Adjust based on content type
    const contentTypeMultiplier: Record<string, number> = {
      'image': 1.0,
      'video': 1.5,
      'story': 0.6,
      'reel': 1.2
    };
    
    const multiplier = contentTypeMultiplier[contentType] || 1.0;
    estimatedReach = Math.round(estimatedReach * multiplier);
    
    // Calculate estimated engagement
    const estimatedEngagement = Math.round(estimatedReach * (metrics.avgEngagement / 100));
    
    // Calculate estimated ROI based on conversion rate
    const potentialConversions = Math.round(estimatedReach * (metrics.conversionRate / 100));
    const estimatedROI = `${potentialConversions} potential conversions`;
    
    return {
      suggestedReward,
      rewardType: budget > 200 ? 'monetary' : 'product',
      estimatedReach,
      estimatedEngagement,
      estimatedROI,
      recommendedInfluencerTier: influencerTier
    };
  }
  
  /**
   * Generate match preview to show potential matches during offer creation
   * 
   * @param offerDraft Draft offer criteria
   * @returns Match preview information
   */
  async generateMatchPreview(offerDraft: {
    minFollowers?: number,
    minEngagement?: number,
    category?: string,
    contentType?: string,
    location?: string,
    tags?: string[]
  }): Promise<MatchPreview> {
    // Default values for missing properties
    const draft = {
      minFollowers: offerDraft.minFollowers || 1000,
      minEngagement: offerDraft.minEngagement || 3.0,
      category: offerDraft.category || 'general',
      contentType: offerDraft.contentType || 'image',
      location: offerDraft.location || '',
      tags: offerDraft.tags || []
    };
    
    // Get a sample of influencer profiles - in production this would be paginated/limited
    const influencerProfiles = await this.getSampleInfluencerProfiles();
    
    // Count potential matches and their quality distribution
    let potentialMatches = 0;
    const matchDistribution = {
      excellent: 0, // 80-100 match score
      good: 0,      // 60-79 match score
      average: 0,   // 40-59 match score
      poor: 0       // <40 match score
    };
    
    // Track which criteria are most restrictive
    const criteriaRestrictions: Record<string, number> = {
      followers: 0,
      engagement: 0,
      location: 0,
      category: 0,
      contentType: 0
    };
    
    for (const profile of influencerProfiles) {
      // Check follower count - make sure we compare numbers
      const followerCount = typeof profile.followerCount === 'string' ? 
        parseInt(profile.followerCount) : profile.followerCount;
      
      if (followerCount < draft.minFollowers) {
        criteriaRestrictions.followers++;
        continue;
      }
      
      // Check engagement rate - make sure we compare numbers
      const engagementRate = typeof profile.engagementRate === 'string' ? 
        parseFloat(profile.engagementRate) : profile.engagementRate;
        
      if (engagementRate < draft.minEngagement) {
        criteriaRestrictions.engagement++;
        continue;
      }
      
      // Check location if specified
      if (draft.location && profile.location) {
        const locationMatch = profile.location.toLowerCase().includes(draft.location.toLowerCase()) || 
                             draft.location.toLowerCase().includes(profile.location.toLowerCase());
        if (!locationMatch) {
          criteriaRestrictions.location++;
          continue;
        }
      }
      
      // Check category/niche if specified
      if (draft.category !== 'general' && profile.niche) {
        const categoryMatch = profile.niche.toLowerCase().includes(draft.category.toLowerCase()) || 
                             draft.category.toLowerCase().includes(profile.niche.toLowerCase());
        if (!categoryMatch) {
          criteriaRestrictions.category++;
          continue;
        }
      }
      
      // Check content type compatibility
      const contentCompatible = this.checkContentTypeCompatibility(profile.platform, draft.contentType);
      if (!contentCompatible) {
        criteriaRestrictions.contentType++;
        continue;
      }
      
      // Simulate a match score calculation
      const mockOffer = {
        id: 0,
        businessId: 0,
        title: '',
        description: '',
        reward: '',
        rewardType: '',
        minFollowers: draft.minFollowers,
        minEngagement: draft.minEngagement,
        postsRequired: 1,
        timeframe: 14,
        status: 'active',
        category: draft.category,
        contentType: draft.contentType,
        location: draft.location,
        tags: draft.tags,
        createdAt: new Date(),
        isTest: false,
        rewardAmount: 0,
        audienceRequirements: null,
        optimizationData: null
      };
      
      const matchScore = matchingService.calculateMatchScore(profile, mockOffer);
      
      // Count this as a potential match
      potentialMatches++;
      
      // Add to the distribution
      if (matchScore.score >= 80) {
        matchDistribution.excellent++;
      } else if (matchScore.score >= 60) {
        matchDistribution.good++;
      } else if (matchScore.score >= 40) {
        matchDistribution.average++;
      } else {
        matchDistribution.poor++;
      }
    }
    
    // Determine most restrictive criteria (top 2)
    const sortedCriteria = Object.entries(criteriaRestrictions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => key);
    
    // Generate suggestions for improvement
    const suggestedAdjustments = [];
    
    if (sortedCriteria.includes('followers')) {
      suggestedAdjustments.push({
        field: 'minFollowers',
        currentValue: draft.minFollowers,
        suggestedValue: Math.max(500, Math.round(draft.minFollowers * 0.8)),
        potentialIncrease: Math.round((influencerProfiles.length * 0.15))
      });
    }
    
    if (sortedCriteria.includes('engagement')) {
      suggestedAdjustments.push({
        field: 'minEngagement',
        currentValue: draft.minEngagement,
        suggestedValue: Math.max(1.5, draft.minEngagement - 1),
        potentialIncrease: Math.round((influencerProfiles.length * 0.2))
      });
    }
    
    if (sortedCriteria.includes('location') && draft.location) {
      suggestedAdjustments.push({
        field: 'location',
        currentValue: draft.location,
        suggestedValue: '',
        potentialIncrease: criteriaRestrictions.location
      });
    }
    
    return {
      potentialMatches,
      matchDistribution,
      mostRestrictiveCriteria: sortedCriteria,
      suggestedAdjustments
    };
  }
  
  /**
   * Generate content brief suggestions based on campaign goals and platform
   * 
   * @param category Content category/niche
   * @param contentType Type of content (image, video, etc)
   * @param platform Platform (instagram, tiktok, etc)
   * @returns Content brief suggestions
   */
  generateContentBriefSuggestions(
    category: string = 'general',
    contentType: string = 'image',
    platform: string = 'instagram'
  ): ContentBriefSuggestion {
    // Default content brief
    const defaultBrief: ContentBriefSuggestion = {
      suggestedFormat: 'Single product feature image',
      keyMessages: [
        'Highlight key product benefits',
        'Share your authentic experience',
        'Include a clear call-to-action'
      ],
      dosDonts: {
        dos: [
          'Be authentic and genuine',
          'Show the product in use',
          'Tag the brand properly'
        ],
        donts: [
          'Don\'t make claims not supported by the brand',
          'Don\'t use misleading captions',
          'Don\'t forget to disclose the partnership'
        ]
      },
      platformSpecificTips: [
        'Use 4-5 relevant hashtags',
        'Post during high-engagement hours',
        'Respond to comments to boost algorithm ranking'
      ],
      exampleCaptions: [
        'I\'ve been testing [product] for the past week and I\'m loving how [benefit]. Have you tried it yet? #ad',
        'My honest thoughts on [product] — [key point 1], [key point 2], and [key point 3]! Let me know if you have questions below. #sponsored'
      ],
      estimatedPerformance: {
        expectedEngagementRate: '3-5%',
        viewsEstimate: '60-80% of followers',
        conversionPotential: 'Moderate'
      }
    };
    
    // Customize based on platform
    if (platform.toLowerCase() === 'instagram') {
      if (contentType === 'image') {
        defaultBrief.suggestedFormat = 'Carousel with 3-5 images';
        defaultBrief.platformSpecificTips = [
          'Use carousel format for 3x more engagement',
          'First image should grab attention',
          'Include a mix of product and lifestyle images',
          'Use 5-10 relevant hashtags'
        ];
        defaultBrief.estimatedPerformance.expectedEngagementRate = '4-7%';
      } else if (contentType === 'video' || contentType === 'reel') {
        defaultBrief.suggestedFormat = '15-30 second vertical video';
        defaultBrief.platformSpecificTips = [
          'Start with a hook in first 3 seconds',
          'Use trending audio when relevant',
          'Add text overlay for key points',
          'End with a clear call-to-action'
        ];
        defaultBrief.estimatedPerformance.expectedEngagementRate = '5-10%';
        defaultBrief.estimatedPerformance.viewsEstimate = '2-3x follower count';
      } else if (contentType === 'story') {
        defaultBrief.suggestedFormat = 'Series of 3-5 story frames';
        defaultBrief.platformSpecificTips = [
          'Use interactive stickers (polls, questions)',
          'Show before/after or unboxing sequence',
          'Include swipe-up or product link sticker',
          'Add location tag for local visibility'
        ];
        defaultBrief.estimatedPerformance.expectedEngagementRate = '8-15% tap-through rate';
        defaultBrief.estimatedPerformance.viewsEstimate = '30-50% of followers';
      }
    } else if (platform.toLowerCase() === 'tiktok') {
      defaultBrief.suggestedFormat = '15-60 second vertical video';
      defaultBrief.platformSpecificTips = [
        'Use trending sounds or effects',
        'Hook viewers in first 2 seconds',
        'Keep transitions dynamic and fast-paced',
        'Include text overlay for key points',
        'End with clear call to action'
      ];
      defaultBrief.estimatedPerformance.expectedEngagementRate = '8-20%';
      defaultBrief.estimatedPerformance.viewsEstimate = '1-10x follower count';
    } else if (platform.toLowerCase() === 'youtube') {
      defaultBrief.suggestedFormat = 'Product review or tutorial';
      defaultBrief.platformSpecificTips = [
        'Create engaging thumbnail and title',
        'Structure with clear sections/timestamps',
        'Demonstrate product in action',
        'Include both pros and cons for authenticity',
        'Include affiliate/discount links in description'
      ];
      defaultBrief.estimatedPerformance.expectedEngagementRate = '5-10% like ratio';
      defaultBrief.estimatedPerformance.viewsEstimate = '30-50% of subscribers in first week';
    }
    
    // Customize based on category
    if (category.toLowerCase() === 'beauty') {
      defaultBrief.keyMessages = [
        'Show before/after results',
        'Highlight unique ingredients or benefits',
        'Demonstrate proper application technique',
        'Compare to similar products (if applicable)'
      ];
      defaultBrief.dosDonts.dos.push('Show close-ups of texture and application');
      defaultBrief.dosDonts.dos.push('Mention skin type/concerns it works for');
    } else if (category.toLowerCase() === 'fashion') {
      defaultBrief.keyMessages = [
        'Showcase how item fits in real life',
        'Show styling options (at least 2 different looks)',
        'Highlight quality, fabric, and comfort',
        'Mention size information for reference'
      ];
      defaultBrief.dosDonts.dos.push('Show full outfit from multiple angles');
      defaultBrief.dosDonts.dos.push('Include size and fit details');
    } else if (category.toLowerCase() === 'food') {
      defaultBrief.keyMessages = [
        'Show product in appetizing way',
        'Highlight flavor profile and key ingredients',
        'Demonstrate serving suggestion or recipe',
        'Mention nutritional benefits (if applicable)'
      ];
      defaultBrief.dosDonts.dos.push('Use bright, natural lighting');
      defaultBrief.dosDonts.dos.push('Show texture and close-ups');
    }
    
    return defaultBrief;
  }
  
  /**
   * Suggest campaign objectives based on business profile and goals
   * 
   * @param industry Business industry
   * @param marketingGoal Desired marketing outcome
   * @returns Campaign objective recommendations
   */
  suggestCampaignObjectives(
    industry: string = 'general',
    marketingGoal: string = 'awareness'
  ): CampaignObjective[] {
    // Base campaign objectives
    const objectives: Record<string, CampaignObjective> = {
      'brand_awareness': {
        name: 'Brand Awareness',
        description: 'Introduce your brand to new audiences and increase overall visibility',
        suitableFor: ['new brands', 'product launches', 'rebranding'],
        recommendedKPIs: ['reach', 'impressions', 'profile visits', 'follower growth'],
        suggestedContentTypes: ['image', 'reel', 'story'],
        suggestedPlatforms: ['instagram', 'tiktok'],
        timeframeRecommendation: 14
      },
      'product_education': {
        name: 'Product Education',
        description: 'Explain product features, benefits, and use cases to potential customers',
        suitableFor: ['complex products', 'new technology', 'unique selling propositions'],
        recommendedKPIs: ['engagement rate', 'video completion rate', 'saved posts', 'comments'],
        suggestedContentTypes: ['video', 'carousel', 'tutorial'],
        suggestedPlatforms: ['instagram', 'youtube'],
        timeframeRecommendation: 21
      },
      'social_proof': {
        name: 'Social Proof & Credibility',
        description: 'Build trust through authentic reviews and demonstrations',
        suitableFor: ['premium products', 'competitive markets', 'trust-sensitive niches'],
        recommendedKPIs: ['engagement quality', 'comments sentiment', 'saved posts', 'shares'],
        suggestedContentTypes: ['review', 'testimonial', 'before/after'],
        suggestedPlatforms: ['instagram', 'youtube', 'tiktok'],
        timeframeRecommendation: 30
      },
      'conversion': {
        name: 'Direct Conversion',
        description: 'Drive immediate sales or sign-ups through strong calls-to-action',
        suitableFor: ['limited-time offers', 'promotions', 'seasonal products'],
        recommendedKPIs: ['click-through rate', 'conversion rate', 'sales', 'cost per acquisition'],
        suggestedContentTypes: ['promotional', 'demo', 'tutorial with offer'],
        suggestedPlatforms: ['instagram', 'tiktok'],
        timeframeRecommendation: 14
      },
      'content_creation': {
        name: 'Content Creation',
        description: 'Generate high-quality content that can be repurposed across marketing channels',
        suitableFor: ['brands with limited content resources', 'visual products', 'multi-channel marketing'],
        recommendedKPIs: ['content quality', 'repurposing potential', 'usage rights value'],
        suggestedContentTypes: ['high-production image', 'professional video', 'diverse assets'],
        suggestedPlatforms: ['instagram', 'youtube'],
        timeframeRecommendation: 30
      }
    };
    
    // Select 2-3 most relevant objectives based on industry and goal
    let recommendedObjectives: CampaignObjective[] = [];
    
    if (marketingGoal === 'awareness') {
      recommendedObjectives.push(objectives['brand_awareness']);
      recommendedObjectives.push(objectives['content_creation']);
    } else if (marketingGoal === 'engagement') {
      recommendedObjectives.push(objectives['product_education']);
      recommendedObjectives.push(objectives['social_proof']);
    } else if (marketingGoal === 'conversion') {
      recommendedObjectives.push(objectives['conversion']);
      recommendedObjectives.push(objectives['social_proof']);
    } else {
      // Default recommendations if no specific goal
      recommendedObjectives.push(objectives['brand_awareness']);
      recommendedObjectives.push(objectives['social_proof']);
    }
    
    // Adjust based on industry - add a third relevant objective
    if (['beauty', 'fashion', 'food'].includes(industry.toLowerCase())) {
      if (!recommendedObjectives.includes(objectives['content_creation'])) {
        recommendedObjectives.push(objectives['content_creation']);
      }
    } else if (['technology', 'finance', 'health'].includes(industry.toLowerCase())) {
      if (!recommendedObjectives.includes(objectives['product_education'])) {
        recommendedObjectives.push(objectives['product_education']);
      }
    }
    
    return recommendedObjectives;
  }
  
  /**
   * Check if a specific content type is compatible with a platform
   * 
   * @param platform Social platform (instagram, tiktok, etc)
   * @param contentType Content type (image, video, etc)
   * @returns Boolean indicating compatibility
   */
  private checkContentTypeCompatibility(platform: string = '', contentType: string = ''): boolean {
    if (!platform || !contentType) return true; // Default to compatible if either is missing
    
    const platformContentMap: Record<string, string[]> = {
      'instagram': ['image', 'carousel', 'video', 'reel', 'story'],
      'tiktok': ['video', 'short', 'live'],
      'youtube': ['video', 'short', 'livestream'],
      'facebook': ['image', 'video', 'story', 'live'],
      'twitter': ['image', 'video', 'text']
    };
    
    const platformKey = platform.toLowerCase();
    const supportedTypes = platformContentMap[platformKey] || [];
    
    return supportedTypes.some(type => 
      type.toLowerCase() === contentType.toLowerCase() ||
      contentType.toLowerCase().includes(type.toLowerCase()) ||
      type.toLowerCase().includes(contentType.toLowerCase())
    );
  }
  
  /**
   * Get a sample of influencer profiles for testing match preview
   * In a real implementation, this would query the database
   * 
   * @returns Array of sample influencer profiles
   */
  private async getSampleInfluencerProfiles(): Promise<InfluencerProfile[]> {
    try {
      // In production, this would be a database query with proper pagination
      const profiles = await storage.getInfluencerProfiles(20);
      return profiles;
    } catch (error) {
      console.error('Error fetching influencer profiles:', error);
      
      // Return empty array if real data can't be fetched
      return [];
    }
  }
}

export const offerCreationService = new OfferCreationService();