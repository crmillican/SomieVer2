import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";

interface MetricInfoProps {
  label: string;
  tooltip: string;
  value: string | number;
  onClick?: () => void;
}

export function MetricInfo({ label, tooltip, value, onClick }: MetricInfoProps) {
  return (
    <div 
      className={`flex justify-between items-center ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        <HoverCard>
          <HoverCardTrigger asChild>
            <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </HoverCardTrigger>
          <HoverCardContent className="w-60 p-2 text-xs">
            {tooltip}
          </HoverCardContent>
        </HoverCard>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}