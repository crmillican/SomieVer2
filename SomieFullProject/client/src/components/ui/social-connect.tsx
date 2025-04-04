import { Button } from "./button";
import { Instagram, Youtube, AtSign, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { Badge } from "./badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface SocialConnectProps {
  platform?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  onConnect?: (platform: string, handle?: string) => void;
}

export function SocialConnectButton({ 
  platform = "instagram", 
  className = "",
  variant = "outline",
  size = "default",
  onConnect
}: SocialConnectProps) {
  const { toast } = useToast();
  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [handle, setHandle] = useState("");

  const handleInstagramConnect = () => {
    // For now, skip the actual OAuth flow for simplicity in demo
    // Instead, show a dialog to enter username directly
    setIsDialogOpen(true);
  };
  
  const handleSubmitSocialHandle = () => {
    if (!handle || handle.trim() === '') {
      toast({
        title: "Error",
        description: `Please enter a valid ${platform} handle`,
        variant: "destructive",
      });
      return;
    }
    
    // Clean the handle (remove @ if provided)
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
    
    toast({
      title: "Account Connected",
      description: `Your ${platform} account has been connected. Metrics will be updated shortly.`,
    });
    
    if (onConnect) {
      onConnect(platform, cleanHandle);
    }
    
    setIsDialogOpen(false);
    setHandle("");
  };
  
  const handleConnect = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
      case 'tiktok':
      case 'youtube':
        // Use the same dialog-based approach for all platforms
        setIsDialogOpen(true);
        break;
      default:
        setIsDialogOpen(true);
    }
  };

  // Determine icon based on platform
  const IconComponent = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <SiInstagram className="mr-2 h-4 w-4" />;
      case 'tiktok':
        return <SiTiktok className="mr-2 h-4 w-4" />;
      case 'youtube':
        return <SiYoutube className="mr-2 h-4 w-4" />;
      default:
        return <SiInstagram className="mr-2 h-4 w-4" />;
    }
  };

  // Platform-specific button label
  const buttonLabel = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'Connect Instagram';
      case 'tiktok':
        return 'Connect TikTok';
      case 'youtube':
        return 'Connect YouTube';
      default:
        return 'Connect Social Account';
    }
  };

  // Get platform specific hints/placeholder text
  const getPlaceholderText = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'e.g., natgeo (no @ needed)';
      case 'tiktok':
        return 'e.g., charlidamelio or @charlidamelio';
      case 'youtube':
        return 'e.g., mrbeast or @mrbeast';
      default:
        return 'Enter your username';
    }
  };

  return (
    <>
      <Button 
        onClick={() => handleConnect(platform)}
        className={className}
        variant={variant}
        size={size}
      >
        <IconComponent />
        {buttonLabel()}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent />
              {`Connect your ${platform} account`}
            </DialogTitle>
            <DialogDescription>
              Enter your {platform} handle below. We'll use this to fetch your metrics.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="handle" className="flex items-center gap-1">
                <AtSign className="h-4 w-4" />
                Username/Handle
              </Label>
              <Input
                id="handle"
                placeholder={getPlaceholderText()}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                We only need your public handle - no passwords or private information required.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitSocialHandle} className="gap-1">
              <UserCheck className="h-4 w-4" />
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SocialConnectPanel() {
  const { toast } = useToast();
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, string>>({});
  
  const handleConnect = (platform: string, handle?: string) => {
    if (handle) {
      // Store the connected account handle
      setConnectedAccounts(prev => ({
        ...prev,
        [platform]: handle
      }));
      
      toast({
        title: "Account Connected",
        description: `Your ${platform} account @${handle} has been linked successfully!`,
      });
    }
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Connect Your Socials</CardTitle>
        <CardDescription>
          Simply enter your social media handles - no complex authentication needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiInstagram className="h-5 w-5 text-pink-500" />
            <span className="font-medium">Instagram</span>
            {connectedAccounts.instagram && (
              <Badge variant="secondary" className="ml-1">
                @{connectedAccounts.instagram}
              </Badge>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SocialConnectButton 
                    platform="instagram" 
                    size="sm" 
                    onConnect={handleConnect}
                    variant={connectedAccounts.instagram ? "secondary" : "outline"}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{connectedAccounts.instagram ? 'Update' : 'Add'} your Instagram handle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiTiktok className="h-5 w-5 text-black" />
            <span className="font-medium">TikTok</span>
            {connectedAccounts.tiktok ? (
              <Badge variant="secondary" className="ml-1">
                @{connectedAccounts.tiktok}
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-xs bg-primary/10">Popular</Badge>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SocialConnectButton 
                    platform="tiktok" 
                    size="sm" 
                    onConnect={handleConnect}
                    variant={connectedAccounts.tiktok ? "secondary" : "outline"}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{connectedAccounts.tiktok ? 'Update' : 'Add'} your TikTok handle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiYoutube className="h-5 w-5 text-red-600" />
            <span className="font-medium">YouTube</span>
            {connectedAccounts.youtube && (
              <Badge variant="secondary" className="ml-1">
                @{connectedAccounts.youtube}
              </Badge>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SocialConnectButton 
                    platform="youtube" 
                    size="sm" 
                    onConnect={handleConnect}
                    variant={connectedAccounts.youtube ? "secondary" : "outline"}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{connectedAccounts.youtube ? 'Update' : 'Add'} your YouTube handle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}