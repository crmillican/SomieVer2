import React from "react";
import { BusinessPersonalizationData, InfluencerPersonalizationData } from "./personalization-forms";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap, BarChart3, Target, Award } from "lucide-react";

interface BusinessSuccessCardsProps {
  data: BusinessPersonalizationData;
}

export function BusinessSuccessCards({ data }: BusinessSuccessCardsProps) {
  // Generate personalized metrics based on industry and goal
  const getMetrics = (industry: string, goal: string) => {
    // Base metrics
    let metrics = {
      potentialReach: "12,500+",
      averageEngagement: "5.8%",
      averageROI: "183%"
    };

    // Adjust metrics based on industry
    if (industry.includes("Fashion") || industry.includes("Beauty")) {
      metrics.averageEngagement = "6.7%";
      metrics.potentialReach = "18,000+";
    } else if (industry.includes("Tech") || industry.includes("Software")) {
      metrics.averageROI = "215%";
      metrics.potentialReach = "9,500+";
    } else if (industry.includes("Food") || industry.includes("Beverage")) {
      metrics.averageEngagement = "7.2%";
      metrics.potentialReach = "15,000+";
    }

    // Adjust metrics based on goal
    if (goal === "awareness") {
      metrics.potentialReach = (parseInt(metrics.potentialReach.replace(/,/g, '')) * 1.2).toLocaleString() + "+";
    } else if (goal === "engagement") {
      metrics.averageEngagement = (parseFloat(metrics.averageEngagement) * 1.15).toFixed(1) + "%";
    } else if (goal === "sales") {
      metrics.averageROI = (parseInt(metrics.averageROI) * 1.1).toFixed(0) + "%";
    }

    return metrics;
  };

  const metrics = getMetrics(data.industry || "Retail", data.marketingGoal);

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 p-4 rounded-lg border">
        <div className="flex items-start mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Your Potential Audience Reach</h3>
            <p className="text-2xl font-bold text-primary mt-1">{metrics.potentialReach}</p>
            <p className="text-xs text-muted-foreground mt-1">Influencers in your industry can help you reach this audience</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="bg-background">
            <Target className="h-3 w-3 mr-1" /> {data.industry || "Your industry"}
          </Badge>
          <Badge variant="outline" className="bg-background">
            <Zap className="h-3 w-3 mr-1" /> {data.marketingGoal === "awareness" ? "Brand Awareness" : 
                                              data.marketingGoal === "engagement" ? "Engagement" : "Sales"}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center mb-1">
            <BarChart3 className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium text-sm">Avg. Engagement</h3>
          </div>
          <p className="text-xl font-bold mt-1">{metrics.averageEngagement}</p>
          <p className="text-xs text-muted-foreground mt-1">vs. 1.2% industry average</p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center mb-1">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium text-sm">Avg. ROI</h3>
          </div>
          <p className="text-xl font-bold mt-1">{metrics.averageROI}</p>
          <p className="text-xs text-muted-foreground mt-1">for your industry</p>
        </div>
      </div>
    </div>
  );
}

interface InfluencerSuccessCardsProps {
  data: InfluencerPersonalizationData;
}

export function InfluencerSuccessCards({ data }: InfluencerSuccessCardsProps) {
  // Generate personalized metrics based on platform and niche
  const getMetrics = (platform: string, niche: string) => {
    // Base metrics
    let metrics = {
      activeOpportunities: "12",
      averageCompensation: "$150",
      matchAccuracy: "82%"
    };

    // Adjust metrics based on platform
    if (platform === "instagram") {
      metrics.activeOpportunities = "18";
      metrics.averageCompensation = "$175";
    } else if (platform === "tiktok") {
      metrics.activeOpportunities = "22";
      metrics.matchAccuracy = "87%";
    } else if (platform === "youtube") {
      metrics.averageCompensation = "$225";
      metrics.activeOpportunities = "15";
    }

    // Adjust metrics based on niche
    if (niche.includes("Beauty") || niche.includes("Fashion")) {
      metrics.activeOpportunities = (parseInt(metrics.activeOpportunities) + 5).toString();
    } else if (niche.includes("Tech") || niche.includes("Gadgets")) {
      metrics.averageCompensation = "$" + (parseInt(metrics.averageCompensation.replace("$", "")) + 50).toString();
    } else if (niche.includes("Food") || niche.includes("Cooking")) {
      metrics.matchAccuracy = (parseInt(metrics.matchAccuracy) + 3) + "%";
    }

    return metrics;
  };

  const metrics = getMetrics(data.primaryPlatform || "instagram", data.contentNiche || "Lifestyle");

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 p-4 rounded-lg border">
        <div className="flex items-start mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Available Brand Opportunities</h3>
            <p className="text-2xl font-bold text-primary mt-1">{metrics.activeOpportunities} active matches</p>
            <p className="text-xs text-muted-foreground mt-1">Brands looking for creators with your profile</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="bg-background">
            {data.primaryPlatform === "instagram" ? "Instagram" : 
             data.primaryPlatform === "tiktok" ? "TikTok" : 
             data.primaryPlatform === "youtube" ? "YouTube" : "Social Media"}
          </Badge>
          <Badge variant="outline" className="bg-background">
            {data.contentNiche || "Content Creator"}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center mb-1">
            <Award className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium text-sm">Match Accuracy</h3>
          </div>
          <p className="text-xl font-bold mt-1">{metrics.matchAccuracy}</p>
          <p className="text-xs text-muted-foreground mt-1">based on your profile</p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center mb-1">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium text-sm">Avg. Compensation</h3>
          </div>
          <p className="text-xl font-bold mt-1">{metrics.averageCompensation}</p>
          <p className="text-xs text-muted-foreground mt-1">per collaboration</p>
        </div>
      </div>
    </div>
  );
}