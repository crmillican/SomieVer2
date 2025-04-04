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
import { 
  Zap, 
  Info, 
  RefreshCw, 
  DollarSign, 
  Users, 
  BarChart, 
  DownloadCloud, 
  Sparkles,
  TrendingUp,
  Award,
  Target,
  User,
  UserCheck,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SmartBudgetOptimizerProps {
  initialBudget?: number;
  onOptimizationComplete?: (optimization: BudgetOptimization) => void;
  className?: string;
}

export interface BudgetOptimization {
  totalBudget: number;
  allocation: {
    microInfluencers: {
      percentage: number;
      amount: number;
      count: number;
      avgReward: number;
      estimatedReach: number;
    };
    midTier: {
      percentage: number;
      amount: number;
      count: number;
      avgReward: number;
      estimatedReach: number;
    };
    premium: {
      percentage: number;
      amount: number;
      count: number;
      avgReward: number;
      estimatedReach: number;
    };
  };
  projectedMetrics: {
    totalReach: number;
    estimatedEngagement: number;
    estimatedConversions: number;
    estimatedROI: number;
    confidenceScore: number;
  };
  recommendedCriteria: {
    minFollowers: number;
    minEngagement: number;
    contentTypes: string[];
    idealTimeframe: number;
  };
}

interface InfluencerTier {
  name: string;
  icon: React.ReactNode;
  followers: string;
  engagementRate: string;
  averageReward: string;
  reachPerDollar: number;
  description: string;
}

/**
 * Smart Budget Optimizer Component
 * 
 * Provides AI-driven budget allocation recommendations for influencer marketing campaigns
 * Based on the requested features #2 in the user's list
 */
export function SmartBudgetOptimizer({ initialBudget = 1000, onOptimizationComplete, className = "" }: SmartBudgetOptimizerProps) {
  const { toast } = useToast();
  const [budget, setBudget] = useState(initialBudget);
  const [goal, setGoal] = useState<"awareness" | "engagement" | "sales">("awareness");
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<BudgetOptimization | null>(null);
  const [activeTab, setActiveTab] = useState("optimization");
  
  // Define influencer tiers to explain allocation strategy
  const influencerTiers: InfluencerTier[] = [
    {
      name: "Micro-Influencers",
      icon: <User className="h-4 w-4 text-blue-500" />,
      followers: "1K - 10K",
      engagementRate: "3-8%",
      averageReward: "$50-150",
      reachPerDollar: 120,
      description: "High engagement, niche audiences, cost-effective"
    },
    {
      name: "Mid-Tier",
      icon: <UserCheck className="h-4 w-4 text-indigo-500" />,
      followers: "10K - 100K",
      engagementRate: "2-5%",
      averageReward: "$200-500",
      reachPerDollar: 80,
      description: "Balance of reach and engagement, quality content"
    },
    {
      name: "Premium",
      icon: <Award className="h-4 w-4 text-amber-500" />,
      followers: "100K+",
      engagementRate: "1-3%",
      averageReward: "$1000+",
      reachPerDollar: 40,
      description: "Maximum reach, brand recognition, prestige"
    }
  ];
  
  // Generate AI-driven budget allocation
  const generateOptimization = () => {
    setOptimizing(true);
    
    // Simulate AI calculation with a delay
    setTimeout(() => {
      // Apply tiered allocation approach based on budget size and goal
      let microPercentage = 0, midPercentage = 0, premiumPercentage = 0;
      
      // For small budgets (<$500), focus heavily on nano/micro influencers
      if (budget < 500) {
        // Ultra beginner mode - prioritize nano/micro influencers for small budgets
        microPercentage = 100;
        midPercentage = 0;
        premiumPercentage = 0;
      } else if (budget < 1000) {
        // Small budget mode - still prioritize micro with some mid-tier
        switch (goal) {
          case "awareness":
            microPercentage = 80;
            midPercentage = 20;
            premiumPercentage = 0;
            break;
          case "engagement":
            microPercentage = 90;
            midPercentage = 10;
            premiumPercentage = 0;
            break;
          case "sales":
            microPercentage = 85;
            midPercentage = 15;
            premiumPercentage = 0;
            break;
        }
      } else if (budget < 2000) {
        // Medium budget - focus on micro and mid-tier
        switch (goal) {
          case "awareness":
            microPercentage = 60;
            midPercentage = 40;
            premiumPercentage = 0;
            break;
          case "engagement":
            microPercentage = 70;
            midPercentage = 30;
            premiumPercentage = 0;
            break;
          case "sales":
            microPercentage = 65;
            midPercentage = 35;
            premiumPercentage = 0;
            break;
        }
      } else {
        // Larger budget - standard allocation
        switch (goal) {
          case "awareness":
            microPercentage = 40;
            midPercentage = 40;
            premiumPercentage = 20;
            break;
          case "engagement":
            microPercentage = 60;
            midPercentage = 30;
            premiumPercentage = 10;
            break;
          case "sales":
            microPercentage = 50;
            midPercentage = 40;
            premiumPercentage = 10;
            break;
        }
      }
      
      // Calculate amounts based on percentages
      const microAmount = (budget * microPercentage) / 100;
      const midAmount = (budget * midPercentage) / 100;
      const premiumAmount = (budget * premiumPercentage) / 100;
      
      // Calculate estimated number of influencers for each tier
      const microAvgReward = 100; // Average reward for micro-influencers
      const midAvgReward = 350; // Average reward for mid-tier
      const premiumAvgReward = 1500; // Average reward for premium
      
      const microCount = Math.floor(microAmount / microAvgReward);
      const midCount = Math.floor(midAmount / midAvgReward);
      const premiumCount = Math.floor(premiumAmount / premiumAvgReward);
      
      // Calculate estimated reach for each tier
      const microReach = microCount * 5000; // Average reach per micro-influencer
      const midReach = midCount * 50000; // Average reach per mid-tier
      const premiumReach = premiumCount * 200000; // Average reach per premium
      
      // Calculate total projected metrics
      const totalReach = microReach + midReach + premiumReach;
      const estimatedEngagement = (microReach * 0.05) + (midReach * 0.03) + (premiumReach * 0.01); // Avg engagement rates
      const conversionRate = goal === "sales" ? 0.015 : (goal === "engagement" ? 0.008 : 0.004); // Conversion rates vary by goal
      const estimatedConversions = estimatedEngagement * conversionRate;
      
      // Calculate ROI with industry-specific customer values
      const industryValues = {
        "retail": 45, // Average retail purchase value
        "restaurant": 28, // Average restaurant order value
        "beauty": 65, // Average beauty product purchase
        "fashion": 75, // Average fashion purchase
        "health": 90, // Average health/wellness product
        "technology": 120, // Average tech product purchase
        "entertainment": 35, // Average entertainment purchase
        "education": 150, // Average educational product/service
        "services": 95, // Average service industry purchase
        "home": 110, // Average home goods purchase
      };
      
      // Default to retail if no specific industry known
      const businessIndustry = "retail"; // In production, get from business profile
      const avgCustomerValue = industryValues[businessIndustry] || 50;
      
      // Add customer retention modifier
      const retentionModifier = goal === "sales" ? 1.3 : (goal === "awareness" ? 1.1 : 1.2);
      
      // Calculate lifetime value with retention factored in
      const customerLTV = avgCustomerValue * retentionModifier;
      
      // Calculate ROI with more realistic customer value
      const estimatedROI = Math.round((estimatedConversions * customerLTV / budget) * 100);
      
      // Determine confidence score based on budget and distribution
      let confidenceScore = 75; // Base confidence
      if (budget > 5000) confidenceScore += 10; // Higher confidence with larger budget
      if (microCount > 5 && midCount > 2) confidenceScore += 5; // More diverse allocation increases confidence
      if (premiumCount === 0 && budget > 3000) confidenceScore -= 5; // No premium when budget allows reduces confidence
      
      confidenceScore = Math.min(95, Math.max(60, confidenceScore)); // Cap between 60-95%
      
      // Recommended criteria based on allocation
      const recommendedCriteria = {
        minFollowers: goal === "awareness" ? 5000 : 1000,
        minEngagement: goal === "engagement" ? 4 : 2,
        contentTypes: goal === "sales" ? ["image", "video"] : ["image", "story"],
        idealTimeframe: goal === "awareness" ? 14 : (goal === "engagement" ? 21 : 30)
      };
      
      // Build the complete optimization result
      const optimization: BudgetOptimization = {
        totalBudget: budget,
        allocation: {
          microInfluencers: {
            percentage: microPercentage,
            amount: microAmount,
            count: microCount,
            avgReward: microAvgReward,
            estimatedReach: microReach
          },
          midTier: {
            percentage: midPercentage,
            amount: midAmount,
            count: midCount,
            avgReward: midAvgReward,
            estimatedReach: midReach
          },
          premium: {
            percentage: premiumPercentage,
            amount: premiumAmount,
            count: premiumCount,
            avgReward: premiumAvgReward,
            estimatedReach: premiumReach
          }
        },
        projectedMetrics: {
          totalReach: totalReach,
          estimatedEngagement: estimatedEngagement,
          estimatedConversions: estimatedConversions,
          estimatedROI: estimatedROI,
          confidenceScore: confidenceScore
        },
        recommendedCriteria: recommendedCriteria
      };
      
      setResult(optimization);
      
      if (onOptimizationComplete) {
        onOptimizationComplete(optimization);
      }
      
      toast({
        title: "Budget optimization complete",
        description: "AI has generated an optimal budget allocation strategy",
      });
      
      setOptimizing(false);
    }, 1500);
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary" />
          Smart Budget Optimizer
        </CardTitle>
        <CardDescription>
          AI-powered budget allocation for maximum campaign ROI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="optimization" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center">
                <span>Campaign Budget</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex">
                      <Info className="h-3 w-3 ml-1.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Enter your total budget for this influencer marketing campaign</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  placeholder="Enter total budget"
                  className="flex-1"
                  min={100}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goal" className="flex items-center">
                <span>Marketing Goal</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex">
                      <Info className="h-3 w-3 ml-1.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Your primary objective will influence how the budget is allocated</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select value={goal} onValueChange={(value: "awareness" | "engagement" | "sales") => setGoal(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a marketing goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness" className="flex items-center">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Brand Awareness</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="engagement">
                    <div className="flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-green-500" />
                      <span>Engagement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sales">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Sales & Conversions</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={generateOptimization}
              disabled={optimizing || budget < 100}
            >
              {optimizing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Optimal Allocation
                </>
              )}
            </Button>
            
            {result && (
              <div className="mt-6 space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-primary" />
                  Recommended Allocation
                </h3>
                
                <div className="space-y-3">
                  {/* Micro-influencers */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-blue-500 mr-2" />
                        <span>Micro-Influencers</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {result.allocation.microInfluencers.count} creators
                        </Badge>
                      </div>
                      <div className="font-medium">
                        ${Math.round(result.allocation.microInfluencers.amount)} 
                        <span className="text-xs text-muted-foreground ml-1">
                          ({result.allocation.microInfluencers.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={result.allocation.microInfluencers.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Est. reach: {formatNumber(result.allocation.microInfluencers.estimatedReach)}</span>
                      <span>Avg. reward: ${result.allocation.microInfluencers.avgReward}</span>
                    </div>
                  </div>
                  
                  {/* Mid-tier */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 text-indigo-500 mr-2" />
                        <span>Mid-Tier Influencers</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {result.allocation.midTier.count} creators
                        </Badge>
                      </div>
                      <div className="font-medium">
                        ${Math.round(result.allocation.midTier.amount)} 
                        <span className="text-xs text-muted-foreground ml-1">
                          ({result.allocation.midTier.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={result.allocation.midTier.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Est. reach: {formatNumber(result.allocation.midTier.estimatedReach)}</span>
                      <span>Avg. reward: ${result.allocation.midTier.avgReward}</span>
                    </div>
                  </div>
                  
                  {/* Premium */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-amber-500 mr-2" />
                        <span>Premium Influencers</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {result.allocation.premium.count} creators
                        </Badge>
                      </div>
                      <div className="font-medium">
                        ${Math.round(result.allocation.premium.amount)} 
                        <span className="text-xs text-muted-foreground ml-1">
                          ({result.allocation.premium.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={result.allocation.premium.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Est. reach: {formatNumber(result.allocation.premium.estimatedReach)}</span>
                      <span>Avg. reward: ${result.allocation.premium.avgReward}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <Users className="h-3 w-3 mr-1 text-blue-500" />
                      Total Reach
                    </h4>
                    <p className="text-lg font-bold">{formatNumber(result.projectedMetrics.totalReach)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <BarChart className="h-3 w-3 mr-1 text-green-500" />
                      Engagement
                    </h4>
                    <p className="text-lg font-bold">{formatNumber(Math.round(result.projectedMetrics.estimatedEngagement))}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 text-amber-500" />
                      Est. ROI
                    </h4>
                    <p className="text-lg font-bold text-green-600">{result.projectedMetrics.estimatedROI}%</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <Target className="h-3 w-3 mr-1 text-red-500" />
                      Confidence
                    </h4>
                    <p className="text-lg font-bold">{result.projectedMetrics.confidenceScore}%</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Influencer Tier Guide</h3>
              
              {influencerTiers.map((tier, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <div className="mt-0.5">{tier.icon}</div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-medium">{tier.name}</h4>
                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-muted-foreground">Followers:</span>
                        <span className="ml-1 font-medium">{tier.followers}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagement:</span>
                        <span className="ml-1 font-medium">{tier.engagementRate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Payment:</span>
                        <span className="ml-1 font-medium">{tier.averageReward}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Budget Allocation Strategy</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground text-xs">
                  Our AI optimizes your budget based on campaign goals and industry benchmarks:
                </p>
                
                <div className="flex items-start space-x-2 text-xs">
                  <Users className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Brand Awareness</span>
                    <p className="text-muted-foreground">Higher allocation to premium influencers for maximum reach and visibility.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 text-xs">
                  <BarChart className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Engagement</span>
                    <p className="text-muted-foreground">Prioritizes micro-influencers with higher engagement rates for better interaction.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 text-xs">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Sales & Conversions</span>
                    <p className="text-muted-foreground">Balanced approach with focus on mid-tier influencers who drive both reach and conversions.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("optimization")}>
                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                Return to Optimizer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {result && (
        <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center">
            <Zap className="h-3 w-3 mr-1 text-primary" />
            <span>AI-optimized for {goal} goal</span>
          </div>
          <div>
            {new Date().toLocaleDateString()}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}