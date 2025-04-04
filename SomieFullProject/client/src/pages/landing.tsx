import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { 
  Loader2, Search, User, Building2, Filter, Instagram, Youtube, Star, 
  ChevronRight, Award, Sparkles, TrendingUp, Clock, BadgePercent, Users,
  ShoppingBag, DollarSign, HeartHandshake, Camera, Flame, Gift, Info
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
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("influencers");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [socialHandle, setSocialHandle] = useState("");
  const [showSocialOverlay, setShowSocialOverlay] = useState(!user);

  // When user clicks on a profile or tries to contact, check if logged in
  const handleProfileAction = () => {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      // If logged in, redirect to appropriate dashboard
      if (user.userType === "business") {
        setLocation("/business-dashboard");
      } else {
        setLocation("/influencer-dashboard");
      }
    }
  };

  // Handle social handle submission
  const handleSocialSubmit = () => {
    // For now, just close the overlay
    // In a real implementation, we would store this and use it for personalization
    setShowSocialOverlay(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Social Media Handle Overlay */}
      {showSocialOverlay && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <Logo size="lg" className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Welcome to SOMIE</h2>
                <p className="text-muted-foreground">
                  Enter your social media handle to personalize your experience
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      placeholder="Your Instagram, TikTok or YouTube handle" 
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSocialSubmit}>Continue</Button>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon">
                    <Instagram className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <span className="text-lg font-bold">TT</span>
                  </Button>
                  <Button variant="outline" size="icon">
                    <Youtube className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowSocialOverlay(false)}
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost"
              onClick={() => setLocation("/why-somie")}
            >
              <Info className="h-4 w-4 mr-2" />
              Why SOMIE
            </Button>
            
            {!user && (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => setLocation("/auth-page?mode=register")}
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
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {activeTab === "influencers" 
                ? "Discover Influencers" 
                : "Find Brand Collaborations"
              }
            </h1>
            <p className="text-muted-foreground">
              {activeTab === "influencers"
                ? "Connect with the perfect influencers for your brand"
                : "Find brands looking to collaborate with content creators"
              }
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge variant="outline" className="text-sm py-1 px-3 bg-primary/5 mr-2">
              <Gift className="w-3.5 h-3.5 mr-1" />
              <span className="font-medium">Deal of the Day</span>
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3 bg-primary/5">
              <Flame className="w-3.5 h-3.5 mr-1" />
              <span className="font-medium">Trending</span> 
            </Badge>
          </div>
        </div>

        {/* Category navigation - Amazon inspired */}
        <div className="flex overflow-x-auto scrollbar-hide pb-2 mb-6 -mx-1">
          <div className="flex space-x-2 px-1">
            {activeTab === "influencers" ? (
              <>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Award className="h-4 w-4 mr-2" />
                  All Categories
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Users className="h-4 w-4 mr-2" />
                  Micro (1K-10K)
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Rising Stars
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Youtube className="h-4 w-4 mr-2" />
                  YouTube
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Camera className="h-4 w-4 mr-2" />
                  Fashion
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Star className="h-4 w-4 mr-2" />
                  Top Rated
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Building2 className="h-4 w-4 mr-2" />
                  All Industries
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Highest Rewards
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <BadgePercent className="h-4 w-4 mr-2" />
                  Special Offers
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Products
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <HeartHandshake className="h-4 w-4 mr-2" />
                  Collaborations
                </Button>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <Clock className="h-4 w-4 mr-2" />
                  New Arrivals
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder={
                activeTab === "influencers"
                  ? "Search by niche, location, or content type..."
                  : "Search by industry, product, or campaign type..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Top picks section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              {activeTab === "influencers" ? "Top Influencers" : "Featured Brands"}
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeTab === "influencers" ? demoInfluencers : demoBusinesses).slice(0, 4).map((item, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={handleProfileAction}
              >
                <div className="absolute top-0 left-0 bg-primary text-white text-xs px-2 py-1 rounded-br font-bold">
                  #{index + 1}
                </div>
                <div className="h-40 bg-muted/40 flex items-center justify-center">
                  {'displayName' in item ? (
                    <User className="h-16 w-16 text-muted-foreground/50" />
                  ) : (
                    <Building2 className="h-16 w-16 text-muted-foreground/50" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold truncate">
                    {'displayName' in item ? item.displayName : item.businessName}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    {'platform' in item ? (
                      <>
                        {item.platform === 'instagram' ? (
                          <Instagram className="h-3.5 w-3.5 mr-1.5" />
                        ) : item.platform === 'youtube' ? (
                          <Youtube className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                          <span className="font-bold text-xs mr-1.5">TT</span>
                        )}
                        <span>{formatNumber(item.followerCount)} followers</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3.5 w-3.5 mr-1.5" />
                        <span>{item.industry}</span>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="ml-1 text-sm font-medium">
                      {'displayName' in item ? item.rating : item.rating}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {'displayName' in item ? item.niche : item.rewardType}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {activeTab === "influencers" 
                ? "Browse All Influencers" 
                : "All Available Brands"
              }
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select 
                className="text-sm border rounded p-1"
                defaultValue="relevance"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="followers">Most Followers</option>
              </select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="influencers" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoInfluencers.map((influencer, index) => (
                  <div 
                    key={influencer.id} 
                    onClick={handleProfileAction}
                    className="cursor-pointer relative"
                  >
                    {/* Amazon-inspired rank indicator */}
                    <div className="absolute top-3 left-3 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                      #{index + 1}
                    </div>
                    <ProfileCard 
                      userType="business" 
                      profile={influencer} 
                      matchScore={85} 
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="businesses" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoBusinesses.map((business, index) => (
                  <div 
                    key={business.id} 
                    onClick={handleProfileAction}
                    className="cursor-pointer relative"
                  >
                    {/* Amazon-inspired rank indicator */}
                    <div className="absolute top-3 left-3 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                      #{index + 1}
                    </div>
                    <ProfileCard 
                      userType="influencer" 
                      profile={business} 
                      matchScore={85} 
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
                setLocation("/auth-page?mode=register");
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