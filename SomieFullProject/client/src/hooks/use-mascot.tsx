import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface MascotContextType {
  visible: boolean;
  showMascot: () => void;
  hideMascot: () => void;
  toggleMascot: () => void;
  seenTips: string[];
  markTipAsSeen: (tipId: string) => void;
  resetSeenTips: () => void;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  setPosition: (position: "bottom-right" | "bottom-left" | "top-right" | "top-left") => void;
  preferences: {
    frequency: "high" | "medium" | "low" | "none";
    showOnNewFeatures: boolean;
    showOnPages: boolean;
  };
  updatePreferences: (preferences: Partial<MascotContextType["preferences"]>) => void;
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

export function MascotProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [seenTips, setSeenTips] = useState<string[]>([]);
  const [position, setPosition] = useState<"bottom-right" | "bottom-left" | "top-right" | "top-left">("bottom-right");
  const [preferences, setPreferences] = useState({
    frequency: "medium" as "high" | "medium" | "low" | "none",
    showOnNewFeatures: true,
    showOnPages: true,
  });
  const [, location] = useLocation();
  const { user } = useAuth();

  // Reset visibility on page change
  useEffect(() => {
    setVisible(false);
    
    // Show mascot after a delay based on frequency preference
    if (preferences.frequency !== "none" && preferences.showOnPages) {
      const delayMap = {
        high: 2000,
        medium: 3500,
        low: 5000
      };
      
      const delay = delayMap[preferences.frequency];
      
      const timer = setTimeout(() => {
        setVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [location, preferences.frequency, preferences.showOnPages]);

  // Get user preferences from local storage on mount
  useEffect(() => {
    if (user) {
      const storedPrefs = localStorage.getItem(`mascot-prefs-${user.id}`);
      if (storedPrefs) {
        try {
          setPreferences(JSON.parse(storedPrefs));
        } catch (e) {
          console.error("Failed to parse mascot preferences from localStorage");
        }
      }
      
      const storedSeenTips = localStorage.getItem(`mascot-seen-tips-${user.id}`);
      if (storedSeenTips) {
        try {
          setSeenTips(JSON.parse(storedSeenTips));
        } catch (e) {
          console.error("Failed to parse seen tips from localStorage");
        }
      }
    }
  }, [user]);

  // Save preferences to local storage when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`mascot-prefs-${user.id}`, JSON.stringify(preferences));
    }
  }, [preferences, user]);

  // Save seen tips to local storage when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`mascot-seen-tips-${user.id}`, JSON.stringify(seenTips));
    }
  }, [seenTips, user]);

  const showMascot = () => setVisible(true);
  const hideMascot = () => setVisible(false);
  const toggleMascot = () => setVisible(prev => !prev);
  
  const markTipAsSeen = (tipId: string) => {
    setSeenTips(prev => {
      if (prev.includes(tipId)) return prev;
      return [...prev, tipId];
    });
  };
  
  const resetSeenTips = () => {
    setSeenTips([]);
  };
  
  const updatePreferences = (newPrefs: Partial<MascotContextType["preferences"]>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPrefs
    }));
  };

  const value = {
    visible,
    showMascot,
    hideMascot,
    toggleMascot,
    seenTips,
    markTipAsSeen,
    resetSeenTips,
    position,
    setPosition,
    preferences,
    updatePreferences
  };

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error("useMascot must be used within a MascotProvider");
  }
  return context;
}