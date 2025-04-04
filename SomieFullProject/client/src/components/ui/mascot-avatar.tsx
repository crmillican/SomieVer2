import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MascotAvatarProps {
  size?: "sm" | "md" | "lg";
  expression?: "neutral" | "happy" | "thinking" | "excited";
  className?: string;
  onClick?: () => void;
}

/**
 * A component for displaying the platform mascot avatar
 * with different expressions and sizes
 */
export function MascotAvatar({
  size = "md",
  expression = "neutral",
  className,
  onClick
}: MascotAvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  // SVG based on expression
  const renderMascot = () => {
    // Base colors
    const primaryColor = "var(--primary)";
    const lightColor = "white";
    
    // Common SVG content with expression variations
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Base circle */}
        <circle cx="50" cy="50" r="50" fill={primaryColor} />
        
        {/* Inner glow/highlight */}
        <circle cx="50" cy="50" r="45" fill={primaryColor} />
        <circle cx="35" cy="35" r="10" fill="rgba(255, 255, 255, 0.3)" />
        
        {/* Expression specific elements */}
        {expression === "neutral" && (
          <>
            {/* Eyes */}
            <circle cx="35" cy="40" r="5" fill={lightColor} />
            <circle cx="65" cy="40" r="5" fill={lightColor} />
            
            {/* Smile */}
            <path
              d="M35 60 Q50 70 65 60"
              stroke={lightColor}
              strokeWidth="3"
              fill="none"
            />
          </>
        )}
        
        {expression === "happy" && (
          <>
            {/* Happy eyes (curved lines) */}
            <path
              d="M30 40 Q35 35 40 40"
              stroke={lightColor}
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M60 40 Q65 35 70 40"
              stroke={lightColor}
              strokeWidth="3"
              fill="none"
            />
            
            {/* Big smile */}
            <path
              d="M30 55 Q50 75 70 55"
              stroke={lightColor}
              strokeWidth="3"
              fill="none"
            />
          </>
        )}
        
        {expression === "thinking" && (
          <>
            {/* Eyes */}
            <circle cx="35" cy="40" r="5" fill={lightColor} />
            <circle cx="65" cy="40" r="5" fill={lightColor} />
            
            {/* Thinking mouth */}
            <path
              d="M40 60 Q50 60 60 60"
              stroke={lightColor}
              strokeWidth="3"
              fill="none"
            />
            
            {/* Thinking bubble */}
            <circle cx="80" cy="25" r="8" fill={lightColor} />
          </>
        )}
        
        {expression === "excited" && (
          <>
            {/* Excited eyes (stars) */}
            <path
              d="M30 40 L40 40 L35 32 L30 40 Z"
              fill={lightColor}
            />
            <path
              d="M60 40 L70 40 L65 32 L60 40 Z"
              fill={lightColor}
            />
            
            {/* Open mouth */}
            <circle cx="50" cy="65" r="10" fill={lightColor} />
            
            {/* Excitement lines */}
            <path
              d="M15 30 L25 35"
              stroke={lightColor}
              strokeWidth="2"
            />
            <path
              d="M85 30 L75 35"
              stroke={lightColor}
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    );
  };

  // Add subtle animation effects
  return (
    <motion.div
      className={cn(
        "rounded-full overflow-hidden shadow-md cursor-pointer",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {renderMascot()}
    </motion.div>
  );
}