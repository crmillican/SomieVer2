import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation"; 
import { Logo } from "@/components/ui/logo";
import { 
  Loader2, Search, User, Building2, Filter, Instagram, Youtube, Star, 
  ChevronRight, Award, Sparkles, TrendingUp, Clock, BadgePercent, Users,
  ShoppingBag, DollarSign, HeartHandshake, Camera, Flame, Gift,
  MapPin, CheckCircle, ArrowRight, ArrowDown, Zap, Share2, MessageSquare, HelpCircle,
  Calendar
} from "lucide-react";
import { ProfileCard } from "@/components/marketplace/profile-card";
import { Badge } from "@/components/ui/badge";

// Define these types to match what ProfileCard expects
interface InfluencerCardProfile {
  id: number;
  displayName: string;
  avatarUrl?: string;
  platform: string;
  niche: string; 
  location: string;
  bio: string;
  followerCount: number;
  engagementRate: number;
  rating: number;
  ratingCount: number;
  credibilityScore: number;
  tags: string[];
  verified: boolean;
}

interface BusinessCardProfile {
  id: number;
  businessName: string;
  logoUrl?: string;
  industry: string;
  location: string;
  description: string;
  rating: number;
  ratingCount: number;
  rewardType: "monetary" | "product" | "both";
  avgReward: number;  
  tags: string[];
  verified: boolean;
}

// Placeholder data for demo (will be replaced with real API data)
const demoInfluencers: InfluencerCardProfile[] = [
  {
    id: 1,
    displayName: "FashionFinds",
    avatarUrl: "",
    platform: "instagram",
    niche: "Fashion",
    location: "Los Angeles, CA",
    bio: "Fashion enthusiast sharing daily style tips and outfit inspiration.",
    followerCount: 8500,
    engagementRate: 4.2,
    rating: 4.7,
    ratingCount: 12,
    credibilityScore: 85,
    tags: ["fashion", "style", "outfits"],
    verified: true
  },
  {
    id: 2,
    displayName: "TravelWithJamie",
    avatarUrl: "",
    platform: "tiktok",
    niche: "Travel",
    location: "New York, NY",
    bio: "Adventure seeker documenting travels around the globe.",
    followerCount: 12000,
    engagementRate: 5.7,
    rating: 4.8,
    ratingCount: 8,
    credibilityScore: 89,
    tags: ["travel", "adventure", "destinations"],
    verified: true
  },
  {
    id: 3,
    displayName: "TechReviewer",
    avatarUrl: "",
    platform: "youtube",
    niche: "Technology",
    location: "San Francisco, CA",
    bio: "Honest tech reviews of the latest gadgets and innovations.",
    followerCount: 25000,
    engagementRate: 3.8,
    rating: 4.5,
    ratingCount: 22,
    credibilityScore: 92,
    tags: ["tech", "reviews", "gadgets"],
    verified: true
  }
];

const demoBusinesses: BusinessCardProfile[] = [
  {
    id: 1,
    businessName: "Eco Essentials",
    logoUrl: "",
    industry: "Sustainable Products",
    location: "Portland, OR",
    description: "Eco-friendly everyday products for a sustainable lifestyle.",
    rating: 4.8,
    ratingCount: 15,
    rewardType: "product",
    avgReward: 150,
    tags: ["eco-friendly", "sustainable", "lifestyle"],
    verified: true
  },
  {
    id: 2,
    businessName: "ActiveWear Co",
    logoUrl: "",
    industry: "Fashion",
    location: "Austin, TX",
    description: "Performance activewear for fitness enthusiasts.",
    rating: 4.6,
    ratingCount: 19,
    rewardType: "monetary",
    avgReward: 200,
    tags: ["fitness", "activewear", "sports"],
    verified: true
  },
  {
    id: 3,
    businessName: "BeautyBox",
    logoUrl: "",
    industry: "Beauty",
    location: "Miami, FL",
    description: "Premium beauty products with natural ingredients.",
    rating: 4.7,
    ratingCount: 23,
    rewardType: "both",
    avgReward: 175,
    tags: ["beauty", "skincare", "natural"],
    verified: true
  }
];

// Helper function to format numbers (e.g., 1500 -> 1.5K)
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
};

export default function LandingPageNew() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { location, isLoading: isLocationLoading, error: locationError } = useGeolocation();
  const [activeTab, setActiveTab] = useState("influencers");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  // Only show location if we have valid data and no errors
  const hasValidLocation = location && !locationError && (location.city || location.region);
  
  // Format the location string for display
  const locationString = hasValidLocation ? 
    `${location.city || ''}${location.city && location.region ? ', ' : ''}${location.region || ''}` : 
    '';

  // When user clicks on a profile or tries to contact, check if logged in
  const handleProfileAction = () => {
    if (!user) {
      // Redirect to account creation page instead of showing login dialog
      const userType = activeTab === "influencers" ? "influencer" : "business";
      setLocation(`/auth-page?mode=register&type=${userType}`);
    } else {
      // If logged in, redirect to appropriate dashboard
      if (user.userType === "business") {
        setLocation("/business-dashboard");
      } else {
        setLocation("/influencer-dashboard");
      }
    }
  };



  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost"
              onClick={() => {
                setLocation("/why-somie");
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Why SOMIE
            </Button>
            
            {!user && (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => setLocation(`/auth-page?mode=register&type=${activeTab === "influencers" ? "influencer" : "business"}`)}
                >
                  Create Account
                </Button>
                <Button 
                  onClick={() => setLocation("/auth-page?mode=login")}
                >
                  Sign In
                </Button>
              </>
            )}
            
            {user && (
              <Button 
                onClick={() => {
                  if (user.userType === "business") {
                    setLocation("/business-dashboard");
                  } else {
                    setLocation("/influencer-dashboard");
                  }
                }}
              >
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-6">
        {/* Main Hero Section */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <div className="mb-4 inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4 mr-2" />
            Redefining Influence
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Real Influence. <span className="text-primary">Real Returns.</span></h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            SOMIE connects brands with everyday creators who have real influence. Whether you're a business looking to reach engaged audiences 
            or a creator ready to monetize your presence, we make it seamless. Our data-driven platform matches the right brands with the 
            right voices, ensuring partnerships that drive results.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Anyone Can Participate</h3>
              <p className="text-sm text-muted-foreground">Everyone with a following has influence</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <HeartHandshake className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Authentic Connections</h3>
              <p className="text-sm text-muted-foreground">Genuine engagement drives real results</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Diverse Rewards</h3>
              <p className="text-sm text-muted-foreground">From products to payments</p>
            </div>
          </div>
          
          <div className="mt-12">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn how it works <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Content Value Proposition Section */}
        <div className="my-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Two-Way Value Exchange</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-6">
              <div className="p-5 border rounded-lg bg-card">
                <h3 className="font-bold mb-2 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  Businesses
                </h3>
                <p className="text-muted-foreground">
                  Get authentic exposure from trusted voices—without the guesswork. Our platform's precise matching ensures your message reaches exactly the right audience.
                </p>
              </div>
              <div className="p-5 border rounded-lg bg-card">
                <h3 className="font-bold mb-2 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Creators
                </h3>
                <p className="text-muted-foreground">
                  Unlock exclusive perks and turn your content into real value. SOMIE opens doors to opportunities that align perfectly with your unique audience and content style.
                </p>
              </div>
            </div>
            <p className="text-lg font-medium text-primary mt-4">Because everyone with a following has influence.</p>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setLocation("/why-somie");
                }}
              >
                <HelpCircle className="mr-2 h-4 w-4" /> Learn more about micro-influence
              </Button>
            </div>
          </div>
        </div>

        {/* Our Differentiator Section */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Why Choose SOMIE?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Inclusive Platform</h3>
              <p className="text-muted-foreground">We believe everyone with an audience has value, from 500 followers and beyond.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Smart Matching</h3>
              <p className="text-muted-foreground">Enter what you know, we'll suggest the rest. Our platform optimizes based on real industry data for perfect matches.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Measurable Results</h3>
              <p className="text-muted-foreground">Track campaign performance in real-time with our comprehensive analytics dashboard.</p>
            </div>
          </div>
        </div>

        {/* User Journey Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* For Businesses */}
          <div className="p-8 border rounded-xl bg-gradient-to-br from-background to-muted">
            <div>
              <div className="mb-4 inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                <Building2 className="h-4 w-4 mr-2" />
                For Businesses
              </div>
              <h2 className="text-2xl font-bold mb-4">Smart Optimization</h2>
              <p className="text-muted-foreground mb-5">
                Tell us what you know, we'll suggest the rest. Input your budget, desired audience size, or niche, 
                and SOMIE's algorithm will recommend the optimal parameters based on real industry data.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Enter your budget, and we'll recommend the ideal influencer size</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Specify audience parameters, we'll optimize your spend</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Connect with creators who deliver proven ROI</span>
                </li>
              </ul>
            </div>
            <Button 
              className="w-full sm:w-auto mb-6"
              onClick={() => {
                if (!user) {
                  setLocation("/auth-page?mode=register&type=business");
                } else {
                  setLocation("/business-dashboard");
                }
              }}
            >
              <Search className="mr-2 h-5 w-5" /> Create Smart Offer
            </Button>
          </div>
          
          {/* For Influencers */}
          <div className="p-8 border rounded-xl bg-gradient-to-br from-background to-muted">
            <div>
              <div className="mb-4 inline-flex items-center bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-medium">
                <User className="h-4 w-4 mr-2" />
                For Influencers
              </div>
              <h2 className="text-2xl font-bold mb-4">Personalized Offers</h2>
              <p className="text-muted-foreground mb-5">
                Your exact metrics matter. SOMIE analyzes your audience size and engagement rate to match you 
                with perfectly suited offers that include clearly defined deliverables and expectations.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Receive offers tailored to your specific audience size</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Smart algorithm matches your metrics with appropriate brands</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Create authentic content for brands that value your influence</span>
                </li>
              </ul>
            </div>
            <Button 
              variant="outline"
              className="w-full sm:w-auto mb-6"
              onClick={() => {
                if (!user) {
                  setLocation("/auth-page?mode=register&type=influencer");
                } else {
                  setLocation("/influencer-dashboard");
                }
              }}
            >
              <Zap className="mr-2 h-5 w-5" /> Find Your Offers
            </Button>
          </div>
        </div>


        {/* How It Works Section */}
        <div id="how-it-works" className="mb-12 py-10 px-6 bg-gradient-to-br from-background to-muted/40 rounded-xl border">
          <div className="text-center mb-10">
            <div className="mb-3 inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              How It Works
            </div>
            <h2 className="text-3xl font-bold mb-3">How SOMIE Connects You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our intelligent matching algorithm connects brands and influencers based on compatibility, audience overlap, and campaign goals.
              Experience the power of AI-driven connections in just three simple steps:
            </p>
          </div>
          
          <div>
            <Tabs defaultValue="businesses" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-center mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="businesses" className="flex items-center gap-2 px-4">
                    <Building2 className="h-4 w-4" />
                    <span>For Businesses</span>
                  </TabsTrigger>
                  <TabsTrigger value="influencers" className="flex items-center gap-2 px-4">
                    <User className="h-4 w-4" />
                    <span>For Influencers</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="businesses" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 - Get Matched */}
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">1. Specify Your Parameters</h3>
                    <p className="text-muted-foreground text-sm mb-4">Enter what you know (budget, audience size, or niche) and our algorithm suggests optimal values for the rest based on industry data.</p>
                    
                    {/* Visual Aid for Step 1 */}
                    <div className="border rounded-lg p-3 bg-card w-full max-w-[220px] shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="h-3 bg-primary/20 rounded w-2/3"></div>
                        </div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                        <div className="flex space-x-2">
                          <div className="h-7 bg-muted rounded flex-1"></div>
                          <div className="h-7 bg-primary/30 rounded flex-1"></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <div className="h-6 w-6 rounded-full bg-muted"></div>
                          <div className="h-6 w-6 rounded-full bg-muted"></div>
                          <div className="h-6 w-6 rounded-full bg-muted"></div>
                          <div className="h-6 w-6 rounded-full bg-primary/30"></div>
                          <div className="h-6 w-6 rounded-full bg-muted"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 2 - Connect & Collaborate */}
                  <div className="flex flex-col items-center text-center p-4 relative">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">2. Connect & Collaborate</h3>
                    <p className="text-muted-foreground text-sm mb-4">Communicate directly through our platform to establish expectations and campaign details.</p>
                    
                    {/* Visual Aid for Step 2 */}
                    <div className="border rounded-lg p-3 bg-card w-full max-w-[220px] shadow-sm">
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <div className="flex space-x-2 items-center">
                          <div className="h-5 w-5 rounded-full bg-primary/20"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <Clock className="h-2 w-2 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-2">
                        <div className="h-2 bg-muted rounded w-full"></div>
                        <div className="h-2 bg-muted rounded w-2/3"></div>
                        <div className="h-5 bg-primary/10 rounded w-1/2 ml-auto"></div>
                      </div>
                      <div className="flex rounded-md p-1 bg-muted/20 items-center space-x-2">
                        <div className="h-4 w-full bg-primary/10 rounded"></div>
                        <div className="flex-shrink-0 h-5 w-5 rounded bg-primary/30 flex items-center justify-center">
                          <ArrowRight className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:block absolute -right-4 top-1/3">
                      <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  </div>
                  
                  {/* Step 3 - See Real Results */}
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">3. See Real Results</h3>
                    <p className="text-muted-foreground text-sm mb-4">Track campaign performance and ROI with our analytics dashboard for data-driven partnerships.</p>
                    
                    {/* Visual Aid for Step 3 */}
                    <div className="border rounded-lg p-3 bg-card w-full max-w-[220px] shadow-sm">
                      <div className="mb-2 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <div className="text-xs font-medium text-green-500">Offer Accepted</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <div className="text-xs font-medium">+28%</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="h-2 bg-muted rounded w-12"></div>
                          <div className="h-2 bg-primary/30 rounded w-10"></div>
                        </div>
                        <div className="h-8 bg-muted/30 rounded w-full relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 w-2/3 h-6 bg-primary/30 rounded-b"></div>
                          <div className="absolute bottom-0 left-0 w-1/3 h-3 bg-primary/50 rounded-b"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          <div className="flex flex-col items-center">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Share2 className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <DollarSign className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        setLocation("/auth-page?mode=register&type=business");
                      } else {
                        setLocation("/business-dashboard");
                      }
                    }}
                  >
                    Get Started Now
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="influencers" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 - Get Intelligent Matches */}
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">1. Match Based on Your Metrics</h3>
                    <p className="text-muted-foreground text-sm mb-4">Our algorithm analyzes your actual metrics (followers, engagement rate) to match you with offers perfectly suited to your profile.</p>
                    
                    {/* Visual Aid for Step 1 */}
                    <div className="border rounded-lg p-3 bg-card w-full max-w-[220px] shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="h-3 bg-primary/20 rounded w-2/3"></div>
                        </div>
                        <div className="flex space-x-2 items-center">
                          <Instagram className="h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="h-3 bg-muted rounded w-4/5"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/30 rounded-lg p-1.5 flex flex-col items-center">
                            <div className="text-xs text-primary">Followers</div>
                            <div className="text-sm font-semibold">1.3K</div>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-1.5 flex flex-col items-center">
                            <div className="text-xs text-primary">Engagement</div>
                            <div className="text-sm font-semibold">7.4%</div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Badge variant="outline" className="bg-primary/20 text-primary text-xs">
                            <Badge className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                            High Match Potential
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 2 - Collaborate Directly */}
                  <div className="flex flex-col items-center text-center p-4 relative">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">2. Browse & Select Instantly</h3>
                    <p className="text-muted-foreground text-sm mb-4">Browse available offers and select the ones that match your style and content niche with clearly defined deliverables.</p>
                    
                    {/* Visual Aid for Step 2 */}
                    <div className="border rounded-lg p-3 bg-card w-full max-w-[220px] shadow-sm">
                      <div className="p-1.5 bg-green-50 rounded-md border border-green-200 mb-2 flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        <div className="text-xs text-green-700">Offer Claimed</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-5 w-5 rounded-full bg-primary/20 mr-1.5"></div>
                            <div className="h-2.5 bg-muted rounded w-12"></div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">$200</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 bg-muted rounded w-full"></div>
                          <div className="h-2 bg-muted rounded w-4/5"></div>
                          <div className="h-2 bg-muted rounded w-3/5"></div>
                        </div>
                        <div className="flex space-x-1">
                          <div className="h-6 bg-primary/10 rounded flex-1 flex items-center justify-center">
                            <Camera className="h-3 w-3 text-primary" />
                          </div>
                          <div className="h-6 bg-primary/20 rounded flex-1 flex items-center justify-center">
                            <Calendar className="h-3 w-3 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:block absolute -right-4 top-1/3">
                      <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  </div>
                  
                  {/* Step 3 - Grow Your Career and Benefit */}
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">3. Grow Your Career</h3>
                    <p className="text-muted-foreground text-sm mb-4">Receive fair compensation and build long-term relationships with brands that value your influence.</p>
                    
                    {/* Visual Aid for Step 3 */}
                    <div className="border rounded-lg p-3 bg-card w-full max-w-[220px] shadow-sm">
                      <div className="mb-2 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium">My Earnings</div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0">
                            +$200
                          </Badge>
                        </div>
                        <div className="h-7 bg-gradient-to-r from-primary/20 to-primary/40 rounded-md relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-end px-3">
                            <div className="text-xs font-bold text-primary">$1,250</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex flex-col items-center bg-muted/20 p-1.5 rounded-md">
                          <div className="text-[10px] text-muted-foreground">Growth</div>
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                            <span className="text-xs font-semibold">+12%</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center bg-muted/20 p-1.5 rounded-md">
                          <div className="text-[10px] text-muted-foreground">Rating</div>
                          <div className="flex items-center text-primary">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-primary" />
                            <span className="text-xs font-semibold">4.8</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t">
                        <div className="text-[10px] text-muted-foreground">New Offers:</div>
                        <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">+3</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        setLocation("/auth-page?mode=register&type=influencer");
                      } else {
                        setLocation("/influencer-dashboard");
                      }
                    }}
                  >
                    Get Started Now
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Featured Profiles */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="mb-3 inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <Star className="h-4 w-4 mr-2" />
              Featured
            </div>
            <h2 className="text-3xl font-bold mb-3">
              {activeTab === "influencers" 
                ? "Perfect Brand Matches For You" 
                : "Discover Top Influencers"
              }
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {activeTab === "influencers" 
                ? "These businesses are looking for influencers like you. Join now to connect with them and start collaborating on exciting campaigns."
                : "These influencers are ready to collaborate with brands like yours. Sign up now to connect with them and grow your business."
              }
            </p>
            
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3 bg-muted/30 rounded-full px-4 py-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select 
                  className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer"
                  defaultValue="relevance"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="followers">Most Followers</option>
                </select>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => {
            // Update local state without navigating
            setActiveTab(value);
          }}>
            <TabsContent value="influencers" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoBusinesses.map((business, index) => (
                  <div 
                    key={business.id} 
                    onClick={handleProfileAction}
                    className="cursor-pointer relative transition-transform hover:scale-105"
                  >
                    <ProfileCard 
                      userType="influencer" 
                      profile={business} 
                      matchScore={85} 
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="businesses" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoInfluencers.map((influencer, index) => (
                  <div 
                    key={influencer.id} 
                    onClick={handleProfileAction}
                    className="cursor-pointer relative transition-transform hover:scale-105"
                  >
                    <ProfileCard 
                      userType="business" 
                      profile={influencer} 
                      matchScore={85} 
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Final CTA Section */}
        <div className="mb-16 text-center py-16 px-6 bg-gradient-to-br from-primary/5 to-primary/20 rounded-xl border">
          <h2 className="text-3xl font-bold mb-4">Ready to Connect?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join the SOMIE community today and discover the power of authentic connections between brands and influencers of all sizes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => {
                if (!user) {
                  setLocation("/auth-page?mode=register&type=business");
                } else {
                  setLocation("/business-dashboard");
                }
              }}
            >
              <Building2 className="mr-2 h-5 w-5" /> Business Sign Up
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => {
                if (!user) {
                  setLocation("/auth-page?mode=register&type=influencer");
                } else {
                  setLocation("/influencer-dashboard");
                }
              }}
            >
              <User className="mr-2 h-5 w-5" /> Influencer Sign Up
            </Button>
          </div>
        </div>
      </main>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Create an account or sign in to contact {activeTab === "influencers" ? "influencers" : "businesses"}
              and access all features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 mt-4">
            <Button 
              onClick={() => {
                setShowLoginDialog(false);
                setLocation(`/auth-page?mode=register&type=${activeTab === "influencers" ? "influencer" : "business"}`);
              }}
            >
              Create Account
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setShowLoginDialog(false);
                setLocation("/auth-page?mode=login");
              }}
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}