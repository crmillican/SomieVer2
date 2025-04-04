import React, { createContext, useState, useContext, useEffect } from 'react';
import { BusinessPersonalizationData, InfluencerPersonalizationData } from '@/components/onboarding/personalization-forms';

interface OnboardingContextType {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  businessData: BusinessPersonalizationData | null;
  influencerData: InfluencerPersonalizationData | null;
  saveBusinessData: (data: BusinessPersonalizationData) => void;
  saveInfluencerData: (data: InfluencerPersonalizationData) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = 'somie-onboarding-completed';
const BUSINESS_DATA_KEY = 'somie-business-data';
const INFLUENCER_DATA_KEY = 'somie-influencer-data';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [businessData, setBusinessData] = useState<BusinessPersonalizationData | null>(null);
  const [influencerData, setInfluencerData] = useState<InfluencerPersonalizationData | null>(null);

  // Check if the user has completed onboarding and load personalization data
  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true';
    setHasCompletedOnboarding(hasCompleted);
    
    // If user hasn't completed onboarding, show it
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
    
    // Load saved personalization data
    try {
      const savedBusinessData = localStorage.getItem(BUSINESS_DATA_KEY);
      if (savedBusinessData) {
        setBusinessData(JSON.parse(savedBusinessData));
      }
      
      const savedInfluencerData = localStorage.getItem(INFLUENCER_DATA_KEY);
      if (savedInfluencerData) {
        setInfluencerData(JSON.parse(savedInfluencerData));
      }
    } catch (error) {
      console.error("Error loading personalization data", error);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  };
  
  const saveBusinessData = (data: BusinessPersonalizationData) => {
    localStorage.setItem(BUSINESS_DATA_KEY, JSON.stringify(data));
    setBusinessData(data);
  };
  
  const saveInfluencerData = (data: InfluencerPersonalizationData) => {
    localStorage.setItem(INFLUENCER_DATA_KEY, JSON.stringify(data));
    setInfluencerData(data);
  };

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        setShowOnboarding,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
        businessData,
        influencerData,
        saveBusinessData,
        saveInfluencerData
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};