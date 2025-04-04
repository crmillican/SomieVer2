import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialHandleInputProps {
  platform: 'instagram' | 'tiktok' | 'youtube';
  onMetricsFound: (metrics: any) => void;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SocialHandleInput({ 
  platform, 
  onMetricsFound, 
  className = '', 
  value = '',
  onChange
}: SocialHandleInputProps) {
  const [handle, setHandle] = useState(value);
  const [debouncedHandle, setDebouncedHandle] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();
  
  // Helper to convert handle to URL
  const handleToUrl = (handle: string): string => {
    // Clean handle (remove @ if present)
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
    
    // If it's already a URL, return it as is
    if (cleanHandle.startsWith('http')) {
      return cleanHandle;
    }
    
    // Otherwise, construct URL based on platform
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanHandle}`;
      case 'youtube':
        return `https://youtube.com/@${cleanHandle}`;
      default:
        return cleanHandle;
    }
  };
  
  // Define fetchMetrics before using it in useEffect
  const fetchMetrics = useCallback(async () => {
    // Guard against redundant fetches
    if (isLoading) {
      console.log('Already fetching metrics, skipping duplicate request');
      return;
    }
    
    const currentHandle = debouncedHandle || handle;
    
    if (!currentHandle.trim()) {
      console.log('Empty handle, skipping fetch');
      return; // Don't show error for auto-fetch
    }

    // Check if it's already verified with the current handle
    if (isVerified && currentHandle === handle) {
      console.log('Handle already verified, skipping fetch');
      return;
    }

    // Start loading state
    setIsLoading(true);
    
    try {
      // Convert handle to URL
      const socialUrl = handleToUrl(currentHandle);
      
      console.log(`Fetching metrics for ${platform} URL: ${socialUrl}`);
      
      // Use the URL endpoint to fetch metrics
      const response = await fetch('/api/social-metrics/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl: socialUrl }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch metrics');
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        console.log('Social metrics found:', result.data);
        
        // Add URL to the metrics
        const metricsWithUrl = {
          ...result.data,
          socialUrl: socialUrl,
          socialHandle: result.data.username || currentHandle 
        };
        
        onMetricsFound(metricsWithUrl);
        setIsVerified(true);
        
        toast({
          title: "Profile found!",
          description: `We found your ${platform} profile and imported your metrics.`,
        });
      }
    } catch (error) {
      console.error('Error fetching social metrics:', error);
      
      toast({
        title: "Error finding profile",
        description: error instanceof Error ? error.message : "Couldn't verify your social media profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedHandle, handle, platform, onMetricsFound, toast]);
  
  // Debounce handle changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHandle(handle);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [handle]);
  
  // Auto-fetch metrics when debounced handle changes with proper throttling
  useEffect(() => {
    let isCancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Helper function to run inside the effect - avoids hooks in conditionals
    const processHandle = () => {
      if (debouncedHandle && debouncedHandle.length >= 3 && !isVerified) {
        console.log(`Auto-fetching metrics for ${platform} handle: ${debouncedHandle}`);
        
        // Add a small delay to prevent rapid consecutive requests
        timeoutId = setTimeout(async () => {
          if (isCancelled) return;
          
          try {
            await fetchMetrics();
          } catch (error) {
            console.error('Error in auto-fetch effect:', error);
          }
        }, 300); // Small delay before triggering
      }
    };
    
    // Always call the function, but it contains the conditional logic
    processHandle();
    
    // Always return a cleanup function (no conditional returns)
    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [debouncedHandle, platform, fetchMetrics, isVerified]);

  const getPlatformIcon = () => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHandle(newValue);
    onChange?.(newValue);
    setIsVerified(false); // Reset verification when handle changes
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {getPlatformIcon()}
        </div>
        <Input
          value={handle}
          onChange={handleChange}
          className="pl-10 pr-20"
          placeholder={`Enter your ${platform} handle (without @)`}
          disabled={isLoading}
        />
        {isVerified && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button
            type="button"
            size="sm"
            variant={isVerified ? "outline" : "default"}
            className="h-7 w-7 p-0"
            onClick={fetchMetrics}
            disabled={isLoading || !handle}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isVerified ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}