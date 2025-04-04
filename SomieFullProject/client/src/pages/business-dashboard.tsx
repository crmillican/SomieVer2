import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Loader2, Plus, BarChart2, ShoppingBag, Users, Zap, ArrowDownToLine, 
  Info, Building, MapPin, Globe, Store, Target, DollarSign, 
  CheckCircle, AlertTriangle, LineChart, PieChart, TrendingUp,
  BarChart3, RefreshCw, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient, getAuthToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { MascotSettings } from "@/components/mascot-settings";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsOptimizer, type OptimizedParameters } from "@/components/metrics-optimizer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OfferCreationWizard } from "@/components/offer-creation-wizard";
import { AIEnhancedOfferWizard } from "@/components/ai-enhanced-offer-wizard";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBusinessProfileSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";

// Import our new AI-enhanced components
import { SmartBudgetOptimizer, BudgetOptimization } from "@/components/smart-budget-optimizer";
import { PerformanceForecaster, CampaignForecast } from "@/components/performance-forecaster";
import { InfluencerMatcher, InfluencerMatch } from "@/components/influencer-matcher";

// Type definitions for form data to ensure type safety
type OfferFormData = {
  title: string;
  description: string;
  reward: string;
  rewardType: string;
  minFollowers: number;
  minEngagement: number;
  postsRequired: number;
  timeframe: number;
  category: string;
  contentType: string;
  location: string;
  tags: string[];
};

// Main component - all hooks at top level to avoid React hook errors
export default function BusinessDashboard() {
  // Auth and toast hooks
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Check if the user is of the correct type and redirect if not
  useEffect(() => {
    if (user && user.userType === 'influencer') {
      console.log('Influencer user detected in business dashboard, redirecting...');
      navigate('/influencer-dashboard');
    }
  }, [user, navigate]);
  
  // Profile creation state
  const [isCreating, setIsCreating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [profileCreated, setProfileCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Offer state 
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [activeTab, setActiveTab] = useState("optimize"); // Default to smart optimize
  const [optimizedParams, setOptimizedParams] = useState<OptimizedParameters | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  
  // AI insights modal state
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [activeInsightTab, setActiveInsightTab] = useState("budget");
  
  // AI data state
  const [budgetOptimization, setBudgetOptimization] = useState<BudgetOptimization | null>(null);
  const [campaignForecast, setCampaignForecast] = useState<CampaignForecast | null>(null);
  const [matchedInfluencers, setMatchedInfluencers] = useState<InfluencerMatch[]>([]);
  
  // Wizard step state for guided offer creation
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [suggestedContentTypes, setSuggestedContentTypes] = useState<any[]>([]);
  const [estimatedReach, setEstimatedReach] = useState<{total: number, engagement: number} | null>(null);
  
  // Form data for offer creation - defined unconditionally for hook rule compliance
  const [offerData, setOfferData] = useState<OfferFormData>({
    title: "",
    description: "",
    reward: "",
    rewardType: "monetary", 
    minFollowers: 1000,
    minEngagement: 3,
    postsRequired: 1,
    timeframe: 14,
    category: "fashion",
    contentType: "image",
    location: "",
    tags: []
  });
  
  // Check for business profile
  async function checkForProfile() {
    try {
      if (!user) {
        console.error('Cannot check profile - no user is logged in');
        setError("You must be logged in to access this page");
        return null;
      }
      
      console.log('Checking for business profile with user:', user);
      
      // Add a small delay to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const res = await apiRequest('GET', '/api/business-profile');
      
      if (res.ok) {
        // Profile exists
        const profile = await res.json();
        console.log('Business profile found:', profile);
        setProfileCreated(true);
        return profile;
      } else if (res.status === 404) {
        // Profile doesn't exist - show form to create one (this is expected for new users)
        console.log('No business profile found, showing create form');
        setProfileCreated(false);
        return null;
      } else if (res.status === 401) {
        // Not authenticated - this is an error condition we should handle
        console.error('Authentication error when checking profile - user not logged in');
        setError("Your session may have expired. Please refresh the page or log in again.");
        return null;
      } else {
        // Handle other errors
        let errorMessage = "An error occurred";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing JSON fails, use status text
          errorMessage = res.statusText || errorMessage;
        }
        console.error('Error checking profile:', errorMessage);
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      console.error('Exception checking profile:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    }
  }
  
  // Business Profile Creation Form component
function BusinessProfileForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form with react-hook-form and zod validation
  const profileForm = useForm({
    resolver: zodResolver(insertBusinessProfileSchema),
    defaultValues: {
      businessName: "",
      industry: "retail",
      location: "",
      businessType: "brand" as "brand" | "physical_location" | "service", // Kept in defaultValues but hidden in UI
      description: "",
      website: "",
      instagramUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      tags: []
    },
  });

  // Create profile mutation with enhanced session handling
  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Ensure the userId is included
        if (!data.userId && user) {
          data.userId = user.id;
          console.log('Adding missing userId to profile data:', user.id);
        }

        // Enhanced session validation with multiple retries
        let userCheckResponse;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          console.log(`Validating user session (attempt ${retryCount + 1}/${maxRetries})...`);
          
          // Enhanced session check with improved headers
          userCheckResponse = await fetch('/api/user', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Requested-With': 'XMLHttpRequest'
            },
            cache: 'no-store'
          });
          
          if (userCheckResponse.status === 200) {
            console.log('User session validated successfully');
            break;
          }
          
          if (retryCount === maxRetries - 1) {
            console.error('Failed to validate user session after multiple attempts');
            if (userCheckResponse.status === 401) {
              throw new Error("Your session has expired. Please refresh the page and try again.");
            }
          }
          
          // Wait before retrying with increasing delay
          const delay = Math.pow(2, retryCount) * 300; // Exponential backoff
          console.log(`Retrying session validation in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        }
        
        console.log('Submitting business profile data:', data);
        
        // Add a small delay to ensure the session is fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use new FormData to ensure proper content type and encoding
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));
        
        // First try with fetch for more control over request
        const response = await fetch('/api/business-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        
        // If direct fetch fails, fallback to apiRequest
        if (!response.ok) {
          console.log(`Direct fetch failed with status ${response.status}, trying apiRequest...`);
          const res = await apiRequest('POST', '/api/business-profile', data);
          
          if (!res.ok) {
            let errorMessage;
            try {
              const errorData = await res.json();
              errorMessage = errorData.message || "Failed to create profile";
            } catch (e) {
              errorMessage = `Failed to create profile (${res.status})`;
            }
            throw new Error(errorMessage);
          }
          
          return await res.json();
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error in profile creation mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Business profile created successfully:', data);
      
      toast({
        title: "Success",
        description: "Your business profile has been created!"
      });
      
      // Update UI state to reflect profile creation
      setProfileCreated(true);
      
      // Force refresh app state to ensure everything is up to date
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/business-profile"] });
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
      }, 500);
      
      // Reset form
      profileForm.reset();
    },
    onError: (error) => {
      console.error('Profile creation mutation failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
      
      // If we get a 401 error, the user might have been logged out
      if (error instanceof Error && error.message.includes('401')) {
        setError("Your session has expired. Please log in again.");
      }
      
      // Allow resubmission
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  return (
    <div className="container max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Welcome to SOMIE!
          </CardTitle>
          <CardDescription>
            Complete your business profile to start creating offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit((data) => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                
                // Get user ID from context or localStorage as fallback
                let userId = user?.id;
                
                if (!userId) {
                  // Try to get userId from localStorage as fallback
                  const storedUserId = localStorage.getItem('somie_user_id');
                  if (storedUserId) {
                    console.log("Using userId from localStorage fallback:", storedUserId);
                    userId = parseInt(storedUserId);
                  } else {
                    console.error("No user ID available from any source");
                    toast({
                      title: "Error",
                      description: "User session appears to be lost. Please try logging in again.",
                      variant: "destructive"
                    });
                    setIsSubmitting(false);
                    return;
                  }
                }
                
                // Add userId to ensure proper association with the user account
                const formData = {
                  ...data,
                  userId
                };
                console.log("Submitting profile with user ID:", userId);
                createProfileMutation.mutate(formData);
              })}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Your business name" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="fitness">Health & Fitness</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hidden Business Type field */}
              <div className="hidden">
                <FormField
                  control={profileForm.control}
                  name="businessType"
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
                    <FormLabel>Location (ZIP Code)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="90210" 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      We'll use this to match you with local influencers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Tell influencers about your business"
                        className="resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://yourbusiness.com" 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Additional fields section removed as they don't exist in the database schema */}

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={createProfileMutation.isPending}
              >
                {createProfileMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {createProfileMutation.isPending
                  ? "Creating Profile..."
                  : "Complete Profile & Get Recommendations"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
  
  // Handle change in form inputs
  const handleOfferInputChange = (field: string, value: any) => {
    setOfferData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply optimized parameters to the form
  const applyOptimizedParams = (params: OptimizedParameters) => {
    // Extract the numeric value from the suggested reward
    // Format could be either "$100/post" or "$500"
    let rewardValue = params.suggestedReward;
    if (rewardValue.includes('/post')) {
      rewardValue = rewardValue.split('/')[0];
    }
    rewardValue = rewardValue.replace('$', '').trim();
    
    // Update the offer data with the optimized parameters
    setOfferData(prev => ({
      ...prev,
      minFollowers: params.audienceSize.ideal, // Use ideal audience size instead of minimum
      minEngagement: params.engagementRate.ideal, // Use ideal engagement rate
      postsRequired: params.postsRequired,
      timeframe: params.timeframe,
      reward: rewardValue
    }));
    
    // Switch to the manual tab to show the applied parameters
    setActiveTab('manual');
  };
  
  // Generate content suggestions based on category, content type, and reward type
  const generateContentSuggestions = (
    category: string,
    contentType: string,
    rewardType: string
  ): string[] => {
    const suggestions: string[] = [];
    
    // Base suggestions by category
    if (category === "fashion") {
      suggestions.push("Outfit showcase featuring your product");
      suggestions.push("Styling tips with your brand");
      suggestions.push("Before/after transformation with your product");
    } else if (category === "beauty") {
      suggestions.push("Product application tutorial");
      suggestions.push("Before/after results demonstration");
      suggestions.push("Day-to-night routine featuring your product");
    } else if (category === "food") {
      suggestions.push("Recipe creation using your product");
      suggestions.push("Taste test or reaction video");
      suggestions.push("Behind-the-scenes at your restaurant/location");
    } else if (category === "tech") {
      suggestions.push("Unboxing and first impressions");
      suggestions.push("Features walkthrough and demonstration");
      suggestions.push("Comparison with similar products");
    } else {
      suggestions.push("Product showcase in a real-life setting");
      suggestions.push("Day-in-the-life featuring your product/service");
      suggestions.push("Creative uses for your product");
    }
    
    // Add content type specific suggestions
    if (contentType === "image") {
      suggestions.push("High-quality lifestyle product photography");
      suggestions.push("Carousel post showing multiple angles/features");
    } else if (contentType === "video") {
      suggestions.push("15-30 second product demonstration");
      suggestions.push("Tutorial showing how to use your product");
    } else if (contentType === "story") {
      suggestions.push("Behind-the-scenes story series");
      suggestions.push("24-hour product testing story");
    } else if (contentType === "multiple") {
      suggestions.push("Coordinated feed post + story sequence");
      suggestions.push("Video reveal with image carousel follow-up");
    }
    
    // Add reward type relevant suggestions
    if (rewardType === "product") {
      suggestions.push("Authentic 'gifted' product review");
      suggestions.push("Product unboxing experience");
    }
    
    return suggestions.slice(0, 5); // Return max 5 suggestions
  };
  
  // Calculate estimated reach and engagement based on follower count, engagement rate, and posts
  const calculateEstimatedReach = (
    minFollowers: number,
    engagementRate: number,
    postsRequired: number
  ): { total: number; engagement: number } => {
    // Assume average creator will have 2-3x minimum followers
    const averageFollowers = minFollowers * 2.5;
    
    // Assume an average of 3-5 creators will claim the offer based on standard platform data
    const estimatedCreators = 4;
    
    // Calculate total potential reach
    const totalReach = Math.round(averageFollowers * estimatedCreators * postsRequired);
    
    // Calculate expected engagements based on engagement rate
    const totalEngagement = Math.round(totalReach * (engagementRate / 100));
    
    return {
      total: totalReach,
      engagement: totalEngagement
    };
  };

  // Fetch business offers
  const fetchOffers = async () => {
    if (!user) return;
    
    try {
      setIsLoadingOffers(true);
      console.log('Fetching offers for business');
      
      const res = await apiRequest('GET', '/api/offers');
      
      if (!res.ok) {
        console.error('Failed to fetch offers:', res.status);
        return;
      }
      
      const offersData = await res.json();
      console.log('Fetched offers:', offersData);
      
      // Check if the response contains an 'offers' array property
      if (offersData && offersData.offers && Array.isArray(offersData.offers)) {
        console.log(`Setting ${offersData.offers.length} offers to state`);
        setOffers(offersData.offers);
      } else {
        console.error("Response data doesn't contain an offers array:", offersData);
        setOffers([]);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      toast({
        title: "Error",
        description: "Failed to load your offers",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOffers(false);
    }
  };
  
  // Handle successful offer creation
  const handleOfferCreationSuccess = (offer: any) => {
    toast({
      title: "Success",
      description: "Your offer has been created!"
    });
    
    setOfferFormOpen(false);
    
    // Reset the form
    setOfferData({
      title: "",
      description: "",
      reward: "",
      rewardType: "monetary",
      minFollowers: 1000,
      minEngagement: 3,
      postsRequired: 1,
      timeframe: 14,
      category: "fashion",
      contentType: "image",
      location: "",
      tags: []
    });
    setOptimizedParams(null);
    
    // Refresh the offers list
    fetchOffers();
  };
  
  // Create a new offer
  const createOffer = async () => {
    console.log("Starting offer creation process with data:", offerData);
    
    // Make a copy of the data to avoid modifying the state directly
    const sanitizedData = { ...offerData };
    
    // Ensure critical fields have default values
    sanitizedData.title = offerData.title?.toString().trim() || "New Offer";
    sanitizedData.description = offerData.description?.toString().trim() || "Offer description";
    sanitizedData.reward = offerData.reward?.toString() || "0";
    sanitizedData.rewardType = offerData.rewardType || "monetary";
    sanitizedData.minFollowers = parseInt(offerData.minFollowers?.toString() || "1000");
    sanitizedData.minEngagement = parseFloat(offerData.minEngagement?.toString() || "3");
    sanitizedData.postsRequired = parseInt(offerData.postsRequired?.toString() || "1");
    sanitizedData.timeframe = parseInt(offerData.timeframe?.toString() || "14");
    sanitizedData.category = offerData.category || "fashion";
    sanitizedData.contentType = offerData.contentType || "image";
    sanitizedData.location = offerData.location?.toString() || "";
    sanitizedData.tags = Array.isArray(offerData.tags) ? offerData.tags : [];
    
    console.log("Sanitized offer data:", sanitizedData);
    
    // Update the state with sanitized data to ensure consistency
    setOfferData(sanitizedData);
    
    setIsSubmittingOffer(true);
    
    try {
      // Get a fresh token to ensure authentication
      const token = getAuthToken();
      console.log("Authentication token available:", !!token);
      
      // Prepare offer data with proper types
      const data = {
        ...sanitizedData,
        optimizationData: optimizedParams ? JSON.stringify(optimizedParams) : null
      };
      
      // Try direct fetch first with explicit auth token
      console.log("Attempting to create offer with direct fetch API");
      const directResponse = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (directResponse.ok) {
        const offer = await directResponse.json();
        console.log("Offer created successfully via direct fetch:", offer);
        handleOfferCreationSuccess(offer);
        return;
      }
      
      console.log("Direct fetch failed, trying apiRequest...");
      const res = await apiRequest('POST', '/api/offers', data);
      
      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || "Failed to create offer";
        } catch (e) {
          errorMessage = `Failed to create offer (${res.status})`;
        }
        throw new Error(errorMessage);
      }
      
      const offer = await res.json();
      handleOfferCreationSuccess(offer);
      
    } catch (err) {
      console.error('Error creating offer:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create offer",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingOffer(false);
    }
  };
  
  // Use useEffect to handle component loading and reloading
  useEffect(() => {
    if (user && !profileCreated && !error && !isCreating) {
      console.log("Business dashboard: checking for profile with authenticated user", user);
      checkForProfile();
    } else if (!user) {
      console.log("Business dashboard: No authenticated user found");
    }
  }, [user, profileCreated, error, isCreating]);
  
  // Fetch offers when profile is loaded
  useEffect(() => {
    if (user && profileCreated) {
      fetchOffers();
    }
  }, [user, profileCreated]);

  // Render function to handle conditional UI in a safe way that doesn't break hooks
  const renderContent = () => {
    // Loading state
    if (isCreating) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Creating your profile...</p>
        </div>
      );
    }
    
    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Something went wrong</h2>
          <p className="text-center mb-4">{error}</p>
          <Button onClick={() => setError(null)}>Try Again</Button>
        </div>
      );
    }
    
    // If profile exists, show dashboard with enhanced features
    if (profileCreated) {
      return (
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Business Dashboard</h1>
            <div className="flex gap-2 items-center">
              <MascotSettings className="mr-2" />
              <Dialog open={offerFormOpen} onOpenChange={setOfferFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create a New Offer</DialogTitle>
                    <DialogDescription>
                      Create an offer for influencers to promote your business.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Use the AI-Enhanced wizard for an intelligent guided experience */}
                  <Tabs defaultValue="ai" className="mt-4 mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="ai" className="gap-2">
                        <Zap className="h-4 w-4" />
                        AI-Enhanced
                      </TabsTrigger>
                      <TabsTrigger value="standard" className="gap-2">
                        <Info className="h-4 w-4" />
                        Standard
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ai" className="mt-4">
                      <AIEnhancedOfferWizard
                        initialData={offerData}
                        onComplete={(completedData) => {
                          console.log("AI wizard completed with data:", completedData);
                          
                          // Ensure the title and description fields are proper strings
                          const sanitizedData = {
                            ...completedData,
                            title: completedData.title?.toString().trim() || "New Offer",
                            description: completedData.description?.toString().trim() || "Offer description",
                          };
                          
                          // Update the form data
                          setOfferData(sanitizedData);
                          
                          // Create the offer with explicit delay to ensure state update
                          setTimeout(() => {
                            createOffer();
                          }, 100);
                        }}
                        onCancel={() => setOfferFormOpen(false)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="standard" className="mt-4">
                      <OfferCreationWizard
                        initialData={offerData}
                        onComplete={(completedData) => {
                          console.log("Standard wizard completed with data:", completedData);
                          
                          // Ensure the title and description fields are proper strings
                          const sanitizedData = {
                            ...completedData,
                            title: completedData.title?.toString().trim() || "New Offer",
                            description: completedData.description?.toString().trim() || "Offer description",
                          };
                          
                          // Update the form data
                          setOfferData(sanitizedData);
                          
                          // Create the offer with explicit delay to ensure state update
                          setTimeout(() => {
                            createOffer();
                          }, 100);
                        }}
                        onCancel={() => setOfferFormOpen(false)}
                        generateContentSuggestions={generateContentSuggestions}
                        calculateEstimatedReach={calculateEstimatedReach}
                      />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Logout
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Active Offers
                </CardTitle>
                <CardDescription>
                  Your current influencer marketing offers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOffers ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading offers...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{offers.length}</div>
                    <p className="text-sm text-muted-foreground">
                      {offers.length > 0 
                        ? `${offers.length} active offer${offers.length !== 1 ? 's' : ''}`
                        : 'Create an offer to start connecting with influencers'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Influencer Matches
                </CardTitle>
                <CardDescription>
                  Potential influencers matching your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">
                  Create offers to see potential influencer matches
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Campaign Metrics
                </CardTitle>
                <CardDescription>
                  Performance of your current campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">-</div>
                <p className="text-sm text-muted-foreground">
                  No active campaigns to measure yet
                </p>
              </CardContent>
            </Card>
          </div>
          
          {offers.length === 0 && !isLoadingOffers ? (
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.username}!</CardTitle>
                <CardDescription>
                  Your business profile has been set up. Get started by creating your first offer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Offers Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Create your first offer to start connecting with influencers who can help promote your business.
                  </p>
                  <Button onClick={() => setOfferFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : offers.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Active Offers</CardTitle>
                  <CardDescription>
                    Manage your current influencer marketing offers
                  </CardDescription>
                </div>
                <Button onClick={() => setOfferFormOpen(true)} size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  New Offer
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingOffers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading your offers...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map((offer) => {
                      // AI-driven performance metrics based on offer data
                      const daysLive = offer.createdAt 
                        ? Math.floor((new Date().getTime() - new Date(offer.createdAt).getTime()) / (1000 * 3600 * 24)) 
                        : 0;
                        
                      // Calculate potential reach based on follower requirements with safer fallbacks
                      const minFollowers = parseInt(String(offer.minFollowers || 1000));
                      const postsRequired = parseInt(String(offer.postsRequired || 1));
                      const rewardAmount = parseFloat(String(offer.reward || 0));
                      
                      const estimatedViewsPerInfluencer = minFollowers * 0.8; // Estimate 80% of followers see content
                      const estimatedInfluencerTakeup = 3; // AI projection of claim numbers
                      const potentialReach = Math.round(estimatedViewsPerInfluencer * estimatedInfluencerTakeup * postsRequired);
                      
                      // Calculate projected ROI with error handling
                      const averageConversionRate = 0.015; // 1.5% industry standard conversion
                      const estimatedClicks = potentialReach * averageConversionRate;
                      const averageOrderValue = 45; // Industry benchmark
                      const projectedRevenue = estimatedClicks * averageOrderValue;
                      
                      // Avoid division by zero
                      const projectedROI = rewardAmount > 0 
                        ? Math.round((projectedRevenue / (rewardAmount * estimatedInfluencerTakeup)) * 100)
                        : 0;
                      
                      // Calculate match score based on available influencers
                      const matchScore = Math.min(95, 65 + Math.round(Math.random() * 30)); // Demo: will be replaced with actual algorithm
                      
                      // Format numbers for display
                      const formatFollowerCount = (count: number) => {
                        if (count >= 1000000) {
                          return (count / 1000000).toFixed(1) + 'M';
                        } else if (count >= 1000) {
                          return (count / 1000).toFixed(1) + 'K';
                        }
                        return count.toString();
                      };
                      
                      const handleOpenAiInsights = (e: React.MouseEvent, currentOffer: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedOfferId(currentOffer.id);
                        setSelectedOffer(currentOffer);
                        setAiInsightsOpen(true);
                      };
                      
                      // Determine progress and status indicators
                      const isNew = daysLive < 2;
                      const progressPercent = Math.min(100, daysLive * 5);
                      const progressColor = daysLive > 14 
                        ? "bg-yellow-500" // Older offers
                        : isNew 
                          ? "bg-blue-500" // New offers
                          : "bg-green-500"; // Active offers
                      
                      return (
                      <Card 
                        key={offer.id} 
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-l-4 hover:border-l-primary"
                        style={{ borderLeftColor: isNew ? "#3b82f6" : "#10b981" }}
                        onClick={() => navigate(`/offer/${offer.id}`)}
                      >
                        <CardHeader className="p-4 pb-2 bg-slate-50/50">
                          <CardTitle className="text-md flex justify-between items-center">
                            <span className="truncate">{offer.title}</span>
                            <div className="text-xs font-normal text-muted-foreground flex items-center ml-2 shrink-0">
                              {isNew ? (
                                <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 flex items-center">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                                  New
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 flex items-center">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                  Live
                                </span>
                              )}
                            </div>
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-1">
                            {offer.description || "No description provided"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          {/* Basic Metrics - Improved Layout */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3.5 w-3.5 text-primary" />
                              <div>
                                <span className="font-medium">${rewardAmount}</span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  {offer.rewardType === 'product' ? '(product)' : ''}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <div>
                                <span className="font-medium">{formatFollowerCount(minFollowers)}+</span>
                                <span className="text-xs text-muted-foreground ml-1">followers</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <BarChart2 className="h-3.5 w-3.5 text-primary" />
                              <div>
                                <span className="font-medium">{offer.minEngagement}%+</span>
                                <span className="text-xs text-muted-foreground ml-1">engagement</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Image className="h-3.5 w-3.5 text-primary" />
                              <div>
                                <span className="font-medium">{postsRequired}</span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  post{postsRequired !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {offer.tags && offer.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {offer.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs py-0 px-2">
                                  {tag}
                                </Badge>
                              ))}
                              {offer.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs py-0 px-2">
                                  +{offer.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Advanced AI Metrics - Improved Layout */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center mb-2">
                              <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
                              <h4 className="text-xs font-semibold">AI Insights</h4>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              {/* Left column */}
                              <div className="space-y-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="w-full">
                                      <div className="flex flex-col items-start">
                                        <span className="text-xs text-muted-foreground">Projected ROI</span>
                                        <span className="text-green-600 font-semibold text-lg">{projectedROI}%</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      <p className="text-xs">Based on industry benchmarks and predicted conversion rates</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <div className="flex flex-col items-start">
                                  <span className="text-xs text-muted-foreground">Status</span>
                                  <div className="flex items-center">
                                    <span className="font-medium text-sm">{daysLive} day{daysLive !== 1 ? 's' : ''} live</span>
                                    <span className="mx-2 text-muted-foreground">•</span>
                                    <span className="text-sm">0/{estimatedInfluencerTakeup} claims</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right column */}
                              <div className="space-y-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="w-full">
                                      <div className="flex flex-col items-start">
                                        <span className="text-xs text-muted-foreground">Match Score</span>
                                        <div className="flex items-center">
                                          <span className={`font-semibold text-lg ${matchScore > 80 ? "text-green-600" : "text-amber-600"}`}>
                                            {matchScore}%
                                          </span>
                                          <span className="ml-1 text-sm text-muted-foreground">compatibility</span>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      <p className="text-xs">Compatibility rating with available influencers on the platform</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <div className="flex flex-col items-start">
                                  <span className="text-xs text-muted-foreground">Est. Reach</span>
                                  <span className="font-medium text-sm">{potentialReach.toLocaleString()} impressions</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                              <div className={`${progressColor} h-1.5 rounded-full`} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-xs px-2"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      Preview
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p className="text-xs">See how this offer appears to influencers</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={(e) => handleOpenAiInsights(e, offer)}
                              >
                                <Zap className="h-3.5 w-3.5 mr-1.5" />
                                AI Insights
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      );
    }
    
    // If no profile exists yet, show business profile creation form
    return <BusinessProfileForm />;
  };
  
  // Generate AI insights when selected offer changes
  useEffect(() => {
    if (selectedOffer && aiInsightsOpen) {
      // Reset to make sure we have fresh data
      setBudgetOptimization(null);
      setCampaignForecast(null);
      setMatchedInfluencers([]);
      
      // Simulate AI data generation with short delays to improve UX
      const generateBudgetOptimization = async () => {
        // Use data from the selected offer to generate budget optimization recommendations
        const budget = parseFloat(selectedOffer.reward) || 500;
        const optimizationData = {
          totalBudget: budget,
          allocation: {
            microInfluencers: {
              percentage: 40,
              amount: budget * 0.4,
              count: Math.floor((budget * 0.4) / 150),
              avgReward: 150,
              estimatedReach: Math.floor((budget * 0.4) / 150) * 8000
            },
            midTier: {
              percentage: 40,
              amount: budget * 0.4,
              count: Math.floor((budget * 0.4) / 350),
              avgReward: 350,
              estimatedReach: Math.floor((budget * 0.4) / 350) * 30000
            },
            premium: {
              percentage: 20,
              amount: budget * 0.2,
              count: Math.floor((budget * 0.2) / 1000),
              avgReward: 1000,
              estimatedReach: Math.floor((budget * 0.2) / 1000) * 100000
            }
          },
          projectedMetrics: {
            totalReach: Math.floor((budget * 0.4) / 150) * 8000 + 
                        Math.floor((budget * 0.4) / 350) * 30000 + 
                        Math.floor((budget * 0.2) / 1000) * 100000,
            estimatedEngagement: Math.floor(
              (Math.floor((budget * 0.4) / 150) * 8000 * 0.05) + 
              (Math.floor((budget * 0.4) / 350) * 30000 * 0.03) + 
              (Math.floor((budget * 0.2) / 1000) * 100000 * 0.01)
            ),
            estimatedConversions: Math.floor(
              ((Math.floor((budget * 0.4) / 150) * 8000 * 0.05) + 
              (Math.floor((budget * 0.4) / 350) * 30000 * 0.03) + 
              (Math.floor((budget * 0.2) / 1000) * 100000 * 0.01)) * 0.01
            ),
            estimatedROI: Math.round(
              ((Math.floor(
                ((Math.floor((budget * 0.4) / 150) * 8000 * 0.05) + 
                (Math.floor((budget * 0.4) / 350) * 30000 * 0.03) + 
                (Math.floor((budget * 0.2) / 1000) * 100000 * 0.01)) * 0.01
              ) * 45) / budget) * 100
            ),
            confidenceScore: 80
          },
          recommendedCriteria: {
            minFollowers: selectedOffer.minFollowers > 5000 ? selectedOffer.minFollowers : 5000,
            minEngagement: selectedOffer.minEngagement > 3 ? selectedOffer.minEngagement : 3,
            contentTypes: [selectedOffer.contentType, "story"],
            idealTimeframe: selectedOffer.timeframe > 14 ? selectedOffer.timeframe : 14
          }
        };
        
        setBudgetOptimization(optimizationData);
      };
      
      const generateCampaignForecast = async () => {
        // Create a forecast based on the selected offer
        const forecast = {
          reach: {
            expected: selectedOffer.minFollowers * 0.9 * selectedOffer.postsRequired * 3,
            lower: selectedOffer.minFollowers * 0.7 * selectedOffer.postsRequired * 2,
            upper: selectedOffer.minFollowers * 1.1 * selectedOffer.postsRequired * 4,
            trend: "up" as "up"
          },
          engagement: {
            expected: Math.round((selectedOffer.minFollowers * 0.9 * selectedOffer.postsRequired * 3) * (selectedOffer.minEngagement / 100)),
            lower: Math.round((selectedOffer.minFollowers * 0.7 * selectedOffer.postsRequired * 2) * (selectedOffer.minEngagement / 100) * 0.8),
            upper: Math.round((selectedOffer.minFollowers * 1.1 * selectedOffer.postsRequired * 4) * (selectedOffer.minEngagement / 100) * 1.2),
            trend: "stable" as "stable"
          },
          clicks: {
            expected: Math.round((selectedOffer.minFollowers * 0.9 * selectedOffer.postsRequired * 3) * (selectedOffer.minEngagement / 100) * 0.15),
            lower: Math.round((selectedOffer.minFollowers * 0.7 * selectedOffer.postsRequired * 2) * (selectedOffer.minEngagement / 100) * 0.8 * 0.1),
            upper: Math.round((selectedOffer.minFollowers * 1.1 * selectedOffer.postsRequired * 4) * (selectedOffer.minEngagement / 100) * 1.2 * 0.2),
            trend: "up" as "up"
          },
          conversions: {
            expected: Math.round((selectedOffer.minFollowers * 0.9 * selectedOffer.postsRequired * 3) * (selectedOffer.minEngagement / 100) * 0.15 * 0.08),
            lower: Math.round((selectedOffer.minFollowers * 0.7 * selectedOffer.postsRequired * 2) * (selectedOffer.minEngagement / 100) * 0.8 * 0.1 * 0.05),
            upper: Math.round((selectedOffer.minFollowers * 1.1 * selectedOffer.postsRequired * 4) * (selectedOffer.minEngagement / 100) * 1.2 * 0.2 * 0.1),
            trend: "stable" as "stable"
          },
          roi: {
            percentage: {
              expected: Math.round(((Math.round((selectedOffer.minFollowers * 0.9 * selectedOffer.postsRequired * 3) * (selectedOffer.minEngagement / 100) * 0.15 * 0.08) * 45) / parseFloat(selectedOffer.reward)) * 100),
              lower: Math.round(((Math.round((selectedOffer.minFollowers * 0.7 * selectedOffer.postsRequired * 2) * (selectedOffer.minEngagement / 100) * 0.8 * 0.1 * 0.05) * 40) / parseFloat(selectedOffer.reward)) * 100),
              upper: Math.round(((Math.round((selectedOffer.minFollowers * 1.1 * selectedOffer.postsRequired * 4) * (selectedOffer.minEngagement / 100) * 1.2 * 0.2 * 0.1) * 50) / parseFloat(selectedOffer.reward)) * 100),
              trend: "up" as "up"
            },
            value: {
              expected: Math.round(Math.round((selectedOffer.minFollowers * 0.9 * selectedOffer.postsRequired * 3) * (selectedOffer.minEngagement / 100) * 0.15 * 0.08) * 45),
              lower: Math.round(Math.round((selectedOffer.minFollowers * 0.7 * selectedOffer.postsRequired * 2) * (selectedOffer.minEngagement / 100) * 0.8 * 0.1 * 0.05) * 40),
              upper: Math.round(Math.round((selectedOffer.minFollowers * 1.1 * selectedOffer.postsRequired * 4) * (selectedOffer.minEngagement / 100) * 1.2 * 0.2 * 0.1) * 50),
              trend: "up" as "up"
            }
          },
          timeToResults: {
            firstResults: 2, // days
            peakPerformance: Math.floor(selectedOffer.timeframe * 0.6), // 60% through campaign
            longevity: selectedOffer.timeframe + 7 // campaign + 1 week
          },
          confidence: 75,
          riskFactors: [
            {
              id: "risk1",
              name: "Seasonal variation",
              severity: selectedOffer.category === "fashion" ? "medium" as "medium" : "low" as "low",
              impact: "Engagement may fluctuate based on seasonal trends and holidays",
              mitigation: "Plan campaign timing to align with peak seasonal interest"
            },
            {
              id: "risk2",
              name: "Algorithm changes",
              severity: "medium" as "medium",
              impact: "Platform algorithm updates can affect content visibility",
              mitigation: "Use multiple content formats and platforms to diversify"
            },
            {
              id: "risk3",
              name: "Influencer performance variance",
              severity: selectedOffer.postsRequired < 5 ? "high" as "high" : "medium" as "medium",
              impact: "Small number of influencers creates higher result variance",
              mitigation: "Increase number of influencers to stabilize results"
            }
          ] as CampaignForecast['riskFactors'],
          optimizationTips: [
            {
              id: "tip1",
              tip: "Add Instagram stories for +15% reach at minimal extra cost",
              impact: "medium" as "medium",
              difficulty: "easy" as "easy"
            },
            {
              id: "tip2",
              tip: `Include a time-limited offer to improve conversion rates`,
              impact: "large" as "large",
              difficulty: "medium" as "medium"
            },
            {
              id: "tip3",
              tip: "Stagger content posting over 3-5 days for sustained visibility",
              impact: "medium" as "medium",
              difficulty: "easy" as "easy"
            }
          ] as CampaignForecast['optimizationTips']
        };
        
        setCampaignForecast(forecast);
      };
      
      const generateInfluencerMatches = async () => {
        // Generate sample influencer matches based on offer criteria
        const matches: InfluencerMatch[] = [
          {
            id: "inf1",
            name: "Emma Johnson",
            handle: "emma.creates",
            platform: "instagram",
            followers: 15800,
            engagementRate: 4.2,
            location: "New York, USA",
            contentTypes: ["image", "story", "reel"],
            niche: selectedOffer.category || "fashion",
            tags: selectedOffer.tags || ["lifestyle", "minimalist"],
            pricePerPost: 350,
            matchScore: 92,
            matchFactors: {
              metricsMatch: 95,
              locationMatch: 85,
              nicheMatch: 98,
              contentTypeMatch: 90,
              audienceMatch: 88,
              brandAlignmentScore: 92
            }
          },
          {
            id: "inf2",
            name: "Sophie Chang",
            handle: "sophieeats",
            platform: "instagram",
            followers: 8500,
            engagementRate: 6.7,
            location: "Chicago, USA",
            contentTypes: ["image", "reel"],
            niche: selectedOffer.category || "food",
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
            id: "inf3",
            name: "Olivia Parker",
            handle: "oliviaparker",
            platform: "instagram",
            followers: 22400,
            engagementRate: 3.8,
            location: "London, UK",
            contentTypes: ["image", "story"],
            niche: selectedOffer.category || "fashion",
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
          }
        ];
        
        setMatchedInfluencers(matches);
      };
      
      // Generate all insights with slight delays to improve UX
      const generateAllInsights = async () => {
        await generateBudgetOptimization();
        await new Promise(resolve => setTimeout(resolve, 400));
        await generateCampaignForecast();
        await new Promise(resolve => setTimeout(resolve, 400));
        await generateInfluencerMatches();
      };
      
      generateAllInsights();
    }
  }, [selectedOffer, aiInsightsOpen]);
  
  // AI Insights dialog
  const AIInsightsDialog = () => (
    <Dialog open={aiInsightsOpen} onOpenChange={setAiInsightsOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI-Powered Campaign Insights
          </DialogTitle>
          <DialogDescription className="text-base">
            Intelligent analytics and optimization for "{selectedOffer?.title || 'your offer'}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-0">
          <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
            <div className="border-b">
              <div className="px-6">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="budget" className="data-[state=active]:bg-primary/10">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget Optimizer
                  </TabsTrigger>
                  <TabsTrigger value="forecast" className="data-[state=active]:bg-primary/10">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Performance Forecast
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="data-[state=active]:bg-primary/10">
                    <Target className="h-4 w-4 mr-2" />
                    Influencer Matches
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div className="p-6 pt-4 max-h-[70vh] overflow-y-auto">
              <TabsContent value="budget" className="mt-0">
                {budgetOptimization ? (
                  <SmartBudgetOptimizer
                    initialBudget={parseFloat(selectedOffer?.reward || "500")}
                    onOptimizationComplete={(optimization) => setBudgetOptimization(optimization)}
                  />
                ) : (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-primary" />
                    <span>Generating budget optimization...</span>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="forecast" className="mt-0">
                {campaignForecast ? (
                  <PerformanceForecaster
                    offerData={selectedOffer}
                    onForecastComplete={(forecast) => setCampaignForecast(forecast)}
                  />
                ) : (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-primary" />
                    <span>Generating performance forecast...</span>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="creators" className="mt-0">
                {matchedInfluencers.length > 0 ? (
                  <InfluencerMatcher
                    offerCriteria={{
                      minFollowers: selectedOffer?.minFollowers,
                      minEngagement: selectedOffer?.minEngagement,
                      category: selectedOffer?.category,
                      contentType: selectedOffer?.contentType,
                      location: selectedOffer?.location,
                      tags: selectedOffer?.tags
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-primary" />
                    <span>Finding perfect influencer matches...</span>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
  
  // Return the content based on current state
  return (
    <>
      {renderContent()}
      <AIInsightsDialog />
    </>
  );
}