import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/ui/logo";
import { useLocation } from "wouter";
import {
  HelpCircle, Building2, User, Search, Zap, 
  CheckCircle, Award, TrendingUp, BarChart3, DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function WhySomiePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <Logo size="md" onClick={() => setLocation("/")} className="cursor-pointer" />
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
            >
              <User className="h-4 w-4 mr-2" />
              For Influencers
            </Button>
            <Button 
              variant="default"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Why SOMIE
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              For Businesses
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

      <main className="container mx-auto py-8">
        {/* Hero Section */}
        <div className="mb-16 py-12 px-6 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Why Choose SOMIE</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Discover the data-driven reasons why SOMIE is revolutionizing the influencer marketing landscape for both brands and creators.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 py-2 px-3 bg-background rounded-lg shadow-sm border">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Research-backed results</span>
              </div>
              <div className="inline-flex items-center gap-2 py-2 px-3 bg-background rounded-lg shadow-sm border">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Industry-leading ROI</span>
              </div>
              <div className="inline-flex items-center gap-2 py-2 px-3 bg-background rounded-lg shadow-sm border">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Data-driven matching</span>
              </div>
            </div>
          </div>
        </div>
          
        <Tabs defaultValue="why-businesses" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
            <TabsTrigger value="why-businesses" className="text-base py-3">For Brands</TabsTrigger>
            <TabsTrigger value="why-influencers" className="text-base py-3">For Creators</TabsTrigger>
          </TabsList>
          
          {/* For Businesses Content */}
          <TabsContent value="why-businesses" className="mt-0 animate-in fade-in-50 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Why Choose SOMIE for Your Brand?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Research shows that smaller creators drive dramatically higher engagement and ROI. 
                We connect your brand with authentic voices that your target audience truly trusts.
              </p>
            </div>
            
            {/* Micro-Influence Breakdown */}
            <div className="mb-16 bg-muted/20 rounded-xl border p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-1 md:col-span-1">
                  <h3 className="text-2xl font-bold mb-4">The Growing Power of Micro-Influence</h3>
                  <p className="text-muted-foreground mb-4">
                    The influencer marketing landscape is evolving rapidly, with nano and micro-influencers driving the highest engagement rates and authenticity.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="mr-2 mt-1 bg-primary/20 text-primary border-0 px-2 py-0.5 text-xs font-medium rounded-full">70%</div>
                      <span>of consumers trust recommendations from influencers they follow</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-1 bg-primary/20 text-primary border-0 px-2 py-0.5 text-xs font-medium rounded-full">5x</div>
                      <span>higher engagement from micro-influencers compared to mega-influencers</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-1 bg-primary/20 text-primary border-0 px-2 py-0.5 text-xs font-medium rounded-full">89%</div>
                      <span>of marketers say ROI from influencer marketing is comparable or better than other channels</span>
                    </li>
                  </ul>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                    <div className="bg-background rounded-lg p-4 border flex flex-col">
                      <h4 className="font-medium text-primary mb-1">Nano Influencers</h4>
                      <p className="text-xs text-muted-foreground mb-2">1K - 10K followers</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Engagement Rate</span>
                          <span className="font-medium">4-8%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div className="mt-auto pt-3 text-sm flex flex-wrap gap-1">
                        <div className="bg-primary/5 px-2 py-0.5 text-xs rounded">High Trust</div>
                        <div className="bg-primary/5 px-2 py-0.5 text-xs rounded">Authentic</div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-4 border flex flex-col">
                      <h4 className="font-medium text-primary mb-1">Micro Influencers</h4>
                      <p className="text-xs text-muted-foreground mb-2">10K - 100K followers</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Engagement Rate</span>
                          <span className="font-medium">2-4%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      <div className="mt-auto pt-3 text-sm flex flex-wrap gap-1">
                        <div className="bg-primary/5 px-2 py-0.5 text-xs rounded">Niche Focus</div>
                        <div className="bg-primary/5 px-2 py-0.5 text-xs rounded">Affordable</div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-4 border flex flex-col">
                      <h4 className="font-medium text-primary mb-1">Macro Influencers</h4>
                      <p className="text-xs text-muted-foreground mb-2">100K+ followers</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Engagement Rate</span>
                          <span className="font-medium">1-2%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '35%' }}></div>
                        </div>
                      </div>
                      <div className="mt-auto pt-3 text-sm flex flex-wrap gap-1">
                        <div className="bg-primary/5 px-2 py-0.5 text-xs rounded">Wide Reach</div>
                        <div className="bg-primary/5 px-2 py-0.5 text-xs rounded">Brand Safe</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-background p-8 rounded-xl border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg text-primary text-xs font-medium">
                  Research Finding
                </div>
                <h3 className="font-bold text-xl mb-4 mt-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </span>
                  Higher Engagement
                </h3>
                <div className="h-36 mb-6 flex items-center justify-center">
                  <div className="relative w-32 h-32 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-3xl font-bold text-primary">+60%</div>
                    </div>
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full opacity-80">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray="283"
                        strokeDashoffset="113"
                        className="text-primary/60"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Micro-influencers drive engagement rates <span className="font-bold text-primary">up to 60% higher</span> than 
                  macro-influencers, making them ideal for brands targeting niche audiences.
                </p>
                <div className="text-xs text-muted-foreground mt-auto">Source: Kaakandikar et al., 2024</div>
              </div>
              
              <div className="bg-background p-8 rounded-xl border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg text-primary text-xs font-medium">
                  Research Finding
                </div>
                <h3 className="font-bold text-xl mb-4 mt-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </span>
                  Deeper Trust
                </h3>
                <div className="h-36 mb-6 flex items-center justify-center">
                  <div className="bg-muted/30 px-4 py-2 rounded-lg flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">Engagement Rate Comparison</div>
                    <div className="flex items-end h-24 space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 bg-primary/20 rounded-sm"></div>
                        <div className="text-xs mt-1 font-medium">1.7%</div>
                        <div className="text-[9px] text-muted-foreground">Macro</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-8 bg-primary/40 rounded-sm"></div>
                        <div className="text-xs mt-1 font-medium">4.5%</div>
                        <div className="text-[9px] text-muted-foreground">Micro</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-24 w-8 bg-primary/80 rounded-sm"></div>
                        <div className="text-xs mt-1 font-medium text-primary font-bold">8.8%</div>
                        <div className="text-[9px] text-muted-foreground">Nano</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Nano-influencers (under 5,000 followers) achieve engagement rates of <span className="font-bold text-primary">up to 8.8%</span> due to 
                  their deep community trust and personal interactions.
                </p>
                <div className="text-xs text-muted-foreground mt-auto">Source: Beichert et al., 2024</div>
              </div>
              
              <div className="bg-background p-8 rounded-xl border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg text-primary text-xs font-medium">
                  Research Finding
                </div>
                <h3 className="font-bold text-xl mb-4 mt-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </span>
                  Incredible ROI
                </h3>
                <div className="h-36 mb-6 flex items-center justify-center">
                  <div className="relative w-28 h-28 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="text-xs text-muted-foreground">Return on</div>
                      <div className="text-xs text-muted-foreground -mt-0.5">Investment</div>
                      <div className="text-2xl font-bold text-primary mt-1">+233%</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">With nano-influencers</div>
                    </div>
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full opacity-80">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset="0"
                        className="text-primary/60"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Nano and micro-influencer campaigns cost substantially less, with brands reporting 
                  <span className="font-bold text-primary"> up to 233% ROI</span> in certain industries.
                </p>
                <div className="text-xs text-muted-foreground mt-auto">Source: Hublikar, 2020</div>
              </div>
            </div>
            
            <div className="bg-muted/20 p-8 rounded-xl border mb-12">
              <div className="text-center">
                <blockquote className="text-lg italic text-muted-foreground max-w-2xl mx-auto">
                  "Micro-influencers build deeper trust with their followers, increasing purchase intent by 22% 
                  compared to traditional advertising."
                </blockquote>
                <cite className="text-sm block mt-4 font-medium">— Gupta & Mahajan, 2019</cite>
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => setLocation("/")}
                className="px-8"
              >
                <Search className="mr-2 h-5 w-5" /> Browse Influencers
              </Button>
            </div>
          </TabsContent>
          
          {/* For Influencers Content */}
          <TabsContent value="why-influencers" className="mt-0 animate-in fade-in-50 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Why Choose SOMIE as a Creator?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                The influencer marketing industry is booming, creating unprecedented opportunities for creators of all sizes.
                SOMIE helps you capitalize on this growth and connect with brands that value your unique voice.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-background p-8 rounded-xl border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg text-primary text-xs font-medium">
                  Industry Trend
                </div>
                <h3 className="font-bold text-xl mb-4 mt-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </span>
                  Explosive Growth
                </h3>
                <div className="h-36 mb-6 flex items-center justify-center">
                  <div className="relative w-28 h-28 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="text-xs text-muted-foreground">Digital Ad Spending</div>
                      <div className="text-2xl font-bold text-primary mt-1">$836B</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">Projected by 2026</div>
                    </div>
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full opacity-80">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeDasharray="283"
                        strokeDashoffset="70"
                        className="text-primary/60"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Social media marketing continues to see exponential growth, with global digital ad spending projected to reach
                  <span className="font-bold text-primary"> $836 billion by 2026</span>, driven by AI-powered personalization.
                </p>
                <div className="text-xs text-muted-foreground mt-auto">Source: Shalihati et al., 2025</div>
              </div>
              
              <div className="bg-background p-8 rounded-xl border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg text-primary text-xs font-medium">
                  Industry Trend
                </div>
                <h3 className="font-bold text-xl mb-4 mt-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </span>
                  Brand Adoption
                </h3>
                <div className="h-36 mb-6 flex items-center justify-center">
                  <div className="bg-muted/30 px-4 py-3 rounded-lg flex flex-col items-center group-hover:scale-105 transition-transform duration-300" style={{ width: "85%" }}>
                    <div className="text-[10px] text-muted-foreground mb-1 font-medium">Brands Using Influencers</div>
                    <div className="w-full bg-muted rounded-full h-5 relative overflow-hidden mt-1">
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary/70 rounded-full" 
                        style={{ width: '93%' }}
                      >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">93%</div>
                      </div>
                    </div>
                    <div className="text-[9px] mt-1 text-muted-foreground">of all marketers</div>
                    <div className="mt-2 w-full bg-muted rounded-full h-5 relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary/70 rounded-full" 
                        style={{ width: '90%' }}
                      >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">+150%</div>
                      </div>
                    </div>
                    <div className="text-[9px] mt-1 text-muted-foreground">social commerce growth</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  <span className="font-bold text-primary">93% of marketers</span> now use social media influencers, contributing to a 
                  <span className="font-bold text-primary"> 150% increase</span> in social commerce revenue over the past five years.
                </p>
                <div className="text-xs text-muted-foreground mt-auto">Source: Kamkankaew et al., 2025</div>
              </div>
              
              <div className="bg-background p-8 rounded-xl border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg text-primary text-xs font-medium">
                  Industry Trend
                </div>
                <h3 className="font-bold text-xl mb-4 mt-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </span>
                  Market Opportunity
                </h3>
                <div className="h-36 mb-6 flex items-center justify-center">
                  <div className="relative w-28 h-28 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="text-xs text-muted-foreground">Influencer Marketing</div>
                      <div className="text-2xl font-bold text-primary mt-1">$22B</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">Projected by 2025</div>
                    </div>
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full opacity-80">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeDasharray="283"
                        strokeDashoffset="70"
                        className="text-primary/60"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  The influencer marketing industry is expected to reach <span className="font-bold text-primary">$22 billion by 2025</span>, creating vast income opportunities for creators at all levels.
                </p>
                <div className="text-xs text-muted-foreground mt-auto">Source: Marketer Quarterly, 2023</div>
              </div>
            </div>
            
            <div className="bg-muted/20 p-8 rounded-xl border mb-12">
              <div className="text-center">
                <blockquote className="text-lg italic text-muted-foreground max-w-2xl mx-auto">
                  "The most successful nano-influencers are seeing 5x growth in brand partnerships year over year, with a 74% higher retention rate than celebrity endorsements."
                </blockquote>
                <cite className="text-sm block mt-4 font-medium">— Cohen & Singh, 2024</cite>
                <div className="text-xs text-muted-foreground mt-2">Source: Gujar et al., 2024</div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => setLocation("/")}
                className="px-8"
              >
                <Zap className="mr-2 h-5 w-5" /> Start Getting Matched
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}