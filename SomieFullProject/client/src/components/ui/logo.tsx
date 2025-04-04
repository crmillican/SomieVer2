import React from "react";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withTagline?: boolean;
  iconOnly?: boolean;
  onClick?: () => void;
}

export function Logo({ size = "md", className, withTagline = false, iconOnly = false, onClick }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  return (
    <div 
      className={cn("flex flex-col items-start", onClick && "cursor-pointer", className)} 
      onClick={onClick}
    >
      <div className="logo-container">
        {!iconOnly && (
          <span className={cn("logo", sizeClasses[size])}>SOMIE</span>
        )}
        {iconOnly ? (
          <Flame className={cn("text-primary", iconSizes[size])} />
        ) : (
          <span className="logo-dot"></span>
        )}
      </div>
      {withTagline && (
        <span className="text-xs text-muted-foreground mt-1">
          Social Media Influence Exchange
        </span>
      )}
    </div>
  );
}

export function BrandWithSlogan() {
  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
      <div className="flex items-center gap-3">
        <Flame className="w-8 h-8 text-primary" />
        <div>
          <div className="logo text-4xl">SOMIE</div>
          <div className="text-sm font-medium text-muted-foreground -mt-1">
            Social Media Influence Exchange
          </div>
        </div>
      </div>
      
      <p className="text-lg text-foreground/90 max-w-md font-light leading-relaxed">
        Where authentic partnerships flourish between brands and creators in a 
        warm, inviting environment.
      </p>
    </div>
  );
}