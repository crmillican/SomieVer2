import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Check, Loader2, RefreshCw } from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export interface SocialPlatform {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  handle: string;
  url: string;
  followers?: number;
  engagementRate?: number;
  isVerified: boolean;
  isPrimary: boolean;
}

interface SocialPlatformManagerProps {
  platforms: SocialPlatform[];
  onChange: (platforms: SocialPlatform[]) => void;
  onPrimaryChange?: (platform: SocialPlatform) => void;
  maxPlatforms?: number;
  className?: string;
}

export function SocialPlatformManager({
  platforms,
  onChange,
  onPrimaryChange,
  maxPlatforms = 3,
  className = ''
}: SocialPlatformManagerProps) {
  const [availablePlatforms, setAvailablePlatforms] = useState<('instagram' | 'tiktok' | 'youtube')[]>([]);
  const { toast } = useToast();
  const [verifyingPlatform, setVerifyingPlatform] = useState<string | null>(null);

  // Update available platforms when the current platforms change
  useEffect(() => {
    const allPlatforms: ('instagram' | 'tiktok' | 'youtube')[] = ['instagram', 'tiktok', 'youtube'];
    const usedPlatforms = platforms.map(p => p.platform);
    setAvailablePlatforms(allPlatforms.filter(p => !usedPlatforms.includes(p)));
  }, [platforms]);

  // Generate a unique ID for new platforms
  const generateId = () => `platform_${Date.now()}`;

  // Add a new platform
  const addPlatform = () => {
    if (platforms.length >= maxPlatforms) {
      toast({
        title: "Maximum platforms reached",
        description: `You can only add up to ${maxPlatforms} social media platforms.`,
        variant: "destructive",
      });
      return;
    }

    if (availablePlatforms.length === 0) {
      toast({
        title: "No more platforms available",
        description: "You've already added all supported platforms.",
        variant: "destructive",
      });
      return;
    }

    // Create a new platform with the first available platform type
    const newPlatform: SocialPlatform = {
      id: generateId(),
      platform: availablePlatforms[0],
      handle: '',
      url: '',
      isVerified: false,
      isPrimary: platforms.length === 0, // First platform is primary by default
    };

    onChange([...platforms, newPlatform]);
  };

  // Remove a platform
  const removePlatform = (id: string) => {
    const platformIndex = platforms.findIndex(p => p.id === id);
    if (platformIndex === -1) return;

    const newPlatforms = platforms.filter(p => p.id !== id);
    
    // If we removed the primary platform, set a new primary
    if (platforms[platformIndex].isPrimary && newPlatforms.length > 0) {
      newPlatforms[0].isPrimary = true;
      if (onPrimaryChange) {
        onPrimaryChange(newPlatforms[0]);
      }
    }

    onChange(newPlatforms);
  };

  // Update a platform's data
  const updatePlatform = (id: string, data: Partial<SocialPlatform>) => {
    const newPlatforms = platforms.map(p => 
      p.id === id ? { ...p, ...data } : p
    );
    onChange(newPlatforms);
  };

  // Set a platform as primary
  const setPrimaryPlatform = (id: string) => {
    const newPlatforms = platforms.map(p => ({
      ...p,
      isPrimary: p.id === id
    }));
    
    const primaryPlatform = newPlatforms.find(p => p.id === id);
    if (primaryPlatform && onPrimaryChange) {
      onPrimaryChange(primaryPlatform);
    }
    
    onChange(newPlatforms);
  };

  // Verify a platform's handle
  const verifyPlatform = async (id: string) => {
    const platform = platforms.find(p => p.id === id);
    if (!platform || !platform.handle) return;

    setVerifyingPlatform(id);

    try {
      // Format the handle for the API call
      const handle = platform.handle.startsWith('@') 
        ? platform.handle.substring(1) 
        : platform.handle;

      // Construct URL based on platform
      let profileUrl = '';
      switch (platform.platform) {
        case 'instagram':
          profileUrl = `https://instagram.com/${handle}`;
          break;
        case 'tiktok':
          profileUrl = `https://tiktok.com/@${handle}`;
          break;
        case 'youtube':
          profileUrl = `https://youtube.com/@${handle}`;
          break;
      }

      // Call the API to verify the platform
      const response = await fetch('/api/social-metrics/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify platform');
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        // Update the platform with the verified data
        updatePlatform(id, {
          url: profileUrl,
          followers: result.data.followers,
          engagementRate: result.data.engagementRate,
          isVerified: true,
        });

        toast({
          title: "Profile verified!",
          description: `Successfully verified your ${platform.platform} profile.`,
        });
      }
    } catch (error) {
      console.error('Error verifying platform:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Couldn't verify your social media profile",
        variant: "destructive",
      });
    } finally {
      setVerifyingPlatform(null);
    }
  };

  // Helper to get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <SiInstagram className="h-5 w-5 text-pink-500" />;
      case 'tiktok':
        return <SiTiktok className="h-5 w-5 text-black" />;
      case 'youtube':
        return <SiYoutube className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {platforms.map((platform) => (
        <Card key={platform.id} className={platform.isPrimary ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPlatformIcon(platform.platform)}
                <CardTitle className="text-base">
                  {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                </CardTitle>
                {platform.isPrimary && (
                  <Badge variant="secondary" className="ml-2">Primary</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!platform.isPrimary && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrimaryPlatform(platform.id)}
                    className="h-8 px-2"
                  >
                    Set as Primary
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlatform(platform.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availablePlatforms.length > 0 && !platform.isVerified && (
                <Select 
                  value={platform.platform}
                  onValueChange={(value) => 
                    updatePlatform(platform.id, { 
                      platform: value as 'instagram' | 'tiktok' | 'youtube',
                      isVerified: false,
                      handle: '', // Reset handle when platform changes
                      url: '',    // Reset URL when platform changes
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={platform.platform}>
                      {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                    </SelectItem>
                    {availablePlatforms.map(p => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="space-y-1">
                <Label>
                  {platform.platform} handle
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {getPlatformIcon(platform.platform)}
                  </div>
                  <Input
                    value={platform.handle}
                    onChange={(e) => updatePlatform(platform.id, { 
                      handle: e.target.value,
                      isVerified: false // Reset verification when handle changes
                    })}
                    className="pl-10 pr-20"
                    placeholder={`Enter ${platform.platform} handle (without @)`}
                    disabled={verifyingPlatform === platform.id}
                  />
                  {platform.isVerified && (
                    <div className="absolute right-20 top-1/2 -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Button
                      type="button"
                      size="sm"
                      variant={platform.isVerified ? "outline" : "default"}
                      className="h-7 w-7 p-0"
                      onClick={() => verifyPlatform(platform.id)}
                      disabled={verifyingPlatform === platform.id || !platform.handle}
                    >
                      {verifyingPlatform === platform.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : platform.isVerified ? (
                        <RefreshCw className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {platform.isVerified && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <div>
                    <span className="font-medium">Followers:</span> {platform.followers?.toLocaleString() || 0}
                  </div>
                  <div>
                    <span className="font-medium">Engagement:</span> {(platform.engagementRate || 0).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {platforms.length < maxPlatforms && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addPlatform}
          disabled={availablePlatforms.length === 0}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Platform
        </Button>
      )}
    </div>
  );
}