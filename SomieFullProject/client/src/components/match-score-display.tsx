import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Users, 
  MapPin, 
  Tag, 
  Image, 
  Heart, 
  Info 
} from "lucide-react";

interface MatchScoreDisplayProps {
  score: number;
  factors?: {
    metricsMatch: number;
    locationMatch: number;
    nicheMatch: number;
    contentTypeMatch: number;
    audienceMatch?: number;
    brandAlignmentScore?: number;
  };
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

export function MatchScoreDisplay({
  score,
  factors,
  size = "md",
  showDetails = true,
  className = "",
}: MatchScoreDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate the circle dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return {
          width: 60,
          height: 60,
          fontSize: 18,
          smallFontSize: 10,
          strokeWidth: 3,
        };
      case "lg":
        return {
          width: 120,
          height: 120,
          fontSize: 36,
          smallFontSize: 14,
          strokeWidth: 6,
        };
      case "md":
      default:
        return {
          width: 80,
          height: 80,
          fontSize: 24,
          smallFontSize: 12,
          strokeWidth: 4,
        };
    }
  };
  
  const { width, height, fontSize, smallFontSize, strokeWidth } = getDimensions();
  const radius = width / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const cx = width / 2;
  const cy = height / 2;
  
  // Color gradient based on score
  const getScoreColor = () => {
    if (score >= 90) return "#10b981"; // green-500
    if (score >= 75) return "#22c55e"; // green-600
    if (score >= 60) return "#eab308"; // yellow-500
    if (score >= 45) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };
  
  // Get score label text
  const getScoreLabel = () => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Great";
    if (score >= 60) return "Good";
    if (score >= 45) return "Fair";
    return "Poor";
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Circle progress with score */}
      <div 
        className="relative cursor-pointer"
        style={{ width, height }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          
          {/* Progress circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={getScoreColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-700 ease-out"
          />
          
          {/* Score text */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight="bold"
            fill="currentColor"
          >
            {score}
          </text>
          
          {/* Percentage symbol */}
          <text
            x={cx + fontSize / 2}
            y={cy - fontSize / 3}
            textAnchor="start"
            fontSize={smallFontSize}
            fill="currentColor"
            className="text-muted-foreground"
          >
            %
          </text>
        </svg>
        
        {/* Score label */}
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-2 text-xs font-medium"
          style={{ fontSize: smallFontSize }}
        >
          {getScoreLabel()}
        </div>
      </div>
      
      {/* Factor breakdown */}
      {showDetails && factors && isExpanded && (
        <div className="mt-2 w-full max-w-[200px] space-y-1.5 bg-muted/30 rounded-md p-2 text-xs">
          <h4 className="font-medium mb-2 text-center">Match Factors</h4>
          
          <div className="space-y-1">
            {/* Metrics Match */}
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center">
                    <Users className="h-3 w-3 mr-1.5 text-blue-500" />
                    <span>Metrics</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Followers and engagement rate match</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${factors.metricsMatch}%` }}
                  />
                </div>
                <span>{factors.metricsMatch}%</span>
              </div>
            </div>
            
            {/* Location Match */}
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5 text-red-500" />
                    <span>Location</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Geographic relevance to target audience</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${factors.locationMatch}%` }}
                  />
                </div>
                <span>{factors.locationMatch}%</span>
              </div>
            </div>
            
            {/* Niche Match */}
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center">
                    <Tag className="h-3 w-3 mr-1.5 text-green-500" />
                    <span>Niche</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Content category alignment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${factors.nicheMatch}%` }}
                  />
                </div>
                <span>{factors.nicheMatch}%</span>
              </div>
            </div>
            
            {/* Content Type Match */}
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center">
                    <Image className="h-3 w-3 mr-1.5 text-purple-500" />
                    <span>Content</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Content format and style compatibility</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${factors.contentTypeMatch}%` }}
                  />
                </div>
                <span>{factors.contentTypeMatch}%</span>
              </div>
            </div>
            
            {/* Audience Match */}
            {factors.audienceMatch !== undefined && (
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <Users className="h-3 w-3 mr-1.5 text-indigo-500" />
                      <span>Audience</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Audience demographic alignment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${factors.audienceMatch}%` }}
                    />
                  </div>
                  <span>{factors.audienceMatch}%</span>
                </div>
              </div>
            )}
            
            {/* Brand Alignment */}
            {factors.brandAlignmentScore !== undefined && (
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <Heart className="h-3 w-3 mr-1.5 text-pink-500" />
                      <span>Brand</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Brand values and aesthetic alignment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 rounded-full"
                      style={{ width: `${factors.brandAlignmentScore}%` }}
                    />
                  </div>
                  <span>{factors.brandAlignmentScore}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}