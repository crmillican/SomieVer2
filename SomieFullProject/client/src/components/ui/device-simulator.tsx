import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw
} from "lucide-react";

interface DeviceSimulatorProps {
  children: React.ReactNode;
  className?: string;
}

export type DeviceType = "iphone" | "ipad" | "desktop";
export type OrientationType = "portrait" | "landscape";

export function DeviceSimulator({ children, className }: DeviceSimulatorProps) {
  const [active, setActive] = useState(false);
  const [device, setDevice] = useState<DeviceType>("iphone");
  const [orientation, setOrientation] = useState<OrientationType>("portrait");
  const [zoom, setZoom] = useState(1);
  
  // Restore previous settings from localStorage
  useEffect(() => {
    const savedActive = localStorage.getItem("device-simulator-active");
    const savedDevice = localStorage.getItem("device-simulator-device") as DeviceType | null;
    const savedOrientation = localStorage.getItem("device-simulator-orientation") as OrientationType | null;
    const savedZoom = localStorage.getItem("device-simulator-zoom");
    
    if (savedActive) setActive(savedActive === "true");
    if (savedDevice) setDevice(savedDevice);
    if (savedOrientation) setOrientation(savedOrientation);
    if (savedZoom) setZoom(Number(savedZoom));
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("device-simulator-active", String(active));
    localStorage.setItem("device-simulator-device", device);
    localStorage.setItem("device-simulator-orientation", orientation);
    localStorage.setItem("device-simulator-zoom", String(zoom));
  }, [active, device, orientation, zoom]);
  
  if (!active) {
    return (
      <div className={cn(className)}>
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActive(true)}
            className="bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            <span>Mobile Preview</span>
          </Button>
        </div>
        {children}
      </div>
    );
  }
  
  const toggleOrientation = () => {
    setOrientation(prev => prev === "portrait" ? "landscape" : "portrait");
  };
  
  const increaseZoom = () => {
    setZoom(prev => Math.min(prev + 0.1, 1.5));
  };
  
  const decreaseZoom = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const resetZoom = () => {
    setZoom(1);
  };
  
  // Device dimensions
  const deviceDimensions = {
    iphone: {
      portrait: { width: 375, height: 812 },
      landscape: { width: 812, height: 375 },
    },
    ipad: {
      portrait: { width: 768, height: 1024 },
      landscape: { width: 1024, height: 768 },
    },
    desktop: {
      portrait: { width: "100%", height: "100%" },
      landscape: { width: "100%", height: "100%" },
    },
  };
  
  const currentDimensions = deviceDimensions[device][orientation];
  
  // Device frame appearance
  const deviceFrame = {
    iphone: {
      className: "rounded-[3rem] border-[14px] border-black relative shadow-xl",
      notch: (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-xl z-20"></div>
      ),
    },
    ipad: {
      className: "rounded-[2rem] border-[12px] border-black relative shadow-xl",
      notch: null,
    },
    desktop: {
      className: "",
      notch: null,
    },
  };
  
  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4", className)}>
      <div className="flex items-center justify-center mb-4 space-x-2">
        <Button 
          variant={device === "iphone" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setDevice("iphone")}
        >
          <Smartphone className="w-4 h-4 mr-2" />
          <span>iPhone</span>
        </Button>
        <Button 
          variant={device === "ipad" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setDevice("ipad")}
        >
          <Tablet className="w-4 h-4 mr-2" />
          <span>iPad</span>
        </Button>
        <Button 
          variant={device === "desktop" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setDevice("desktop")}
        >
          <Monitor className="w-4 h-4 mr-2" />
          <span>Desktop</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleOrientation}
          disabled={device === "desktop"}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          <span>Rotate</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={increaseZoom}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={decreaseZoom}
        >
          <Minimize2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetZoom}
        >
          <span>100%</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setActive(false)}
        >
          <X className="w-4 h-4 mr-2" />
          <span>Exit Preview</span>
        </Button>
      </div>
      
      <div 
        className={cn(
          "overflow-hidden transition-all transform-gpu",
          device !== "desktop" && deviceFrame[device].className,
          "bg-white"
        )}
        style={{
          width: typeof currentDimensions.width === "number" ? currentDimensions.width * zoom : currentDimensions.width,
          height: typeof currentDimensions.height === "number" ? currentDimensions.height * zoom : currentDimensions.height,
          transform: `scale(${zoom})`,
          transformOrigin: "center top",
        }}
      >
        {device !== "desktop" && deviceFrame[device].notch}
        <div 
          className="w-full h-full overflow-auto"
          style={{
            width: typeof currentDimensions.width === "number" ? currentDimensions.width : "100%",
            height: typeof currentDimensions.height === "number" ? currentDimensions.height : "100%",
          }}
        >
          {children}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          {device.charAt(0).toUpperCase() + device.slice(1)} {orientation} • 
          {typeof currentDimensions.width === "number" ? ` ${currentDimensions.width}x${currentDimensions.height}` : " Responsive"} • 
          Zoom: {Math.round(zoom * 100)}%
        </p>
      </div>
    </div>
  );
}