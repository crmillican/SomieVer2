import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchScoreDisplay } from "@/components/match-score-display";
import { 
  Zap, 
  Search, 
  UserCheck, 
  Target,
  RefreshCw,
  Sparkles,
  Filter,
  Check,
  Users,
  Instagram,
  Image,
  BarChart2,
  MapPin,
  Sliders,
  Tag,
  Heart,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InfluencerMatcherProps {
  onInfluencerSelected?: (influencer: InfluencerMatch) => void;
  offerCriteria?: {
    minFollowers?: number;
    minEngagement?: number;
    category?: string;
    contentType?: string;
    location?: string;
    tags?: string[];
  };
  className?: string;
}

export interface MatchFactors {
  metricsMatch: number;
  locationMatch: number;
  nicheMatch: number;
  contentTypeMatch: number;
  audienceMatch: number;
  brandAlignmentScore: number;
}

export interface InfluencerMatch {
  id: string;
  name: string;
  handle: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  followers: number;
  engagementRate: number;
  location: string;
  contentTypes: string[];
  niche: string;
  tags: string[];
  pricePerPost: number;
  matchScore: number;
  matchFactors: MatchFactors;
  recentPosts?: {
    url: string;
    type: string;
    engagement: number;
    thumbnail?: string;
  }[];
  audienceStats?: {
    ageGroups: { [key: string]: number };
    genderSplit: { male: number; female: number; other: number };
    topLocations: { [key: string]: number };
    interests: string[];
  };
}

/**
 * Smart Influencer Matcher Component
 * 
 * Uses AI to match the most compatible influencers based on offer criteria
 * Based on the requested features #5 in the user's list
 */
export function InfluencerMatcher({ 
  onInfluencerSelected, 
  offerCriteria = {},
  className = "" 
}: InfluencerMatcherProps) {
  const { toast } = useToast();
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<InfluencerMatch[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerMatch | null>(null);
  const [filters, setFilters] = useState({
    minMatchScore: 70,
    platforms: ["instagram", "tiktok", "youtube"],
    minFollowers: offerCriteria.minFollowers || 1000,
    maxFollowers: 100000,
    minEngagement: offerCriteria.minEngagement || 2,
    location: offerCriteria.location || "",
    niche: offerCriteria.category || "",
    contentType: offerCriteria.contentType || "",
  });
  
  // Generate some sample influencers for demonstration
  const generateInfluencers = () => {
    setSearching(true);
    
    // Simulate AI-based matching with a delay
    setTimeout(() => {
      // Generate a set of sample influencers with varying match scores
      const sampleInfluencers: InfluencerMatch[] = [
        {
          id: "inf1",
          name: "Emma Johnson",
          handle: "emma.creates",
          platform: "instagram",
          followers: 15800,
          engagementRate: 4.2,
          location: "New York, USA",
          contentTypes: ["image", "story", "reel"],
          niche: "fashion",
          tags: ["sustainable", "minimalist", "lifestyle"],
          pricePerPost: 350,
          matchScore: 92,
          matchFactors: {
            metricsMatch: 95,
            locationMatch: 85,
            nicheMatch: 98,
            contentTypeMatch: 90,
            audienceMatch: 88,
            brandAlignmentScore: 92
          },
          audienceStats: {
            ageGroups: { "18-24": 35, "25-34": 42, "35-44": 18, "45+": 5 },
            genderSplit: { female: 72, male: 26, other: 2 },
            topLocations: { "USA": 65, "Canada": 12, "UK": 8 },
            interests: ["fashion", "beauty", "travel", "sustainability"]
          }
        },
        {
          id: "inf2",
          name: "Alex Rivera",
          handle: "alex_tech_reviews",
          platform: "youtube",
          followers: 48300,
          engagementRate: 3.1,
          location: "San Francisco, USA",
          contentTypes: ["video", "review"],
          niche: "technology",
          tags: ["gadgets", "reviews", "unboxing"],
          pricePerPost: 850,
          matchScore: 78,
          matchFactors: {
            metricsMatch: 88,
            locationMatch: 70,
            nicheMatch: 65,
            contentTypeMatch: 80,
            audienceMatch: 82,
            brandAlignmentScore: 75
          }
        },
        {
          id: "inf3",
          name: "Sophie Chang",
          handle: "sophieeats",
          platform: "instagram",
          followers: 8500,
          engagementRate: 6.7,
          location: "Chicago, USA",
          contentTypes: ["image", "reel"],
          niche: "food",
          tags: ["recipes", "foodie", "homecooking"],
          pricePerPost: 180,
          matchScore: 85,
          matchFactors: {
            metricsMatch: 82,
            locationMatch: 88,
            nicheMatch: 75,
            contentTypeMatch: 95,
            audienceMatch: 84,
            brandAlignmentScore: 88
          }
        },
        {
          id: "inf4",
          name: "James Wilson",
          handle: "jamesfitlife",
          platform: "tiktok",
          followers: 125000,
          engagementRate: 5.3,
          location: "Miami, USA",
          contentTypes: ["video", "tutorial"],
          niche: "fitness",
          tags: ["workout", "nutrition", "motivation"],
          pricePerPost: 1200,
          matchScore: 73,
          matchFactors: {
            metricsMatch: 90,
            locationMatch: 65,
            nicheMatch: 60,
            contentTypeMatch: 75,
            audienceMatch: 70,
            brandAlignmentScore: 72
          }
        },
        {
          id: "inf5",
          name: "Olivia Parker",
          handle: "oliviaparker",
          platform: "instagram",
          followers: 22400,
          engagementRate: 3.8,
          location: "London, UK",
          contentTypes: ["image", "story"],
          niche: "fashion",
          tags: ["highfashion", "luxury", "streetstyle"],
          pricePerPost: 450,
          matchScore: 81,
          matchFactors: {
            metricsMatch: 84,
            locationMatch: 60,
            nicheMatch: 90,
            contentTypeMatch: 85,
            audienceMatch: 80,
            brandAlignmentScore: 86
          }
        },
        {
          id: "inf6",
          name: "David Chen",
          handle: "dave.tech",
          platform: "youtube",
          followers: 67000,
          engagementRate: 2.9,
          location: "Seattle, USA",
          contentTypes: ["video", "review"],
          niche: "technology",
          tags: ["software", "productivity", "apps"],
          pricePerPost: 1100,
          matchScore: 68,
          matchFactors: {
            metricsMatch: 78,
            locationMatch: 75,
            nicheMatch: 60,
            contentTypeMatch: 65,
            audienceMatch: 62,
            brandAlignmentScore: 70
          }
        }
      ];
      
      // Apply enhanced AI matching based on offer criteria
      // This version prioritizes content style and brand values
      let enhancedInfluencers = [...sampleInfluencers];
      
      // Define content style categories for better matching
      const contentStyles: Record<string, string[]> = {
        "minimalist": ["clean", "simple", "elegant", "modern"],
        "vibrant": ["colorful", "energetic", "bold", "bright"],
        "authentic": ["candid", "genuine", "natural", "real"],
        "premium": ["luxury", "high-end", "sophisticated", "polished"],
        "casual": ["relaxed", "everyday", "approachable", "friendly"],
        "professional": ["corporate", "business", "formal", "expert"]
      };
      
      // Define brand values for better alignment
      const brandValues: Record<string, string[]> = {
        "sustainability": ["eco-friendly", "green", "ethical", "sustainable"],
        "innovation": ["tech", "cutting-edge", "modern", "innovative"],
        "community": ["local", "community", "support", "together"],
        "quality": ["premium", "excellence", "craftsmanship", "best"],
        "affordability": ["value", "budget", "accessible", "affordable"],
        "inclusivity": ["diverse", "inclusive", "for everyone", "all"]
      };
      
      // Extract tags from the offer criteria and influencer profiles
      const offerTags = offerCriteria.tags || [];
      
      // Implement the enhanced matching algorithm with content style focus
      enhancedInfluencers = enhancedInfluencers.map(inf => {
        let updatedMatchScore = inf.matchScore;
        let updatedFactors = {...inf.matchFactors};
        
        // 1. Enhanced category/niche matching with content style consideration
        if (offerCriteria.category) {
          // Direct niche match gets a significant boost
          if (inf.niche.toLowerCase() === offerCriteria.category?.toLowerCase()) {
            updatedMatchScore += 8; // Increased from 5 to prioritize niche relevance
            updatedFactors.nicheMatch = Math.min(100, updatedFactors.nicheMatch + 15);
          }
          
          // Related categories also get some credit (e.g., beauty and fashion)
          const relatedNiches: Record<string, string[]> = {
            "beauty": ["fashion", "lifestyle", "wellness"],
            "fashion": ["beauty", "lifestyle", "design"],
            "food": ["cooking", "restaurant", "wellness", "lifestyle"],
            "fitness": ["health", "wellness", "sports"],
            "technology": ["gaming", "science", "education"],
            "travel": ["lifestyle", "photography", "culture"]
          };
          
          const category = offerCriteria.category.toLowerCase();
          const relatedToCategory = relatedNiches[category as keyof typeof relatedNiches] || [];
          
          if (relatedToCategory.includes(inf.niche.toLowerCase())) {
            updatedMatchScore += 3;
            updatedFactors.nicheMatch = Math.min(100, updatedFactors.nicheMatch + 8);
          }
        }
        
        // 2. Enhanced content style matching - highly important for brand consistency
        // Check if influencer's tags match any content style categories
        const influencerStyleTags = inf.tags.join(" ").toLowerCase();
        let styleMatches = 0;
        let matchedStyles: string[] = [];
        
        Object.entries(contentStyles).forEach(([style, keywords]) => {
          const styleKeywordMatches = keywords.filter((keyword: string) => 
            influencerStyleTags.includes(keyword)
          );
          
          if (styleKeywordMatches.length > 0) {
            styleMatches++;
            matchedStyles.push(style);
          }
        });
        
        // If offer tags contain style keywords, boost relevant creators
        if (styleMatches > 0 && offerTags.length > 0) {
          const offerStyleText = offerTags.join(" ").toLowerCase();
          
          matchedStyles.forEach((style: string) => {
            const styleKeywords = contentStyles[style as keyof typeof contentStyles];
            const matchingStyleKeywords = styleKeywords.filter((keyword: string) => 
              offerStyleText.includes(keyword)
            );
            
            if (matchingStyleKeywords.length > 0) {
              updatedMatchScore += 5; // Significant boost for style matching
              updatedFactors.brandAlignmentScore = Math.min(100, updatedFactors.brandAlignmentScore + 12);
            }
          });
        }
        
        // 3. Brand values alignment - crucial for authentic partnerships
        let valueMatches = 0;
        
        Object.entries(brandValues).forEach(([value, keywords]) => {
          const influencerHasValue = keywords.some(keyword => 
            influencerStyleTags.includes(keyword)
          );
          
          const offerHasValue = offerTags.some(tag => 
            keywords.some(keyword => tag.toLowerCase().includes(keyword))
          );
          
          if (influencerHasValue && offerHasValue) {
            valueMatches++;
          }
        });
        
        // Boost score based on shared values
        if (valueMatches > 0) {
          updatedMatchScore += valueMatches * 3;
          updatedFactors.brandAlignmentScore = Math.min(100, updatedFactors.brandAlignmentScore + (valueMatches * 7));
        }
        
        return {
          ...inf,
          matchScore: Math.min(100, updatedMatchScore),
          matchFactors: updatedFactors
        };
      });
      
      // Apply filters
      const filteredInfluencers = enhancedInfluencers.filter(inf => 
        inf.matchScore >= filters.minMatchScore &&
        inf.followers >= filters.minFollowers &&
        inf.followers <= filters.maxFollowers &&
        inf.engagementRate >= filters.minEngagement &&
        filters.platforms.includes(inf.platform) &&
        (filters.location === "" || inf.location.toLowerCase().includes(filters.location.toLowerCase())) &&
        (filters.niche === "" || inf.niche.toLowerCase() === filters.niche.toLowerCase()) &&
        (filters.contentType === "" || inf.contentTypes.includes(filters.contentType))
      );
      
      // Sort by match score
      const sortedInfluencers = filteredInfluencers.sort((a, b) => b.matchScore - a.matchScore);
      
      setMatches(sortedInfluencers);
      setSearching(false);
      
      if (sortedInfluencers.length > 0) {
        toast({
          title: "Influencer matching complete",
          description: `Found ${sortedInfluencers.length} compatible influencers`
        });
      } else {
        toast({
          title: "No matches found",
          description: "Try adjusting your criteria or filters",
          variant: "destructive"
        });
      }
    }, 1500);
  };
  
  // Format follower numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };
  
  const handleInfluencerSelect = (influencer: InfluencerMatch) => {
    setSelectedInfluencer(influencer);
    if (onInfluencerSelected) {
      onInfluencerSelected(influencer);
    }
  };
  
  // Get platform icon
  const getPlatformIcon = (platform: 'instagram' | 'tiktok' | 'youtube') => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'tiktok':
        return <span className="text-black dark:text-white font-bold text-xs">TT</span>;
      case 'youtube':
        return <span className="text-red-500 font-bold text-xs">YT</span>;
      default:
        return null;
    }
  };
  
  useEffect(() => {
    // Run search when component mounts with initial criteria
    generateInfluencers();
  }, []);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Smart Influencer Matcher
        </CardTitle>
        <CardDescription>
          AI-powered matching to find the perfect creator fit
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filters section */}
          <div className="space-y-3 md:col-span-1">
            <h3 className="text-sm font-medium flex items-center">
              <Filter className="h-4 w-4 mr-1.5" />
              Matching Filters
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="match-score" className="text-xs flex justify-between">
                  <span>Minimum Match Score</span>
                  <span className="font-medium">{filters.minMatchScore}%</span>
                </Label>
                <Slider 
                  id="match-score"
                  min={50} 
                  max={95}
                  step={5}
                  value={[filters.minMatchScore]}
                  onValueChange={(values) => setFilters({...filters, minMatchScore: values[0]})}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="platforms" className="text-xs">Platforms</Label>
                <div className="flex gap-1">
                  {['instagram', 'tiktok', 'youtube'].map(platform => (
                    <Button 
                      key={platform}
                      type="button"
                      variant={filters.platforms.includes(platform) ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        const newPlatforms = filters.platforms.includes(platform)
                          ? filters.platforms.filter(p => p !== platform)
                          : [...filters.platforms, platform];
                        
                        // Ensure at least one platform is selected
                        if (newPlatforms.length > 0) {
                          setFilters({...filters, platforms: newPlatforms});
                        }
                      }}
                    >
                      {platform === 'instagram' && <Instagram className="h-3 w-3 mr-1" />}
                      {platform === 'tiktok' && <span className="font-bold text-xs mr-1">TT</span>}
                      {platform === 'youtube' && <span className="text-red-500 font-bold text-xs mr-1">YT</span>}
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="min-followers" className="text-xs">Min Followers</Label>
                  <Select 
                    value={filters.minFollowers.toString()} 
                    onValueChange={(val) => setFilters({...filters, minFollowers: parseInt(val)})}
                  >
                    <SelectTrigger id="min-followers" className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1K+</SelectItem>
                      <SelectItem value="5000">5K+</SelectItem>
                      <SelectItem value="10000">10K+</SelectItem>
                      <SelectItem value="50000">50K+</SelectItem>
                      <SelectItem value="100000">100K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="min-engagement" className="text-xs">Min Engagement</Label>
                  <Select 
                    value={filters.minEngagement.toString()} 
                    onValueChange={(val) => setFilters({...filters, minEngagement: parseFloat(val)})}
                  >
                    <SelectTrigger id="min-engagement" className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1%+</SelectItem>
                      <SelectItem value="2">2%+</SelectItem>
                      <SelectItem value="3">3%+</SelectItem>
                      <SelectItem value="4">4%+</SelectItem>
                      <SelectItem value="5">5%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={generateInfluencers}
                disabled={searching}
              >
                {searching ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1.5" />
                    Apply Filters
                  </>
                )}
              </Button>
            </div>
            
            {/* Match Explanation */}
            <div className="mt-4 space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium">AI Match Factors</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1.5 text-blue-500" />
                    Metrics Match
                  </span>
                  <span className="text-muted-foreground">Followers & engagement</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5 text-red-500" />
                    Location Match
                  </span>
                  <span className="text-muted-foreground">Geographical relevance</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1.5 text-green-500" />
                    Niche Match
                  </span>
                  <span className="text-muted-foreground">Content category fit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Image className="h-3 w-3 mr-1.5 text-purple-500" />
                    Content Type
                  </span>
                  <span className="text-muted-foreground">Media format alignment</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Heart className="h-3 w-3 mr-1.5 text-pink-500" />
                    Brand Alignment
                  </span>
                  <span className="text-muted-foreground">Values & aesthetic</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results section */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-medium flex justify-between items-center">
              <span className="flex items-center">
                <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                Matched Influencers
              </span>
              <span className="text-xs text-muted-foreground">
                {matches.length} results
              </span>
            </h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {searching ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Finding ideal matches...</span>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No matching influencers found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                matches.map((influencer) => (
                  <Card 
                    key={influencer.id} 
                    className={`overflow-hidden hover:border-primary/50 transition-colors cursor-pointer ${
                      selectedInfluencer?.id === influencer.id ? 'ring-1 ring-primary' : ''
                    }`}
                    onClick={() => handleInfluencerSelect(influencer)}
                  >
                    <CardContent className="p-4">
                      {/* Updated Creator Card with beginner-friendly design */}
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        {/* Left: Match quality indicator */}
                        <div className="flex-shrink-0 mb-2 sm:mb-0 flex flex-col items-center">
                          <div className="mb-1 bg-primary/10 rounded-full p-1">
                            <MatchScoreDisplay 
                              score={influencer.matchScore} 
                              factors={influencer.matchFactors}
                              size="sm" 
                              showDetails={false}
                            />
                          </div>
                          <div className="text-xs font-medium text-center">
                            {influencer.matchScore >= 85 ? 'Perfect fit' : 
                             influencer.matchScore >= 75 ? 'Great match' : 
                             influencer.matchScore >= 65 ? 'Good fit' : 'Potential match'}
                          </div>
                        </div>
                        
                        {/* Creator profile with beginner-friendly labels */}
                        <div className="flex-1 min-w-0">
                          {/* Creator name and platform with clearer labeling */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-2">
                            <h4 className="font-medium">{influencer.name}</h4>
                            <Badge variant="outline" className="text-xs py-0 px-2 gap-1 w-fit">
                              {getPlatformIcon(influencer.platform)}
                              <span>{influencer.platform} creator</span>
                            </Badge>
                          </div>
                          
                          {/* Key metrics with explanations for beginners */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-2">
                            <div className="flex flex-col">
                              <span className="flex items-center text-xs font-medium">
                                <Users className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                Audience Size
                              </span>
                              <span className="text-sm pl-5">
                                {formatNumber(influencer.followers)} followers
                              </span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="flex items-center text-xs font-medium">
                                <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                                Engagement Rate
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="ml-1 text-muted-foreground inline-flex">
                                        <Info className="h-3 w-3" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">
                                        This shows how active their audience is. 
                                        Higher is better! 3-6% is good, above 6% is excellent.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                              <span className="text-sm pl-5">
                                {influencer.engagementRate}% 
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({influencer.engagementRate < 2 ? 'low' : 
                                    influencer.engagementRate > 5 ? 'excellent' : 'good'})
                                </span>
                              </span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="flex items-center text-xs font-medium">
                                <MapPin className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                                Location
                              </span>
                              <span className="text-sm pl-5 truncate">
                                {influencer.location}
                              </span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="flex items-center text-xs font-medium">
                                <Tag className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                                Content Style
                              </span>
                              <span className="text-sm pl-5">
                                {influencer.niche}
                              </span>
                            </div>
                          </div>
                          
                          {/* Content style tags with friendly indicator */}
                          <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                            <span className="text-xs text-muted-foreground mr-1">Content tags:</span>
                            {influencer.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {tag}
                              </Badge>
                            ))}
                            {influencer.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{influencer.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Pricing with clearer explanation */}
                        <div className="flex-shrink-0 mt-2 sm:mt-0 pl-2 sm:text-right text-left border-l border-muted sm:self-stretch flex flex-col justify-center">
                          <span className="font-semibold block text-base text-primary">${influencer.pricePerPost}</span>
                          <span className="text-xs text-muted-foreground">per post</span>
                          <div className="mt-2 text-xs flex items-center justify-end">
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-muted-foreground">Available now</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <Zap className="h-3 w-3 mr-1 text-primary" />
          <span>AI-powered creator matching</span>
        </div>
        <div>
          {new Date().toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}