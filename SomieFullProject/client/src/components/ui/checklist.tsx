import React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertCircle, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "pending" | "recommended";
  action?: () => void;
  actionLabel?: string;
}

interface ChecklistProps {
  title?: string;
  description?: string;
  items: ChecklistItem[];
  className?: string;
  showCompletedItems?: boolean;
  onItemClick?: (item: ChecklistItem) => void;
}

export function Checklist({
  title = "Setup Checklist",
  description = "Complete these steps to get the most out of your account",
  items,
  className,
  showCompletedItems = true,
  onItemClick,
}: ChecklistProps) {
  const pendingItems = items.filter((item) => item.status !== "completed");
  const completedItems = items.filter((item) => item.status === "completed");
  const progress = completedItems.length / items.length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant="outline">
            {completedItems.length}/{items.length} completed
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary rounded-full mt-2">
          <div
            className="h-2 bg-primary rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {/* Show pending items first */}
          {pendingItems.map((item) => (
            <ChecklistItemComponent 
              key={item.id} 
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
          
          {/* Show completed items if enabled */}
          {showCompletedItems && completedItems.length > 0 && (
            <>
              {completedItems.length > 0 && (
                <div className="text-xs text-muted-foreground mt-4 mb-2">
                  Completed
                </div>
              )}
              {completedItems.map((item) => (
                <ChecklistItemComponent 
                  key={item.id} 
                  item={item}
                  onClick={() => onItemClick?.(item)}
                />
              ))}
            </>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

interface ChecklistItemComponentProps {
  item: ChecklistItem;
  onClick?: () => void;
}

function ChecklistItemComponent({ item, onClick }: ChecklistItemComponentProps) {
  const isCompleted = item.status === "completed";
  const isRecommended = item.status === "recommended";
  
  return (
    <li 
      className={cn(
        "flex items-start p-3 rounded-md transition-colors",
        isCompleted 
          ? "bg-muted/40" 
          : "bg-card hover:bg-muted/50 cursor-pointer border",
      )}
      onClick={onClick}
    >
      <div className="mr-3 mt-0.5">
        {isCompleted ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Check className="h-4 w-4 text-primary-foreground" />
          </span>
        ) : isRecommended ? (
          <Circle className="h-6 w-6 text-muted-foreground" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "font-medium",
            isCompleted && "text-muted-foreground"
          )}>
            {item.title}
            {isRecommended && (
              <Badge className="ml-2" variant="outline">Recommended</Badge>
            )}
          </h4>
        </div>
        {item.description && (
          <p className={cn(
            "text-sm text-muted-foreground mt-1",
            isCompleted && "text-muted-foreground/70"
          )}>
            {item.description}
          </p>
        )}
        {item.action && item.actionLabel && !isCompleted && (
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2" 
            onClick={(e) => {
              e.stopPropagation();
              item.action?.();
            }}
          >
            {item.actionLabel}
          </Button>
        )}
      </div>
    </li>
  );
}