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
import { 
  BarChart, 
  TrendingUp, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PerformanceForecasterProps {
  offerData?: {
    reward?: string;
    minFollowers?: number;
    minEngagement?: number;
    postsRequired?: number;
    timeframe?: number;
    category?: string;
    contentType?: string;
    location?: string;
  };
  onForecastComplete?: (forecast: CampaignForecast) => void;
  className?: string;
}

export interface PerformanceInterval {
  lower: number;
  expected: number;
  upper: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CampaignForecast {
  reach: PerformanceInterval;
  engagement: PerformanceInterval;
  clicks: PerformanceInterval;
  conversions: PerformanceInterval;
  roi: {
    percentage: PerformanceInterval;
    value: PerformanceInterval;
  };
  timeToResults: {
    firstResults: number; // days
    peakPerformance: number; // days
    longevity: number; // days
  };
  confidence: number;
  riskFactors: {
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
    mitigation: string;
  }[];
  optimizationTips: {
    id: string;
    tip: string;
    impact: 'small' | 'medium' | 'large';
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
}

/**
 * Performance Forecaster Component
 * 
 * Provides AI-driven performance predictions for influencer campaigns
 * Based on the requested features #4 in the user's list
 */
export function PerformanceForecaster({ 
  offerData = {}, 
  onForecastComplete,
  className = "" 
}: PerformanceForecasterProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<CampaignForecast | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [forecastParams, setForecastParams] = useState({
    budget: parseFloat(offerData.reward || "500"),
    influencerCount: offerData.postsRequired || 3,
    averageFollowers: offerData.minFollowers || 10000,
    averageEngagement: offerData.minEngagement || 3,
    campaignDuration: offerData.timeframe || 14,
    contentType: offerData.contentType || "image",
    industry: offerData.category || "fashion"
  });

  // Generate forecast based on parameters - simplified for non-technical users
  const generateForecast = () => {
    setLoading(true);
    
    // Simulate AI forecast calculation with a delay
    setTimeout(() => {
      // Create industry-specific explanations for clearer understanding
      const industryInsights: Record<string, string> = {
        "retail": "Retail campaigns typically drive good purchase behavior",
        "restaurant": "Food content is highly shareable and engages well",
        "fashion": "Fashion has high engagement and sharing potential",
        "beauty": "Beauty content drives strong consideration and purchase",
        "technology": "Tech content attracts high-intent audiences",
        "default": "This industry shows average performance patterns"
      };
      
      const contentInsights: Record<string, string> = {
        "video": "Videos typically get 25% more views than images",
        "image": "Images are effective for showcasing products clearly",
        "story": "Stories create urgency but have shorter visibility",
        "default": "This content type has average performance"
      };
      
      // Get appropriate insight or default
      const industryKey = forecastParams.industry as keyof typeof industryInsights;
      const contentKey = forecastParams.contentType as keyof typeof contentInsights;
      const industryInsight = industryInsights[industryKey] || industryInsights["default"];
      const contentInsight = contentInsights[contentKey] || contentInsights["default"];
      
      // Calculate total potential reach with simplified multipliers
      const totalPotentialReach = forecastParams.averageFollowers * forecastParams.influencerCount;
      const viewRatio = forecastParams.contentType === "video" ? 0.75 : 0.6;
      
      // Create 3-level forecast for reach (Conservative, Expected, Optimistic)
      const expectedReach = Math.round(totalPotentialReach * viewRatio);
      const conservativeReach = Math.round(expectedReach * 0.6); // More conservative for beginners
      const optimisticReach = Math.round(expectedReach * 1.4);
      
      // Simplified engagement calculation with 3-level forecast
      const engagementRatio = forecastParams.averageEngagement / 100;
      const expectedEngagement = Math.round(expectedReach * engagementRatio);
      const conservativeEngagement = Math.round(expectedEngagement * 0.7);
      const optimisticEngagement = Math.round(expectedEngagement * 1.5);
      
      // Rename CTR to "Action Rate" for better understanding by non-technical users
      const baseActionRate = 0.015; // 1.5% base action rate
      
      // Simplify multipliers for easier understanding
      let actionMultiplier = 1.0;
      if (forecastParams.contentType === "video") actionMultiplier *= 1.2;
      if (forecastParams.industry === "technology") actionMultiplier *= 1.3;
      if (forecastParams.industry === "fashion") actionMultiplier *= 1.15;
      
      // Calculate "Actions" (formerly clicks) with friendly labels
      const expectedActionRate = baseActionRate * actionMultiplier;
      const expectedActions = Math.round(expectedEngagement * expectedActionRate);
      const conservativeActions = Math.round(expectedActions * 0.6);
      const optimisticActions = Math.round(expectedActions * 1.6);
      
      // Simplify conversion calculations with business-friendly terminology
      const baseResultRate = 0.08; // 8% base result rate (formerly conversion rate)
      const expectedResults = Math.round(expectedActions * baseResultRate);
      const conservativeResults = Math.round(expectedResults * 0.6);
      const optimisticResults = Math.round(expectedResults * 1.7);
      
      // Industry-specific customer values for more accurate ROI 
      const industryValues: Record<string, number> = {
        "retail": 45,
        "restaurant": 28,
        "fashion": 65,
        "beauty": 55,
        "technology": 120,
        "default": 45
      };
      
      // Get appropriate value or default
      const industry = forecastParams.industry as keyof typeof industryValues;
      const avgCustomerValue = industryValues[industry] || industryValues["default"];
      
      // Calculate ROI with simplified explanation
      const totalRevenue = expectedResults * avgCustomerValue;
      const totalCost = forecastParams.budget * forecastParams.influencerCount;
      const expectedROIPercentage = Math.round((totalRevenue / totalCost - 1) * 100);
      const expectedROIValue = totalRevenue - totalCost;
      
      // Create 3-level ROI forecast
      const conservativeROIPercentage = Math.max(0, Math.round(expectedROIPercentage * 0.5));
      const optimisticROIPercentage = Math.round(expectedROIPercentage * 1.8);
      
      // Determine confidence score based on inputs
      let confidence = 75; // Base confidence
      
      // More influencers = more data = higher confidence
      if (forecastParams.influencerCount >= 5) confidence += 5;
      if (forecastParams.influencerCount >= 10) confidence += 3;
      
      // Higher engagement = more predictable results
      if (forecastParams.averageEngagement >= 4) confidence += 3;
      if (forecastParams.averageEngagement >= 6) confidence += 2;
      
      // Longer campaigns = more uncertainty
      if (forecastParams.campaignDuration > 21) confidence -= 3;
      
      // Certain industries have more consistent data
      if (forecastParams.industry === "technology") confidence += 2;
      if (forecastParams.industry === "fashion") confidence += 4;
      
      // Cap confidence between 60-95%
      confidence = Math.min(95, Math.max(60, confidence));
      
      // Generate risk factors
      const riskFactors = [
        {
          id: "risk1",
          name: "Seasonal variation",
          severity: forecastParams.industry === "fashion" ? "medium" as "medium" : "low" as "low",
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
          severity: forecastParams.influencerCount < 5 ? "high" as "high" : "medium" as "medium",
          impact: "Small number of influencers creates higher result variance",
          mitigation: "Increase number of influencers to stabilize results"
        }
      ] as CampaignForecast['riskFactors'];
      
      // Generate optimization tips
      const optimizationTips = [
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
      ] as CampaignForecast['optimizationTips'];
      
      // Define variance constants for 3-level forecasts
      const reachVariance = 0.2;  // 20% variance
      const engagementVariance = 0.25; // 25% variance
      const clicksVariance = 0.3; // 30% variance for clicks/actions
      const conversionVariance = 0.35; // 35% variance for conversions
      const roiVariance = 0.4; // 40% variance for ROI (higher uncertainty)
      
      // Map our expected actions to clicks for compatibility
      const expectedClicks = expectedActions;
      const expectedConversions = expectedResults;
      
      // Build the complete forecast
      const forecast: CampaignForecast = {
        reach: {
          expected: expectedReach,
          lower: conservativeReach,
          upper: optimisticReach,
          trend: "up" as "up"
        },
        engagement: {
          expected: expectedEngagement,
          lower: conservativeEngagement,
          upper: optimisticEngagement,
          trend: "stable" as "stable"
        },
        clicks: {
          expected: expectedActions,
          lower: conservativeActions,
          upper: optimisticActions,
          trend: "up" as "up"
        },
        conversions: {
          expected: expectedResults,
          lower: conservativeResults,
          upper: optimisticResults,
          trend: "stable" as "stable"
        },
        roi: {
          percentage: {
            expected: expectedROIPercentage,
            lower: conservativeROIPercentage,
            upper: optimisticROIPercentage,
            trend: "up" as "up"
          },
          value: {
            expected: Math.round(expectedROIValue),
            lower: Math.round(expectedROIValue * 0.6), // 60% of expected
            upper: Math.round(expectedROIValue * 1.5), // 150% of expected
            trend: "up" as "up"
          }
        },
        timeToResults: {
          firstResults: 2, // days
          peakPerformance: Math.floor(forecastParams.campaignDuration * 0.6), // 60% through campaign
          longevity: forecastParams.campaignDuration + 7 // campaign + 1 week
        },
        confidence: confidence,
        riskFactors: riskFactors,
        optimizationTips: optimizationTips
      };
      
      setForecast(forecast);
      setLoading(false);
      
      if (onForecastComplete) {
        onForecastComplete(forecast);
      }
      
      toast({
        title: "Forecast generated",
        description: "AI has predicted your campaign performance"
      });
      
    }, 1500);
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Trend indicator component
  const TrendIndicator = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
    if (!trend || trend === 'stable') {
      return <span className="text-amber-500">●</span>;
    } else if (trend === 'up') {
      return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    } else {
      return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    }
  };
  
  // Initialize from offer data on component mount
  useEffect(() => {
    // Initialize parameters from offer data if available
    if (offerData.reward || offerData.minFollowers || offerData.minEngagement) {
      setForecastParams({
        budget: parseFloat(offerData.reward || "500"),
        influencerCount: offerData.postsRequired || 3,
        averageFollowers: offerData.minFollowers || 10000,
        averageEngagement: offerData.minEngagement || 3,
        campaignDuration: offerData.timeframe || 14,
        contentType: offerData.contentType || "image",
        industry: offerData.category || "fashion"
      });
    }
    
    // Generate initial forecast
    generateForecast();
  }, [offerData]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-primary" />
          Performance Forecaster
        </CardTitle>
        <CardDescription>
          AI-generated campaign performance predictions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2 text-primary" />
                <span>Generating forecast...</span>
              </div>
            ) : forecast ? (
              <div className="space-y-4">
                {/* Confidence indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center">
                          <span className="font-medium text-sm mr-1">Forecast Confidence:</span>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Confidence score reflects the reliability of this forecast based on available data and industry benchmarks
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold">{forecast.confidence}%</span>
                    <Badge 
                      className="ml-2"
                      variant={forecast.confidence >= 80 ? "default" : forecast.confidence >= 70 ? "secondary" : "outline"}
                    >
                      {forecast.confidence >= 80 ? "High" : forecast.confidence >= 70 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                </div>
                
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Reach */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Reach
                      </span>
                      <TrendIndicator trend={forecast.reach.trend} />
                    </h4>
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold">{formatNumber(forecast.reach.expected)}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        users
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Range: {formatNumber(forecast.reach.lower)} - {formatNumber(forecast.reach.upper)}
                    </p>
                  </div>
                  
                  {/* Engagement */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center">
                        <BarChart className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        Engagement
                      </span>
                      <TrendIndicator trend={forecast.engagement.trend} />
                    </h4>
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold">{formatNumber(forecast.engagement.expected)}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        interactions
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rate: {(forecast.engagement.expected / forecast.reach.expected * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  {/* Conversions */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Conversions
                      </span>
                      <TrendIndicator trend={forecast.conversions.trend} />
                    </h4>
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold">{formatNumber(forecast.conversions.expected)}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        actions
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rate: {(forecast.conversions.expected / forecast.clicks.expected * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  {/* ROI */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <h4 className="text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        ROI
                      </span>
                      <TrendIndicator trend={forecast.roi.percentage.trend} />
                    </h4>
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold text-green-600">
                        {forecast.roi.percentage.expected}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        return
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Value: ${formatNumber(forecast.roi.value.expected)}
                    </p>
                  </div>
                </div>
                
                {/* Timeline */}
                <div className="pt-2">
                  <h4 className="text-xs font-medium mb-2 flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    Campaign Timeline
                  </h4>
                  <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                    {/* Timeline phases */}
                    <div className="absolute inset-0 flex">
                      {/* First results */}
                      <div 
                        className="border-r border-dashed border-muted-foreground/30 h-full flex items-center justify-center"
                        style={{ width: `${(forecast.timeToResults.firstResults / forecast.timeToResults.longevity) * 100}%` }}
                      >
                        <span className="text-[9px] text-muted-foreground px-1">First Results</span>
                      </div>
                      
                      {/* Growth phase */}
                      <div 
                        className="border-r border-dashed border-muted-foreground/30 h-full flex items-center justify-center"
                        style={{ width: `${((forecast.timeToResults.peakPerformance - forecast.timeToResults.firstResults) / forecast.timeToResults.longevity) * 100}%` }}
                      >
                        <span className="text-[9px] text-muted-foreground px-1">Growth</span>
                      </div>
                      
                      {/* Peak phase */}
                      <div 
                        className="border-r border-dashed border-muted-foreground/30 h-full flex items-center justify-center"
                        style={{ width: `${((forecast.timeToResults.longevity - forecast.timeToResults.peakPerformance) / forecast.timeToResults.longevity) * 100}%` }}
                      >
                        <span className="text-[9px] text-muted-foreground px-1">Sustained Impact</span>
                      </div>
                    </div>
                    
                    {/* Performance curve */}
                    <div 
                      className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-green-500 to-amber-500 rounded-bl-lg" 
                      style={{ width: "100%" }} 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground">
                    <span>Day 0</span>
                    <span>Day {Math.round(forecast.timeToResults.longevity / 2)}</span>
                    <span>Day {forecast.timeToResults.longevity}</span>
                  </div>
                </div>
                
                {/* Risk alert */}
                {forecast.riskFactors.some(r => r.severity === "high") && (
                  <div className="flex p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 mt-2 text-xs">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Risk detected: {forecast.riskFactors.find(r => r.severity === "high")?.name}</p>
                      <p className="text-amber-700 dark:text-amber-400 mt-0.5">{forecast.riskFactors.find(r => r.severity === "high")?.mitigation}</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs mt-2"
                  onClick={() => setActiveTab("details")}
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  View Details
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <span>No forecast available</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            {forecast && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Performance Details</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Total Impressions
                      </span>
                      <span className="font-medium">
                        {formatNumber(forecast.reach.expected)}
                        <span className="text-muted-foreground ml-1">
                          ({formatNumber(forecast.reach.lower)} - {formatNumber(forecast.reach.upper)})
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center">
                        <BarChart className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        Total Engagement
                      </span>
                      <span className="font-medium">
                        {formatNumber(forecast.engagement.expected)}
                        <span className="text-muted-foreground ml-1">
                          ({formatNumber(forecast.engagement.lower)} - {formatNumber(forecast.engagement.upper)})
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center">
                        <Award className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                        Click-Through Rate
                      </span>
                      <span className="font-medium">
                        {(forecast.clicks.expected / forecast.engagement.expected * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Conversion Rate
                      </span>
                      <span className="font-medium">
                        {(forecast.conversions.expected / forecast.clicks.expected * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Return on Investment
                      </span>
                      <span className="font-medium text-green-600">
                        {forecast.roi.percentage.expected}%
                        <span className="text-muted-foreground ml-1">
                          ({forecast.roi.percentage.lower}% - {forecast.roi.percentage.upper}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 space-y-3">
                  <h3 className="text-sm font-medium">Risk Analysis</h3>
                  
                  <div className="space-y-2">
                    {forecast.riskFactors.map((risk) => (
                      <div key={risk.id} className="p-2 bg-muted/30 rounded-md text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{risk.name}</span>
                          <Badge 
                            variant={risk.severity === "high" ? "destructive" : 
                              risk.severity === "medium" ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {risk.severity} risk
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px] mb-1">{risk.impact}</p>
                        <p className="text-[11px] flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs mt-2"
                  onClick={() => setActiveTab("optimize")}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  View Optimization Tips
                </Button>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="optimize" className="space-y-4">
            {forecast && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                    AI Optimization Tips
                  </h3>
                  
                  <div className="space-y-2">
                    {forecast.optimizationTips.map((tip) => (
                      <div key={tip.id} className="p-2 bg-muted/30 rounded-md text-xs relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium">{tip.tip}</p>
                            <Badge 
                              variant={tip.impact === "large" ? "default" : 
                                tip.impact === "medium" ? "secondary" : "outline"}
                              className="text-[10px] ml-1 flex-shrink-0"
                            >
                              {tip.impact} impact
                            </Badge>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              {tip.difficulty} to implement
                            </span>
                          </div>
                        </div>
                        {/* Background decoration based on impact */}
                        <div 
                          className={`absolute bottom-0 left-0 h-1 ${
                            tip.impact === "large" ? "bg-primary" : 
                            tip.impact === "medium" ? "bg-blue-500" : "bg-slate-400"
                          }`} 
                          style={{ width: `${tip.impact === "large" ? 100 : tip.impact === "medium" ? 60 : 30}%` }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 space-y-3">
                  <h3 className="text-sm font-medium">Forecast Parameters</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="avg-followers" className="text-xs">Avg. Followers</Label>
                      <Select 
                        value={forecastParams.averageFollowers.toString()}
                        onValueChange={(val) => setForecastParams({
                          ...forecastParams,
                          averageFollowers: parseInt(val)
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5000">5K</SelectItem>
                          <SelectItem value="10000">10K</SelectItem>
                          <SelectItem value="25000">25K</SelectItem>
                          <SelectItem value="50000">50K</SelectItem>
                          <SelectItem value="100000">100K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="avg-engagement" className="text-xs">Engagement Rate</Label>
                      <Select 
                        value={forecastParams.averageEngagement.toString()}
                        onValueChange={(val) => setForecastParams({
                          ...forecastParams,
                          averageEngagement: parseFloat(val)
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2%</SelectItem>
                          <SelectItem value="3">3%</SelectItem>
                          <SelectItem value="4">4%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="6">6%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="influencer-count" className="text-xs">Number of Influencers</Label>
                      <Select 
                        value={forecastParams.influencerCount.toString()}
                        onValueChange={(val) => setForecastParams({
                          ...forecastParams,
                          influencerCount: parseInt(val)
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="campaign-duration" className="text-xs">Campaign Duration</Label>
                      <Select 
                        value={forecastParams.campaignDuration.toString()}
                        onValueChange={(val) => setForecastParams({
                          ...forecastParams,
                          campaignDuration: parseInt(val)
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="21">21 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full mt-2 text-xs"
                    size="sm"
                    onClick={generateForecast}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Recalculate Forecast
                      </>
                    )}
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs mt-2"
                  onClick={() => setActiveTab("overview")}
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  Return to Overview
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <Zap className="h-3 w-3 mr-1 text-primary" />
          <span>AI-powered campaign forecasting</span>
        </div>
        <div>
          {new Date().toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}