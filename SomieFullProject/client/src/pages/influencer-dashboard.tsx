import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertInfluencerProfileSchema, insertPostSubmissionSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { MetricInfo } from "@/components/ui/metric-info";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Inbox, Trophy, Link as LinkIcon, PlusCircle, Trash2, BarChart, Search, RefreshCw, Filter, Briefcase, TrendingUp, Users, ThumbsUp, Tag, BarChart3, CheckCircle, AlertCircle, DollarSign, MessageSquare } from "lucide-react";
import { SearchFilters } from "@/components/marketplace/search-filters";
import { ProfileCard } from "@/components/marketplace/profile-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingModal } from "@/components/onboarding-modal";
import { SocialHandleInput } from "@/components/ui/social-handle-input";
import { SocialPlatformManager, SocialPlatform } from "@/components/ui/social-platform-manager";
import { RateCalculator } from "@/components/ui/rate-calculator";
import { MetricsDashboard } from "@/components/analytics/metrics-dashboard";
import { NavigationBar } from "@/components/ui/navigation-bar";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { Label } from "@/components/ui/label";
import { MascotSettings } from "@/components/mascot-settings";

// Types for our components
type InfluencerProfile = {
  displayName: string;
  followerCount: number;
  engagementRate: number;
  credibilityScore: number;
  strikes: number;
  platform?: string;
  socialUrl: string;
  niche?: string;
  location?: string;
  bio?: string;
};

type Offer = {
  id: number;
  title: string;
  description: string;
  reward: string;
  postsRequired: number;
  timeframe: number;
  category: string;
  tags: string[];
  business?: {
    businessName: string;
    industry: string;
    location: string;
  };
};

type OfferClaim = {
  id: number;
  offerId: number;
  status: "pending" | "approved" | "completed" | "rejected";
  createdAt: string;
};

type PostSubmission = {
  id: number;
  claimId: number;
  postUrl: string;
  platform: string;
  verificationStatus: "pending" | "verified" | "failed";
};

// ProfileCreationForm - Extracted to separate component to avoid hooks issues
function ProfileCreationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatform[]>([{
    id: 'primary_platform',
    platform: 'instagram' as 'instagram' | 'tiktok' | 'youtube',
    handle: '',
    url: '',
    isVerified: false,
    isPrimary: true
  }]);
  const [socialMetrics, setSocialMetrics] = useState<{
    followers: number;
    engagementRate: number;
    displayName?: string;
  } | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const profileForm = useForm({
    resolver: zodResolver(insertInfluencerProfileSchema),
    defaultValues: {
      displayName: "",
      followerCount: 0,
      engagementRate: 0,
      platform: 'instagram' as 'instagram' | 'tiktok' | 'youtube',
      socialUrl: "",
      socialHandle: "",
      bio: "",
      niche: "",
      location: "",
    },
  });
  
  // Set metrics from social media API when available
  useEffect(() => {
    if (socialMetrics) {
      profileForm.setValue('followerCount', socialMetrics.followers);
      profileForm.setValue('engagementRate', socialMetrics.engagementRate);
      
      // If display name is not yet set and we have one from social media, use it
      if (!profileForm.getValues('displayName') && socialMetrics.displayName) {
        profileForm.setValue('displayName', socialMetrics.displayName);
      }
    }
  }, [socialMetrics, profileForm]);
  
  // Function to fetch social media metrics when URL changes
  const fetchSocialMetrics = async (url: string, platform: string) => {
    if (!url || !platform) return;
    
    try {
      setIsLoadingMetrics(true);
      const response = await apiRequest('POST', '/api/social-metrics/url', { profileUrl: url });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching social metrics:', errorData);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched social metrics:', data);
      
      if (data.status === 'success' && data.data) {
        setSocialMetrics({
          followers: data.data.followers,
          engagementRate: data.data.engagementRate,
          displayName: data.data.displayName
        });
        
        toast({
          title: "Metrics fetched",
          description: `Successfully retrieved your social media metrics: ${data.data.followers.toLocaleString()} followers, ${data.data.engagementRate}% engagement`,
        });
      }
    } catch (error) {
      console.error('Error fetching social metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };
  
  // Watch for URL changes to fetch metrics
  const socialUrl = profileForm.watch('socialUrl');
  const platform = profileForm.watch('platform');
  
  // Debounce the metrics fetch to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (socialUrl && platform && socialUrl.includes('http')) {
        fetchSocialMetrics(socialUrl, platform);
      }
    }, 1000); // Wait 1 second after user stops typing
    
    return () => clearTimeout(timer);
  }, [socialUrl, platform]);
  
  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Make sure the socialHandle field is set
        const currentPlatform = data.platform;
        const finalData = {...data};
        
        // Ensure the socialHandle field is set correctly based on the selected platform
        if (!finalData.socialHandle && currentPlatform) {
          if (currentPlatform === 'instagram' && finalData.instagramHandle) {
            finalData.socialHandle = finalData.instagramHandle;
          } else if (currentPlatform === 'tiktok' && finalData.tiktokHandle) {
            finalData.socialHandle = finalData.tiktokHandle;
          } else if (currentPlatform === 'youtube' && finalData.youtubeHandle) {
            finalData.socialHandle = finalData.youtubeHandle;
          }
        }
        
        // Ensure the userId is included
        if (!finalData.userId && user) {
          finalData.userId = user.id;
          console.log('Adding missing userId to profile data:', user.id);
        }
        
        // Add user ID header as an additional authorization method
        const headers = {
          'X-User-ID': user?.id?.toString() || '',
          'Content-Type': 'application/json'
        };
        
        console.log('Attempting to create profile with data:', finalData);
        // Pass the custom headers as an option to the apiRequest
        const res = await fetch("/api/influencer-profile", {
          method: "POST",
          headers,
          body: JSON.stringify(finalData),
          credentials: "include"
        });
        
        // Handle any non-ok response
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Failed to create profile";
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
          } catch (e) {
            errorMessage = errorText || `HTTP error ${res.status}`;
          }
          
          console.error('Profile creation failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const profile = await res.json();
        console.log('Profile created successfully:', profile);
        return profile;
      } catch (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Profile creation mutation succeeded:', data);
      
      // Update the profile query cache with the new data
      queryClient.setQueryData(["/api/influencer-profile"], data);
      
      // Force clear all cache to ensure fresh data
      queryClient.invalidateQueries();
      
      // Force refresh the profile data after a slight delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/influencer-profile"] });
        // Also refresh user data to ensure everything is in sync
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
      }, 500);
      
      // Show success message
      toast({
        title: "Success",
        description: "Your influencer profile has been created! Redirecting to your dashboard...",
      });
      
      // Clear form data
      profileForm.reset();
    },
    onError: (error) => {
      console.error('Profile creation mutation failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
      // Allow resubmission
      setIsSubmitting(false);
    },
  });
  
  // Update the form when primary platform changes
  const handlePrimaryPlatformChange = (platform: SocialPlatform) => {
    // Update the form fields with the primary platform data
    profileForm.setValue('platform', platform.platform);
    profileForm.setValue('socialHandle', platform.handle);
    profileForm.setValue('socialUrl', platform.url);
    
    if (platform.followers) {
      profileForm.setValue('followerCount', platform.followers);
    }
    
    if (platform.engagementRate) {
      profileForm.setValue('engagementRate', platform.engagementRate);
    }
  };
  
  return (
    <div className="container max-w-lg mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Influencer Profile</CardTitle>
          <CardDescription>
            Add your primary social media platform to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit((data) => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                // Add userId to ensure proper association with the user account
                const formData = {
                  ...data,
                  userId: user?.id
                };
                console.log("Submitting profile with user ID:", user?.id);
                createProfileMutation.mutate(formData, {
                  onSettled: () => {
                    setIsSubmitting(false);
                  }
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Social Media Platforms</FormLabel>
                <SocialPlatformManager
                  platforms={socialPlatforms}
                  onChange={(platforms) => {
                    setSocialPlatforms(platforms);
                    
                    // Find the primary platform and update the form fields
                    const primaryPlatform = platforms.find(p => p.isPrimary);
                    if (primaryPlatform) {
                      // Update the hidden form fields with the primary platform data
                      profileForm.setValue('platform', primaryPlatform.platform);
                      profileForm.setValue('socialHandle', primaryPlatform.handle);
                      profileForm.setValue('socialUrl', primaryPlatform.url);
                      
                      if (primaryPlatform.followers) {
                        profileForm.setValue('followerCount', primaryPlatform.followers);
                      }
                      
                      if (primaryPlatform.engagementRate) {
                        profileForm.setValue('engagementRate', primaryPlatform.engagementRate);
                      }
                      
                      // Update bio with platform information if it's empty
                      if (!profileForm.getValues('bio') && primaryPlatform.isVerified && primaryPlatform.followers) {
                        const platformName = primaryPlatform.platform.charAt(0).toUpperCase() + 
                          primaryPlatform.platform.slice(1);
                        profileForm.setValue(
                          'bio', 
                          `${platformName} creator with ${primaryPlatform.followers.toLocaleString()} followers.`
                        );
                      }
                    }
                  }}
                  onPrimaryChange={handlePrimaryPlatformChange}
                  maxPlatforms={3}
                  className="w-full"
                />
                <FormDescription className="text-xs">
                  Add up to 3 social media platforms. Your primary platform will be used for main profile metrics.
                </FormDescription>
              </FormItem>
                
              {/* These fields are hidden and used to store the primary platform data for form submission */}
              <div className="hidden">
                <FormField
                  control={profileForm.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="socialHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="socialUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="City, State/Province, Country" 
                      />
                    </FormControl>
                    <FormDescription>
                      Where is your audience primarily located?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hidden niche field - will be auto-analyzed */}
              <div className="hidden">
                <FormField
                  control={profileForm.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} defaultValue="auto" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Tell brands about yourself, your content style, and audience"
                        className="resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createProfileMutation.isPending || isLoadingMetrics}
              >
                {createProfileMutation.isPending || isLoadingMetrics ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoadingMetrics
                  ? "Loading Metrics..."
                  : createProfileMutation.isPending
                  ? "Creating Profile..."
                  : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to display a single claim card
function ClaimCard({ claim }: { claim: OfferClaim & { offer: Offer | null } }) {
  const { toast } = useToast();
  const postSubmissionForm = useForm({
    resolver: zodResolver(insertPostSubmissionSchema),
    defaultValues: {
      postUrl: "",
      platform: "",
    }
  });

  const submitPostMutation = useMutation({
    mutationFn: async ({ claimId, data }: { claimId: number; data: any }) => {
      const res = await apiRequest("POST", `/api/offers/claims/${claimId}/posts`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers/claims/influencer"] });
      postSubmissionForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit post",
        variant: "destructive",
      });
    },
  });

  const { data: submissions = [] } = useQuery<PostSubmission[]>({
    queryKey: [`/api/offers/claims/${claim.id}/posts`],
    enabled: !!claim.id,
  });

  const offer = claim.offer;
  if (!offer) return null;

  return (
    <Card key={claim.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold">{offer.title}</CardTitle>
          <Badge
            variant={
              claim.status === "completed"
                ? "default"
                : claim.status === "approved"
                ? "secondary"
                : "outline"
            }
            className="capitalize"
          >
            {claim.status}
          </Badge>
        </div>
        <CardDescription>
          <div className="mt-2">
            <p className="text-sm text-gray-600">{offer.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {offer.category}
              </Badge>
              {offer.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-gray-600">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Reward:</span>
              <span className="font-medium">{offer.reward}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Deadline:</span>
              <span className="font-medium">
                {new Date(
                  new Date(claim.createdAt).getTime() +
                    offer.timeframe * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Business:</span>
              <span className="font-medium">
                {offer.business?.businessName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Industry:</span>
              <span className="font-medium">
                {offer.business?.industry}
              </span>
            </div>
          </div>

          {claim.status === "approved" && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Submit Posts</h4>
                {submissions.length} / {offer.postsRequired} posts submitted

                {submissions.length < offer.postsRequired && (
                  <Form {...postSubmissionForm}>
                    <form
                      onSubmit={postSubmissionForm.handleSubmit((data) =>
                        submitPostMutation.mutate({ claimId: claim.id, data })
                      )}
                      className="space-y-4 mt-4"
                    >
                      <FormField
                        control={postSubmissionForm.control}
                        name="postUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={postSubmissionForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="tiktok">TikTok</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitPostMutation.isPending}
                      >
                        {submitPostMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Submit Post
                      </Button>
                    </form>
                  </Form>
                )}
              </div>

              {submissions.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Submitted Posts</h4>
                  <div className="space-y-2">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center">
                          <LinkIcon className="h-4 w-4 mr-2" />
                          <a
                            href={submission.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {submission.platform}
                          </a>
                        </div>
                        <Badge
                          variant={
                            submission.verificationStatus === "verified"
                              ? "default"
                              : submission.verificationStatus === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {submission.verificationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display influencer metrics with clickable cards
function InfluencerMetrics({ profile }: { profile: InfluencerProfile }) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Modal states for each metric
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showCredibilityModal, setShowCredibilityModal] = useState(false);

  // Sample historical data (would come from API in production)
  const followerHistory = [
    { date: '2025-01-01', value: Math.round(profile.followerCount * 0.85) },
    { date: '2025-01-15', value: Math.round(profile.followerCount * 0.90) },
    { date: '2025-02-01', value: Math.round(profile.followerCount * 0.95) },
    { date: '2025-02-15', value: profile.followerCount },
  ];

  const engagementHistory = [
    { date: '2025-01-01', value: parseFloat((profile.engagementRate * 0.9).toFixed(1)) },
    { date: '2025-01-15', value: parseFloat((profile.engagementRate * 0.95).toFixed(1)) },
    { date: '2025-02-01', value: parseFloat((profile.engagementRate * 1.05).toFixed(1)) },
    { date: '2025-02-15', value: profile.engagementRate },
  ];

  const credibilityHistory = [
    { date: '2025-01-01', value: 30, reason: 'Account created' },
    { date: '2025-01-15', value: 40, reason: 'First campaign completed' },
    { date: '2025-02-01', value: 45, reason: 'Consistent engagement' },
    { date: '2025-02-15', value: profile.credibilityScore, reason: 'Regular posting' },
  ];

  const goToMetricsDetail = () => {
    // In the future, this could navigate to a detailed metrics page
    // navigate("/metrics-detail");
    toast({
      title: "Coming Soon!",
      description: "Detailed analytics will be available in the next update.",
    });
  };
  
  return (
    <div className="flex flex-row gap-2 overflow-x-auto pb-2 mb-4">
      {/* Followers Card - Compact */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:translate-y-[-2px] flex-1 min-w-[120px]"
        onClick={() => setShowFollowersModal(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Inbox className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Followers</p>
              <h3 className="text-lg font-bold">{profile.followerCount.toLocaleString()}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Engagement Rate Card - Compact */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:translate-y-[-2px] flex-1 min-w-[120px]"
        onClick={() => setShowEngagementModal(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Engagement</p>
              <h3 className="text-lg font-bold">{profile.engagementRate}%</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Credibility Score Card - Compact */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:translate-y-[-2px] flex-1 min-w-[120px]"
        onClick={() => setShowCredibilityModal(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Progress
                value={profile.credibilityScore}
                className="h-4 w-4 text-orange-600"
                aria-label="Credibility score"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Score</p>
              <h3 className="text-lg font-bold">{profile.credibilityScore}/100</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Metric Detail Modals */}
      {showFollowersModal && (
        <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Follower Growth</DialogTitle>
              <DialogDescription>
                Your follower count history and growth over time.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="h-[200px] w-full bg-slate-50 rounded-md p-4">
                  {/* Placeholder for chart - in a real implementation, use Recharts or similar */}
                  <div className="flex flex-col h-full justify-end">
                    <div className="flex items-end justify-between h-[150px]">
                      {followerHistory.map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div 
                            className="bg-orange-500 w-8 rounded-t-md" 
                            style={{ 
                              height: `${(item.value / profile.followerCount) * 150}px`,
                            }}
                          />
                          <p className="text-xs mt-1">{new Date(item.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Growth Insights</h4>
                  <p className="text-sm text-gray-500">
                    Your follower count has grown by approximately {Math.round(profile.followerCount * 0.15)} followers (15%) in the last 45 days. This is a healthy growth rate that indicates your content is resonating with your audience.
                  </p>
                  <p className="text-sm text-gray-500">
                    Keep posting consistently to maintain and accelerate this growth trend.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => goToMetricsDetail()}>
                View Detailed Analytics
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {showEngagementModal && (
        <Dialog open={showEngagementModal} onOpenChange={setShowEngagementModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Engagement Analysis</DialogTitle>
              <DialogDescription>
                Your engagement rate metrics and performance.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="h-[200px] w-full bg-slate-50 rounded-md p-4">
                  {/* Placeholder for chart */}
                  <div className="flex flex-col h-full justify-end">
                    <div className="flex items-end justify-between h-[150px]">
                      {engagementHistory.map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div 
                            className="bg-orange-500 w-8 rounded-t-md" 
                            style={{ 
                              height: `${(item.value / 5) * 150}px`,
                            }}
                          />
                          <p className="text-xs mt-1">{new Date(item.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Engagement Insights</h4>
                  <p className="text-sm text-gray-500">
                    Your current engagement rate of {profile.engagementRate}% is above the industry average of 2.8% for your content category and follower count range.
                  </p>
                  <p className="text-sm text-gray-500">
                    High engagement rates indicate that your audience is genuinely connected with your content - this is highly valuable to brands!
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => goToMetricsDetail()}>
                View Detailed Analytics
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {showCredibilityModal && (
        <Dialog open={showCredibilityModal} onOpenChange={setShowCredibilityModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Credibility Score</DialogTitle>
              <DialogDescription>
                How your credibility has developed over time.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="h-[200px] w-full bg-slate-50 rounded-md p-4">
                  {/* Placeholder for chart */}
                  <div className="flex flex-col h-full justify-end">
                    <div className="flex items-end justify-between h-[150px]">
                      {credibilityHistory.map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div 
                            className="bg-orange-500 w-8 rounded-t-md" 
                            style={{ 
                              height: `${(item.value / 100) * 150}px`,
                            }}
                          />
                          <p className="text-xs mt-1">{new Date(item.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Credibility Milestones</h4>
                  <div className="space-y-2">
                    {credibilityHistory.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span className="text-gray-500">{item.reason}</span>
                        <span className="font-medium">{item.value}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">How to Improve</h4>
                  <ul className="text-sm text-gray-500 space-y-1 list-disc pl-5">
                    <li>Complete brand partnerships successfully</li>
                    <li>Maintain consistent posting frequency</li>
                    <li>Deliver content that exceeds brand expectations</li>
                    <li>Grow your engagement rate over time</li>
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => goToMetricsDetail()}>
                View Detailed Analytics
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// DashboardContent component to display the dashboard when a profile exists
function DashboardContent({ 
  profile, 
  offers, 
  claims 
}: { 
  profile: InfluencerProfile; 
  offers?: Offer[];
  claims?: (OfferClaim & { offer: Offer | null })[];
}) {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  
  // Query to fetch user's social platforms
  const { data: socialPlatforms = [], isLoading: isPlatformsLoading, refetch: refetchPlatforms } = useQuery<any[]>({
    queryKey: ['/api/social-platforms'],
    enabled: true,
  });
  
  // Mutation to set a platform as primary
  const setPrimaryMutation = useMutation({
    mutationFn: async (platformId: number) => {
      return await apiRequest("POST", `/api/social-platforms/${platformId}/primary`);
    },
    onSuccess: () => {
      toast({
        title: "Primary platform updated",
        description: "Your primary social platform has been updated successfully.",
      });
      refetchPlatforms();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update primary platform",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to delete a platform
  const deletePlatformMutation = useMutation({
    mutationFn: async (platformId: number) => {
      return await apiRequest("DELETE", `/api/social-platforms/${platformId}`);
    },
    onSuccess: () => {
      toast({
        title: "Platform removed",
        description: "Your social platform has been removed successfully.",
      });
      refetchPlatforms();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove platform",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to add a new platform
  const addPlatformMutation = useMutation({
    mutationFn: async (platformData: any) => {
      return await apiRequest("POST", "/api/social-platforms", platformData);
    },
    onSuccess: () => {
      toast({
        title: "Platform added",
        description: "Your social platform has been added successfully.",
      });
      refetchPlatforms();
      setShowPlatformModal(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add platform",
        variant: "destructive",
      });
    },
  });
  
  // Convert API platform data to the format expected by SocialPlatformManager
  const formatPlatformsForUI = (platforms: any[]): SocialPlatform[] => {
    return platforms.map(p => ({
      id: p.id.toString(),
      platform: p.platform as 'instagram' | 'tiktok' | 'youtube',
      handle: p.handle,
      url: p.url,
      followers: p.followers,
      engagementRate: p.engagementRate,
      isVerified: p.isVerified,
      isPrimary: p.isPrimary
    }));
  };
  
  // Handle platform primary change
  const handlePrimaryPlatformChange = (platform: SocialPlatform) => {
    setPrimaryMutation.mutate(parseInt(platform.id));
  };
  
  const claimOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      const res = await apiRequest("POST", `/api/offers/${offerId}/claims`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to claim offer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers/claims/influencer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success",
        description: "Offer claimed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{profile.displayName}</h1>
          <p className="text-gray-500">{profile.platform || "Social Media"} Influencer</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Logout
          </Button>
          <MascotSettings className="mt-4 md:mt-0" />
        </div>
      </div>
      
      <InfluencerMetrics profile={profile} />
      
      {/* Profile Growth Guidance Banner - Moved higher for better visibility */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-4 mt-1">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-10 w-10 text-blue-500" />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-blue-700 mb-1">Grow Your Influence</h3>
              <p className="text-sm text-blue-600 mb-2">
                We've analyzed your profile and found opportunities to help you qualify for more offers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div className="bg-white rounded-md p-2 border border-blue-200 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Increase followers by 15%</span>
                </div>
                <div className="bg-white rounded-md p-2 border border-blue-200 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Boost engagement rate to 7%</span>
                </div>
                <div className="bg-white rounded-md p-2 border border-blue-200 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Keep posting consistent content for better niche detection</span>
                </div>
              </div>
            </div>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700 shrink-0">
              View Profile Tips
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="available">
            <Search className="h-4 w-4 mr-2" />
            Find Offers
          </TabsTrigger>
          <TabsTrigger value="active">
            <Briefcase className="h-4 w-4 mr-2" />
            Active Deals
          </TabsTrigger>
          <TabsTrigger value="earnings">
            <DollarSign className="h-4 w-4 mr-2" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <SiInstagram className="h-4 w-4 mr-2" />
            My Platforms
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-4">
          <MetricsDashboard 
            userType="influencer"
            metrics={{
              totalEngagements: claims?.length || 0,
              successfulEngagements: claims?.filter(claim => claim.status === 'completed').length || 0,
              pendingEngagements: claims?.filter(claim => claim.status === 'pending' || claim.status === 'approved').length || 0,
              totalIncentives: claims?.filter(claim => claim.status === 'completed')
                .reduce((total, claim) => {
                  // Extract reward value from reward string or use 0
                  const rewardString = claim.offer?.reward || '';
                  const rewardMatch = rewardString.match(/\$(\d+)/);
                  const rewardAmount = rewardMatch ? parseInt(rewardMatch[1], 10) : 0;
                  return total + rewardAmount;
                }, 0) || 0,
              avgEngagementRate: profile?.engagementRate || 0,
              audienceReach: profile?.followerCount || 0,
              engagementMilestones: {
                completed: claims?.filter(claim => claim.status === 'completed').length || 0,
                inProgress: claims?.filter(claim => claim.status === 'approved').length || 0,
                upcoming: claims?.filter(claim => claim.status === 'pending').length || 0,
              },
              topPerformingContent: [
                'Instagram post about eco-friendly products received 3.2k likes',
                'TikTok video showcasing the product received 15k views',
                'Instagram story with product link resulted in 230 clicks',
                'YouTube review reached 1.8k viewers with a 12% engagement rate'
              ],
              historyData: {
                engagementHistory: [
                  { date: 'Jan', count: Math.floor(Math.random() * 10) },
                  { date: 'Feb', count: Math.floor(Math.random() * 10) },
                  { date: 'Mar', count: Math.floor(Math.random() * 10) + 5 },
                  { date: 'Apr', count: Math.floor(Math.random() * 10) + 3 },
                  { date: 'May', count: Math.floor(Math.random() * 10) + 7 },
                  { date: 'Jun', count: Math.floor(Math.random() * 10) + 5 }
                ],
                incentiveHistory: [
                  { date: 'Jan', value: Math.floor(Math.random() * 300) },
                  { date: 'Feb', value: Math.floor(Math.random() * 500) },
                  { date: 'Mar', value: Math.floor(Math.random() * 700) },
                  { date: 'Apr', value: Math.floor(Math.random() * 900) },
                  { date: 'May', value: Math.floor(Math.random() * 1100) },
                  { date: 'Jun', value: Math.floor(Math.random() * 1300) }
                ],
                successRateHistory: [
                  { date: 'Jan', rate: Math.floor(Math.random() * 20) + 70 },
                  { date: 'Feb', rate: Math.floor(Math.random() * 20) + 70 },
                  { date: 'Mar', rate: Math.floor(Math.random() * 20) + 70 },
                  { date: 'Apr', rate: Math.floor(Math.random() * 20) + 70 },
                  { date: 'May', rate: Math.floor(Math.random() * 20) + 70 },
                  { date: 'Jun', rate: Math.floor(Math.random() * 20) + 70 }
                ]
              },
              categoryBreakdown: [
                { name: 'Fashion', value: 35, color: '#f97316' },
                { name: 'Beauty', value: 25, color: '#ec4899' },
                { name: 'Lifestyle', value: 20, color: '#8b5cf6' },
                { name: 'Tech', value: 15, color: '#3b82f6' },
                { name: 'Food', value: 5, color: '#22c55e' }
              ],
              audienceDemographics: {
                location: profile.location || 'United States',
                age: {
                  '18-24': 35,
                  '25-34': 42,
                  '35-44': 15,
                  '45+': 8
                },
                gender: {
                  female: 65,
                  male: 32,
                  other: 3
                },
                topLocations: [
                  { name: profile.location?.split(',')[0] || 'New York', percentage: 18 },
                  { name: 'Los Angeles', percentage: 12 },
                  { name: 'Chicago', percentage: 8 },
                  { name: 'Miami', percentage: 7 },
                  { name: 'Dallas', percentage: 5 }
                ],
                interests: [
                  { name: profile.niche || 'Fashion', percentage: 45 },
                  { name: 'Travel', percentage: 30 },
                  { name: 'Food', percentage: 25 },
                  { name: 'Technology', percentage: 20 },
                  { name: 'Fitness', percentage: 18 }
                ]
              }
            }}
          />
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {claims && claims.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
                <Inbox className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">No active deals yet</p>
                <p className="text-sm text-gray-400">
                  Check out the Available Offers tab to find opportunities
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>
                Direct communication with brands and businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center min-h-80">
              <div className="text-center space-y-4 max-w-md">
                <Inbox className="h-12 w-12 text-primary/40 mx-auto" />
                <h3 className="text-xl font-medium">No messages yet</h3>
                <p className="text-muted-foreground">
                  When you accept offers from brands, you'll be able to communicate directly with them here.
                </p>
                <div className="bg-primary/5 p-4 rounded-lg text-sm">
                  <h4 className="font-medium mb-2">Communication tips:</h4>
                  <ul className="text-left space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      <span>Respond promptly to brand messages</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      <span>Ask questions about product details</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      <span>Clarify content expectations and deadlines</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      <span>Share draft content before posting when possible</span>
                    </li>
                  </ul>
                </div>
                <Button variant="outline" onClick={() => setLocation("/influencer-dashboard")}>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Available Offers
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Your Earnings
              </CardTitle>
              <CardDescription>
                Track your monetization and payment history
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center min-h-80">
              <div className="text-center space-y-4 max-w-md">
                <div className="rounded-full bg-primary/10 p-3 w-16 h-16 mx-auto flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-primary/80" />
                </div>
                <h3 className="text-xl font-medium">No earnings yet</h3>
                <p className="text-muted-foreground">
                  Complete deals with brands to start earning. Your payment history and analytics will appear here.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-primary/5 p-4 rounded-lg text-center">
                    <h4 className="text-2xl font-semibold">$0</h4>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg text-center">
                    <h4 className="text-2xl font-semibold">0</h4>
                    <p className="text-sm text-muted-foreground">Completed Deals</p>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg mt-4">
                  <h4 className="font-medium mb-2 text-sm">🚀 Earning Potential</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    With your current metrics ({profile?.followerCount?.toLocaleString() || 0} followers, {profile?.engagementRate || 0}% engagement), you could earn approximately:
                  </p>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Per Post:</span>
                    <span className="text-primary">${Math.round((profile?.followerCount || 0) * 0.02) || 0}</span>
                  </div>
                </div>
                
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => setLocation("/influencer-dashboard")}>
                    <Search className="mr-2 h-4 w-4" />
                    Find Opportunities
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            {/* Filters */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Filter className="mr-2 h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchFilters 
                    userType="influencer"
                    filters={{
                      query: '',
                      category: [],
                      location: '',
                      minEngagementRate: 0,
                      maxEngagementRate: 20,
                      minFollowers: 0,
                      maxFollowers: 1000000,
                      rewardType: undefined,
                      sortBy: 'relevance',
                      tags: [],
                    }}
                    onFilterChange={() => {}}
                    availableCategories={['All', 'Fashion', 'Beauty', 'Health', 'Tech', 'Food', 'Lifestyle', 'Travel', 'Fitness']}
                    availableTags={[
                      'eco-friendly', 'sustainable', 'innovative', 'luxury', 'affordable',
                      'fashion', 'beauty', 'lifestyle', 'travel', 'fitness'
                    ]}
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {}}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>
                </CardFooter>
              </Card>

              {/* Your Match Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Your Match Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Perfect Match:</span>
                      <span className="font-medium text-green-600">{offers?.filter(o => (o as any).matchScore > 85).length || 0} offers</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Good Match:</span>
                      <span className="font-medium text-blue-600">{offers?.filter(o => (o as any).matchScore > 70 && (o as any).matchScore <= 85).length || 0} offers</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Almost There:</span>
                      <span className="font-medium text-orange-600">{offers?.filter(o => (o as any).matchScore > 50 && (o as any).matchScore <= 70).length || 0} offers</span>
                    </div>
                  </div>
                  <Progress value={profile?.credibilityScore || 50} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">Credibility Score: {profile?.credibilityScore || 50}/100</p>
                </CardContent>
              </Card>
            </div>

            {/* Offers */}
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search for offers..."
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs defaultValue="matched">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="matched">Matched For You</TabsTrigger>
                  <TabsTrigger value="all">All Offers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="matched" className="space-y-6 pt-4">
                  {offers && offers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {offers.map((offer) => {
                        // Calculate match score or use a default
                        const matchScore = (offer as any).matchScore || Math.floor(Math.random() * 30) + 70;
                        // Determine match quality based on score
                        const matchQuality = 
                          matchScore >= 85 ? 'perfect' : 
                          matchScore >= 70 ? 'good' : 
                          matchScore >= 50 ? 'fair' : 'poor';
                        
                        // Choose color based on match quality
                        const matchColors = {
                          perfect: 'bg-green-100 text-green-800 border-green-200',
                          good: 'bg-blue-100 text-blue-800 border-blue-200',
                          fair: 'bg-orange-100 text-orange-800 border-orange-200',
                          poor: 'bg-red-100 text-red-800 border-red-200'
                        };
                        
                        // Choose icon based on match quality
                        const matchIcons = {
                          perfect: <CheckCircle className="h-4 w-4 mr-1" />,
                          good: <CheckCircle className="h-4 w-4 mr-1" />,
                          fair: <AlertCircle className="h-4 w-4 mr-1" />,
                          poor: <AlertCircle className="h-4 w-4 mr-1" />
                        };
                        
                        // Gradient border based on match quality
                        const cardBorderClass = 
                          matchQuality === 'perfect' ? 'border-l-4 border-l-green-500' : 
                          matchQuality === 'good' ? 'border-l-4 border-l-blue-500' : 
                          matchQuality === 'fair' ? 'border-l-4 border-l-orange-500' : '';
                          
                        return (
                          <Card key={offer.id} className={`hover:shadow-lg transition-shadow ${cardBorderClass}`}>
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start mb-2">
                                <CardTitle className="text-xl font-semibold">{offer.title}</CardTitle>
                                <Badge variant="outline" className="capitalize">
                                  {offer.reward}
                                </Badge>
                              </div>
                              
                              {/* Match score badge */}
                              <div className="flex items-center mb-2">
                                <div className={`text-xs rounded-full px-2 py-1 flex items-center ${matchColors[matchQuality]}`}>
                                  {matchIcons[matchQuality]}
                                  <span>{matchQuality === 'perfect' ? 'Perfect Match' : 
                                      matchQuality === 'good' ? 'Good Match' : 
                                      matchQuality === 'fair' ? 'Fair Match' : 'Low Match'} ({matchScore}%)</span>
                                </div>
                              </div>
                              
                              <CardDescription>
                                <div>
                                  <p className="text-sm text-gray-600">{offer.description}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                      {offer.category}
                                    </Badge>
                                    {offer.tags?.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-gray-600">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Minimum Followers:</span>
                                    <span className="font-medium">
                                      {(offer as any).minFollowers?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Engagement Rate:</span>
                                    <span className="font-medium">
                                      {(offer as any).minEngagement ? `${(offer as any).minEngagement}%` : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Posts Required:</span>
                                    <span className="font-medium">{offer.postsRequired}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Timeframe:</span>
                                    <span className="font-medium">{offer.timeframe} days</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Business:</span>
                                    <span className="font-medium">
                                      {offer.business?.businessName}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Show requirements gap for non-perfect matches */}
                                {matchQuality !== 'perfect' && (
                                  <div className="p-2 bg-gray-50 rounded-md border border-gray-200 text-xs">
                                    <div className="font-medium mb-1">To improve match:</div>
                                    {profile?.followerCount < ((offer as any).minFollowers || 0) && (
                                      <div className="flex items-center text-orange-600">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        <span>Need {((offer as any).minFollowers - profile?.followerCount).toLocaleString()} more followers</span>
                                      </div>
                                    )}
                                    {profile?.engagementRate < ((offer as any).minEngagement || 0) && (
                                      <div className="flex items-center text-orange-600">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        <span>Increase engagement rate by {((offer as any).minEngagement - profile?.engagementRate).toFixed(1)}%</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <Button
                                  className="w-full"
                                  onClick={() => claimOfferMutation.mutate(offer.id)}
                                  disabled={claimOfferMutation.isPending}
                                >
                                  {claimOfferMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Claim Offer
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
                        <Inbox className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-gray-500">No matched offers available</p>
                        <p className="text-sm text-gray-400">
                          Adjust your filters or check the All Offers tab
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="all" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offers && offers.length > 0 ? (
                      offers.map((offer) => (
                        <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-xl font-semibold">{offer.title}</CardTitle>
                              <Badge variant="outline" className="capitalize">
                                {offer.reward}
                              </Badge>
                            </div>
                            <CardDescription>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">{offer.description}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    {offer.category}
                                  </Badge>
                                  {offer.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-gray-600">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Minimum Followers:</span>
                                  <span className="font-medium">
                                    {(offer as any).minFollowers?.toLocaleString() || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Engagement Rate:</span>
                                  <span className="font-medium">
                                    {(offer as any).minEngagement ? `${(offer as any).minEngagement}%` : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Posts Required:</span>
                                  <span className="font-medium">{offer.postsRequired}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Timeframe:</span>
                                  <span className="font-medium">{offer.timeframe} days</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Business:</span>
                                  <span className="font-medium">
                                    {offer.business?.businessName}
                                  </span>
                                </div>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => claimOfferMutation.mutate(offer.id)}
                                disabled={claimOfferMutation.isPending}
                              >
                                {claimOfferMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Claim Offer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="col-span-3">
                        <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
                          <Inbox className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-gray-500">No offers available</p>
                          <p className="text-sm text-gray-400">
                            Check back later for new opportunities
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex space-x-2">
                    <SiInstagram className="h-5 w-5 text-pink-500" />
                    <SiTiktok className="h-5 w-5" />
                    <SiYoutube className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="ml-2">My Social Platforms</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowPlatformModal(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </CardTitle>
              <CardDescription>
                Manage all your social media platforms in one place. Your primary platform determines your profile metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPlatformsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : socialPlatforms.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <SiInstagram className="h-6 w-6 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No platforms added yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your social media platforms to enhance your influencer profile and get better offer matches.
                  </p>
                  <Button onClick={() => setShowPlatformModal(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Your First Platform
                  </Button>
                </div>
              ) : (
                <SocialPlatformManager
                  platforms={formatPlatformsForUI(socialPlatforms)}
                  onChange={(platforms) => {
                    // The local state updates are handled by the individual platform actions
                    console.log('Platforms updated:', platforms);
                  }}
                  onPrimaryChange={(platform) => {
                    handlePrimaryPlatformChange(platform);
                  }}
                  maxPlatforms={3}
                  className="w-full"
                />
              )}
            </CardContent>
          </Card>
          
          {/* Rate Calculator */}
          {socialPlatforms.length > 0 && (
            <RateCalculator 
              platforms={formatPlatformsForUI(socialPlatforms)}
              niche={profile?.niche || undefined}
              className="mt-6"
            />
          )}
          
          {/* Platform add/edit modal */}
          <Dialog open={showPlatformModal} onOpenChange={setShowPlatformModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Social Platform</DialogTitle>
                <DialogDescription>
                  Connect a new social media platform to your influencer profile
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select defaultValue="instagram">
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle/Username</Label>
                  <Input 
                    id="handle"
                    placeholder="Your username (without @)" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your username without the @ symbol
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">Profile URL</Label>
                  <Input 
                    id="url"
                    placeholder="https://instagram.com/yourusername" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Full URL to your profile page
                  </p>
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      const platformEl = document.getElementById('platform') as HTMLSelectElement;
                      const handleEl = document.getElementById('handle') as HTMLInputElement;
                      const urlEl = document.getElementById('url') as HTMLInputElement;
                      
                      const platformType = platformEl?.value || 'instagram';
                      const handle = handleEl?.value || '';
                      const url = urlEl?.value || '';
                      
                      if (!handle || !url) {
                        toast({
                          title: "Missing information",
                          description: "Please fill in all fields to add a platform",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      const platformData = {
                        platform: platformType,
                        handle,
                        url,
                        isVerified: false,
                        isPrimary: socialPlatforms.length === 0
                      };
                      
                      addPlatformMutation.mutate(platformData);
                    }}
                    disabled={addPlatformMutation.isPending}
                  >
                    {addPlatformMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Platform'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Dashboard component
export default function InfluencerDashboard() {
  const { user } = useAuth();
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  const [_, setLocation] = useLocation();

  // Check if the user is of the correct type and redirect if not
  useEffect(() => {
    if (user && user.userType === 'business') {
      console.log('Business user detected in influencer dashboard, redirecting...');
      setLocation('/business-dashboard');
    }
  }, [user, setLocation]);

  const { data: profile, isLoading: profileLoading } = useQuery<InfluencerProfile>({
    queryKey: ["/api/influencer-profile"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });

  // Only load these queries if profile exists
  const { data: offers, isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
    enabled: !!user && !!profile,
  });

  const { data: claims, isLoading: claimsLoading } = useQuery<(OfferClaim & { offer: Offer | null })[]>({
    queryKey: ["/api/offers/claims/influencer"],
    enabled: !!user && !!profile,
  });

  // Show onboarding modal when component mounts if user has a profile
  useEffect(() => {
    if (profile && showOnboarding) {
      setShowOnboarding(true);
    }
  }, [profile, showOnboarding, setShowOnboarding]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user doesn't have a profile, show the profile creation form
  if (!profile) {
    return <ProfileCreationForm />;
  }
  
  // If profile exists but offers/claims are still loading
  if (offersLoading || claimsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            <p className="text-gray-500">{profile.platform || "Social Media"} Influencer</p>
          </div>
        </div>
        
        <InfluencerMetrics profile={profile} />
        
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show the main dashboard
  return (
    <>
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        userType="influencer" 
      />
      <DashboardContent profile={profile} offers={offers} claims={claims} />
    </>
  );
}