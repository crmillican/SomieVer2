import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, DollarSign, Award, BarChart3, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface RateRecommendation {
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
  benchmarks: {
    industryAverage: number;
    topPerformerRate: number;
    beginnerRate: number;
  };
  contentTypeRates: {
    post: number;
    story: number;
    reel: number;
    video: number;
  };
}

interface SocialPlatform {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  handle: string;
  url: string;
  followers?: number;
  engagementRate?: number;
  isVerified: boolean;
  isPrimary: boolean;
}

interface RateCalculatorProps {
  platforms: SocialPlatform[];
  niche?: string;
  className?: string;
}

export function RateCalculator({ platforms, niche, className = "" }: RateCalculatorProps) {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<'post' | 'story' | 'reel' | 'video'>('post');
  
  // Find primary platform for initial selection
  useEffect(() => {
    if (platforms.length > 0) {
      const primaryPlatform = platforms.find(p => p.isPrimary);
      setSelectedPlatform(primaryPlatform?.id || platforms[0].id);
    }
  }, [platforms]);
  
  // Rate calculation mutation for a single platform
  const calculateRateMutation = useMutation<RateRecommendation, Error, SocialPlatform>({
    mutationFn: async (platform: SocialPlatform) => {
      const response = await apiRequest('GET', `/api/rate-calculator/platform/${platform.platform}?followers=${platform.followers || 0}&engagementRate=${platform.engagementRate || 0}${niche ? `&niche=${niche}` : ''}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Rate calculation successful:', data);
    },
    onError: (error: Error) => {
      console.error('Rate calculation error:', error);
      toast({
        variant: "destructive",
        title: "Rate calculation failed",
        description: "We couldn't calculate rates for this platform. Please try again."
      });
    }
  });
  
  // Rate calculation for all platforms
  const { data: rateData, isLoading: isLoadingRates, isError, refetch } = useQuery<[string, RateRecommendation][]>({
    queryKey: ['/api/rate-calculator/social-platforms'],
    enabled: platforms.length > 0 && platforms.some(p => p.followers && p.engagementRate),
    refetchOnWindowFocus: false
  });
  
  // Handle individual platform rate calculation
  const handleCalculateRate = (platform: SocialPlatform) => {
    if (!platform.followers || !platform.engagementRate) {
      toast({
        variant: "destructive",
        title: "Missing metrics",
        description: "This platform doesn't have follower count or engagement rate data. Add these metrics first."
      });
      return;
    }
    
    calculateRateMutation.mutate(platform);
  };
  
  // Find the currently selected platform data
  const getSelectedPlatformData = () => {
    if (!selectedPlatform || !rateData) return null;
    
    // Ensure rateData is an array
    const rateDataArray = Array.isArray(rateData) ? rateData : [];
    if (rateDataArray.length === 0) return null;
    
    // Find the rate data for the selected platform
    const platformRateData = rateDataArray.find((item: [string, RateRecommendation]) => item[0] === selectedPlatform);
    if (!platformRateData) return null;
    
    const platformInfo = platforms.find(p => p.id === selectedPlatform);
    if (!platformInfo) return null;
    
    return {
      platform: platformInfo,
      rates: platformRateData[1]
    };
  };
  
  const selectedPlatformData = getSelectedPlatformData();
  
  // Helper to format currency amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get the appropriate rate based on content type
  const getContentTypeRate = (rates: RateRecommendation) => {
    return rates.contentTypeRates[activeContentType];
  };
  
  // Helper to get platform icon
  const getPlatformIcon = (platformType: 'instagram' | 'tiktok' | 'youtube') => {
    switch (platformType) {
      case 'instagram':
        return <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs">In</div>;
      case 'tiktok':
        return <div className="h-6 w-6 rounded-full bg-black flex items-center justify-center text-white text-xs">Tt</div>;
      case 'youtube':
        return <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs">Yt</div>;
      default:
        return <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">?</div>;
    }
  };
  
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              <span>Rates Calculator</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoadingRates}
            >
              {isLoadingRates ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
              )}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Recommended rates for your platforms based on followers, engagement, and industry benchmarks
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!platforms || platforms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Add social platforms to see rate recommendations</p>
            </div>
          ) : isLoadingRates ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">Failed to calculate rates</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : !rateData || rateData.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">No rate data available</p>
              <p className="text-sm text-muted-foreground mb-4">
                Make sure your platforms have follower count and engagement rate data
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Calculate Rates
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Platform selector */}
              <div className="flex flex-wrap gap-2">
                {platforms.map(platform => (
                  <Button
                    key={platform.id}
                    variant={selectedPlatform === platform.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="flex items-center"
                    disabled={!platform.followers || !platform.engagementRate}
                  >
                    {getPlatformIcon(platform.platform)}
                    <span className="ml-2">{platform.handle}</span>
                    {platform.isPrimary && (
                      <Badge variant="outline" className="ml-2 bg-green-50">Primary</Badge>
                    )}
                  </Button>
                ))}
              </div>
              
              {/* Selected platform rate details */}
              {selectedPlatformData && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {selectedPlatformData.platform.handle} Rate Card
                    </h3>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Rate Factors</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Platform:</span>
                              <span>×{selectedPlatformData.rates.rateFactors.platformFactor.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Followers:</span>
                              <span>×{selectedPlatformData.rates.rateFactors.followerFactor.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Engagement:</span>
                              <span>×{selectedPlatformData.rates.rateFactors.engagementFactor.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Niche:</span>
                              <span>×{selectedPlatformData.rates.rateFactors.nicheFactor.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="pt-2">
                            <h4 className="font-medium">Industry Benchmarks</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Average:</span>
                                <span>{formatCurrency(selectedPlatformData.rates.benchmarks.industryAverage)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Top performers:</span>
                                <span>{formatCurrency(selectedPlatformData.rates.benchmarks.topPerformerRate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  
                  {/* Content type tabs */}
                  <Tabs defaultValue="post" className="w-full" onValueChange={(value) => setActiveContentType(value as any)}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="post">Post</TabsTrigger>
                      <TabsTrigger value="story">Story</TabsTrigger>
                      <TabsTrigger value="reel">Reel</TabsTrigger>
                      <TabsTrigger value="video">Video</TabsTrigger>
                    </TabsList>
                    
                    {/* All content shares the same rendering, just with different rates */}
                    {['post', 'story', 'reel', 'video'].map((type) => (
                      <TabsContent key={type} value={type} className="mt-0">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 rounded-lg border">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Minimum</div>
                                <div className="text-2xl font-semibold">
                                  {formatCurrency(selectedPlatformData.rates.contentTypeRates[type as keyof typeof selectedPlatformData.rates.contentTypeRates] * 0.7)}
                                </div>
                              </div>
                              
                              <div className="text-center p-4 rounded-lg border bg-primary/5 border-primary/30">
                                <div className="text-sm font-medium text-primary mb-1">Recommended</div>
                                <div className="text-3xl font-bold text-primary">
                                  {formatCurrency(selectedPlatformData.rates.contentTypeRates[type as keyof typeof selectedPlatformData.rates.contentTypeRates])}
                                </div>
                              </div>
                              
                              <div className="text-center p-4 rounded-lg border">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Maximum</div>
                                <div className="text-2xl font-semibold">
                                  {formatCurrency(selectedPlatformData.rates.contentTypeRates[type as keyof typeof selectedPlatformData.rates.contentTypeRates] * 1.3)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start">
                      <Award className="h-5 w-5 mr-2 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Pricing Insights</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedPlatformData.platform && (
                            <>
                              With {selectedPlatformData.platform.followers?.toLocaleString() || 'your'} followers 
                              and {selectedPlatformData.platform.engagementRate || 'your'} engagement rate
                              {selectedPlatformData.platform.platform ? ` on ${selectedPlatformData.platform.platform}` : ''}, 
                              you can command rates around {formatCurrency(selectedPlatformData.rates.benchmarks.industryAverage)} per post.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0">
          <div className="text-sm text-muted-foreground">
            Updated rates help you negotiate fair compensation
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}