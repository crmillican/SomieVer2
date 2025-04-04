import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Rocket, 
  Award, 
  Zap, 
  BarChart3 
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Progress } from "@/components/ui/progress";
import { BusinessPersonalizationForm, InfluencerPersonalizationForm } from "./onboarding/personalization-forms";
import { BusinessSuccessCards, InfluencerSuccessCards } from "./onboarding/success-cards";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  icon?: React.ReactNode;
  customContent?: React.ReactNode;
  timeEstimate?: number; // in seconds
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "business" | "influencer";
}

export function OnboardingModal({ isOpen, onClose, userType }: OnboardingModalProps) {
  const { completeOnboarding, saveBusinessData, saveInfluencerData } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [businessData, setBusinessData] = useState({ industry: "", marketingGoal: "awareness" });
  const [influencerData, setInfluencerData] = useState({ primaryPlatform: "", contentNiche: "" });

  // Reduced steps with personalized content and value-based CTAs
  const businessSteps: OnboardingStep[] = [
    {
      title: "Welcome to SOMIE",
      description: "Connect with authentic creators who drive real results - no matter their follower count.",
      icon: <Logo size="lg" className="mx-auto mb-4" />,
      timeEstimate: 15
    },
    {
      title: "Let's Personalize Your Experience",
      description: "Tell us a bit about your business so we can find the perfect creators for your needs.",
      customContent: <BusinessPersonalizationForm onSubmit={(data) => {
        setBusinessData(data);
        saveBusinessData(data);
        setCurrentStep(currentStep + 1);
      }} />,
      timeEstimate: 30
    },
    {
      title: "Here's What You Can Achieve",
      description: "Based on your industry and goals, here's what you can expect with SOMIE creators:",
      customContent: <BusinessSuccessCards data={businessData} />,
      timeEstimate: 20
    },
    {
      title: "You're Ready to Get Started",
      description: "Your personalized dashboard is set up. Start connecting with creators who can drive real results for your business.",
      icon: <Rocket className="w-16 h-16 text-primary mx-auto mb-4" />,
      timeEstimate: 10
    },
  ];

  const influencerSteps: OnboardingStep[] = [
    {
      title: "Welcome to SOMIE",
      description: "Your authentic audience is valuable - no matter your follower count. Let's connect you with the right brands.",
      icon: <Logo size="lg" className="mx-auto mb-4" />,
      timeEstimate: 15
    },
    {
      title: "Tell Us About Your Content",
      description: "Help us match you with the perfect brands by sharing your content focus.",
      customContent: <InfluencerPersonalizationForm onSubmit={(data) => {
        setInfluencerData(data);
        saveInfluencerData(data);
        setCurrentStep(currentStep + 1);
      }} />,
      timeEstimate: 30
    },
    {
      title: "Your Opportunity Dashboard",
      description: "Based on your profile, here are the opportunities available to you right now:",
      customContent: <InfluencerSuccessCards data={influencerData} />,
      timeEstimate: 20
    },
    {
      title: "You're Ready to Shine",
      description: "Your personalized dashboard is set up and brands are waiting to discover you. Let's get started!",
      icon: <Award className="w-16 h-16 text-primary mx-auto mb-4" />,
      timeEstimate: 10
    },
  ];

  const steps = userType === "business" ? businessSteps : influencerSteps;
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  // Calculate remaining time for onboarding
  const getRemainingTime = () => {
    let remainingSeconds = 0;
    for (let i = currentStep; i < totalSteps; i++) {
      remainingSeconds += steps[i].timeEstimate || 20;
    }
    return remainingSeconds;
  };
  
  const remainingTime = getRemainingTime();
  const remainingMins = Math.ceil(remainingTime / 60);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      // Skip to step 3 if we're on step 1 and the form submit handler has already advanced us
      if (currentStep === 1 && 
         ((userType === "business" && businessData.industry) || 
          (userType === "influencer" && influencerData.primaryPlatform))) {
        // Don't advance again, the form submission already did
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      completeOnboarding();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    completeOnboarding();
    onClose();
  };

  const getFinalButtonText = () => {
    if (userType === "business") {
      return "Find My First Creator";
    } else {
      return "Explore Brand Opportunities";
    }
  };

  const currentStepData = steps[currentStep];
  const showStepForm = currentStep === 1; // Step 2 has the form that handles its own next button
  
  return (
    <Dialog open={isOpen && !skipped} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-center text-2xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {currentStepData.description}
          </DialogDescription>
          {!showStepForm && (
            <div className="flex items-center justify-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {remainingMins < 1 ? "Less than a minute" : `About ${remainingMins} minute${remainingMins > 1 ? 's' : ''}`} to complete
              </span>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {currentStepData.icon ? (
            <div className="mb-4">{currentStepData.icon}</div>
          ) : currentStepData.customContent ? (
            <div className="w-full">{currentStepData.customContent}</div>
          ) : currentStepData.image ? (
            <div className="relative w-full h-56 rounded-lg overflow-hidden mb-6">
              <img 
                src={currentStepData.image} 
                alt={currentStepData.title} 
                className="object-cover w-full h-full"
              />
            </div>
          ) : null}
        </div>

        <Progress value={progress} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {currentStep === totalSteps - 1 ? "Final step" : `Step ${currentStep + 1} of ${totalSteps}`}
          </span>
          
          {!showStepForm && currentStep < totalSteps - 1 && (
            <span>
              {steps[currentStep + 1].timeEstimate || 20} seconds for next step
            </span>
          )}
        </div>

        {!showStepForm && (
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleSkip}
              >
                Skip Tour
              </Button>
              
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleNext} 
              className={`flex-1 ${currentStep === totalSteps - 1 ? 'sm:px-8' : ''}`}
              size={currentStep === totalSteps - 1 ? "default" : "sm"}
            >
              {currentStep === totalSteps - 1 ? (
                getFinalButtonText()
              ) : (
                <>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        )}
        
        {currentStep === totalSteps - 1 && (
          <div className="text-xs text-center text-muted-foreground mt-2">
            {userType === "business" 
              ? "Brands typically receive their first matches within 24 hours"
              : "Creators receive an average of 3 offers in their first week"}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}