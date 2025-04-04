import React, { createContext, useState, useContext, useEffect } from "react";

type DeviceType = "iphone" | "ipad" | "desktop";
type OrientationType = "portrait" | "landscape";

interface DeviceSimulatorContextType {
  active: boolean;
  device: DeviceType;
  orientation: OrientationType;
  zoom: number;
  setActive: (active: boolean) => void;
  setDevice: (device: DeviceType) => void;
  setOrientation: (orientation: OrientationType) => void;
  setZoom: (zoom: number) => void;
  toggleOrientation: () => void;
  increaseZoom: () => void;
  decreaseZoom: () => void;
  resetZoom: () => void;
}

const DeviceSimulatorContext = createContext<DeviceSimulatorContextType | undefined>(undefined);

export function DeviceSimulatorProvider({ children }: { children: React.ReactNode }) {
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
  
  return (
    <DeviceSimulatorContext.Provider
      value={{
        active,
        device,
        orientation,
        zoom,
        setActive,
        setDevice,
        setOrientation,
        setZoom,
        toggleOrientation,
        increaseZoom,
        decreaseZoom,
        resetZoom,
      }}
    >
      {children}
    </DeviceSimulatorContext.Provider>
  );
}

export function useDeviceSimulator() {
  const context = useContext(DeviceSimulatorContext);
  
  if (context === undefined) {
    throw new Error("useDeviceSimulator must be used within a DeviceSimulatorProvider");
  }
  
  return context;
}