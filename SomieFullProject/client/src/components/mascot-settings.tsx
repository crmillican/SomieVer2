import React from "react";
import { useMascot } from "@/hooks/use-mascot";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Settings, RefreshCw } from "lucide-react";

interface MascotSettingsProps {
  className?: string;
}

export function MascotSettings({ className = "" }: MascotSettingsProps) {
  const { 
    visible, 
    showMascot, 
    hideMascot, 
    position, 
    setPosition, 
    preferences, 
    updatePreferences,
    resetSeenTips
  } = useMascot();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-1 ${className}`}
        >
          <MascotAvatar size="sm" className="mr-1" />
          <span>Assistant</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">SOMIE Assistant Settings</h4>
            <MascotAvatar size="sm" expression={visible ? "happy" : "neutral"} />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="assistant-toggle" className="text-sm">Enable Assistant</Label>
              <Switch 
                id="assistant-toggle" 
                checked={preferences.frequency !== "none"}
                onCheckedChange={(checked) => 
                  updatePreferences({ 
                    frequency: checked ? "medium" : "none" 
                  })
                }
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm">Message Frequency</Label>
              <RadioGroup 
                value={preferences.frequency} 
                onValueChange={(val) => 
                  updatePreferences({ 
                    frequency: val as "high" | "medium" | "low" | "none" 
                  })
                }
                disabled={preferences.frequency === "none"}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="text-xs">Low</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-xs">Medium</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="text-xs">High</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Assistant Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={position === "bottom-right" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setPosition("bottom-right")}
                className="text-xs h-8"
                disabled={preferences.frequency === "none"}
              >
                Bottom Right
              </Button>
              <Button 
                variant={position === "bottom-left" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setPosition("bottom-left")}
                className="text-xs h-8"
                disabled={preferences.frequency === "none"}
              >
                Bottom Left
              </Button>
              <Button 
                variant={position === "top-right" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setPosition("top-right")}
                className="text-xs h-8"
                disabled={preferences.frequency === "none"}
              >
                Top Right
              </Button>
              <Button 
                variant={position === "top-left" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setPosition("top-left")}
                className="text-xs h-8"
                disabled={preferences.frequency === "none"}
              >
                Top Left
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-features-toggle" className="text-sm">Show Tips for New Features</Label>
              <Switch 
                id="new-features-toggle" 
                checked={preferences.showOnNewFeatures}
                onCheckedChange={(checked) => 
                  updatePreferences({ showOnNewFeatures: checked })
                }
                disabled={preferences.frequency === "none"}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="pages-toggle" className="text-sm">Show Tips on Page Changes</Label>
              <Switch 
                id="pages-toggle" 
                checked={preferences.showOnPages}
                onCheckedChange={(checked) => 
                  updatePreferences({ showOnPages: checked })
                }
                disabled={preferences.frequency === "none"}
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={resetSeenTips}
              disabled={preferences.frequency === "none"}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Tips
            </Button>
            
            <Button 
              size="sm" 
              className="text-xs"
              onClick={showMascot}
              disabled={preferences.frequency === "none"}
            >
              Show Assistant Now
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}