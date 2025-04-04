import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMascot } from "@/hooks/use-mascot";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { X, ArrowRight, Sparkles, Info, Rocket, TrendingUp, Target, Zap, CheckCircle } from "lucide-react";

interface Tip {
  id: string;
  content: string;
  emoji?: string;
  cta?: {
    text: string;
    action: () => void;
  };
  icon: React.ReactNode;
  expression?: "neutral" | "happy" | "thinking" | "excited";
}

interface MascotProps {
  userType?: "business" | "influencer";
  className?: string;
}

/**
 * Platform mascot component that provides contextual tips
 * The mascot adapts to the user type and current page
 */
export function PlatformMascot({ 
  userType: propUserType, 
  className = "" 
}: MascotProps) {
  const [, setLocation] = useLocation();
  const [currentPath] = useLocation();
  const { user } = useAuth();
  const { 
    visible, 
    position, 
    seenTips, 
    markTipAsSeen, 
    hideMascot,
    preferences 
  } = useMascot();
  
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentExpression, setCurrentExpression] = useState<"neutral" | "happy" | "thinking" | "excited">("neutral");

  // Use prop userType if provided, otherwise use the authenticated user type
  const userType = propUserType || user?.userType;

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4"
  };

  // List of tips based on user type and current path
  const getTips = (): Tip[] => {
    // Common tips for all users
    const commonTips: Tip[] = [
      {
        id: "welcome",
        content: "Welcome to SOMIE! I'm here to help you navigate our platform. Need any assistance?",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
        expression: "happy"
      }
    ];

    // Tips specific to businesses
    const businessTips: Tip[] = [
      {
        id: "create-offer-tip",
        content: "Ready to start collaborating with influencers? Create your first offer to get matched!",
        icon: <Rocket className="h-5 w-5 text-primary" />,
        expression: "excited",
        cta: {
          text: "Create Offer",
          action: () => setLocation("/business-dashboard")
        }
      },
      {
        id: "metrics-optimizer-tip",
        content: "Use our Metrics Optimizer to find the perfect balance of followers and engagement for your campaign.",
        icon: <TrendingUp className="h-5 w-5 text-primary" />,
        expression: "thinking"
      },
      {
        id: "business-dashboard-tip",
        content: "Keep track of all your offers and influencer collaborations from your dashboard.",
        icon: <Info className="h-5 w-5 text-primary" />,
        expression: "neutral"
      }
    ];

    // Tips specific to influencers
    const influencerTips: Tip[] = [
      {
        id: "browse-offers-tip",
        content: "Check out the latest brand collaboration opportunities in your niche!",
        icon: <Target className="h-5 w-5 text-primary" />,
        expression: "excited",
        cta: {
          text: "Browse Offers",
          action: () => setLocation("/influencer-dashboard")
        }
      },
      {
        id: "profile-completion-tip",
        content: "Complete your profile to improve your match quality with brands.",
        icon: <Info className="h-5 w-5 text-primary" />,
        expression: "thinking"
      },
      {
        id: "engagement-tip",
        content: "Higher engagement rates can lead to better brand matches and higher rewards.",
        icon: <TrendingUp className="h-5 w-5 text-primary" />,
        expression: "happy"
      }
    ];

    // Page-specific tips
    const pageSpecificTips: { [key: string]: Tip[] } = {
      "/business-dashboard": [
        {
          id: "business-dashboard-welcome",
          content: "Welcome to your dashboard! Here you can create offers, manage collaborations, and track performance.",
          icon: <Sparkles className="h-5 w-5 text-primary" />,
          expression: "happy"
        },
        {
          id: "business-metrics-tip",
          content: "Track the performance of your campaigns in real-time with our analytics dashboard.",
          icon: <TrendingUp className="h-5 w-5 text-primary" />,
          expression: "thinking"
        }
      ],
      "/influencer-dashboard": [
        {
          id: "influencer-dashboard-welcome",
          content: "Welcome to your dashboard! Browse available offers and manage your ongoing collaborations.",
          icon: <Sparkles className="h-5 w-5 text-primary" />,
          expression: "happy"
        },
        {
          id: "claim-offers-tip",
          content: "Click on any offer card to view details and claim it if you're interested!",
          icon: <CheckCircle className="h-5 w-5 text-primary" />,
          expression: "excited"
        }
      ],
      "/marketplace": [
        {
          id: "marketplace-tip",
          content: "Use filters to find the perfect matches based on niche, location, or engagement rate.",
          icon: <Info className="h-5 w-5 text-primary" />,
          expression: "thinking"
        }
      ],
      "/why-somie": [
        {
          id: "why-somie-tip",
          content: "Our platform is built on data-driven matching to ensure authentic connections between brands and creators.",
          icon: <Zap className="h-5 w-5 text-primary" />,
          expression: "excited"
        }
      ],
      "/offer-detail": [
        {
          id: "offer-details-tip",
          content: "Review all requirements carefully before claiming an offer to ensure it aligns with your content style.",
          icon: <Info className="h-5 w-5 text-primary" />,
          expression: "thinking"
        }
      ],
      "/deal-detail": [
        {
          id: "deal-communication-tip",
          content: "Clear communication is key to successful collaborations. Use the messaging feature to stay in touch.",
          icon: <Info className="h-5 w-5 text-primary" />,
          expression: "neutral"
        }
      ]
    };

    // Combine common tips with user-specific and page-specific tips
    let allTips = [...commonTips];
    
    if (userType === "business") {
      allTips = [...allTips, ...businessTips];
    } else if (userType === "influencer") {
      allTips = [...allTips, ...influencerTips];
    }
    
    // Add page-specific tips if available
    if (pageSpecificTips[currentPath]) {
      allTips = [...allTips, ...pageSpecificTips[currentPath]];
    }
    
    // Filter out tips that have already been seen
    return allTips.filter(tip => !seenTips.includes(tip.id));
  };

  const tips = getTips();
  const currentTip = tips[currentTipIndex];

  // Update expression when tip changes
  useEffect(() => {
    if (currentTip?.expression) {
      setCurrentExpression(currentTip.expression);
    } else {
      setCurrentExpression("neutral");
    }
  }, [currentTipIndex, currentTip]);

  const handleNextTip = () => {
    if (currentTip) {
      // Mark current tip as seen
      markTipAsSeen(currentTip.id);
    }
    
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      // No more tips, close mascot
      hideMascot();
    }
  };

  const handleDismiss = () => {
    hideMascot();
    
    // If there's a current tip, mark it as seen
    if (currentTip) {
      markTipAsSeen(currentTip.id);
    }
  };

  // Don't show mascot if:
  // 1. Tips are turned off
  // 2. No tips available 
  // 3. No current tip
  // 4. User is not authenticated (on landing page or auth pages)
  // 5. Current path is a public route (landing, auth, etc.)
  const publicRoutes = ["/", "/auth-page", "/test-register", "/why-somie", "/marketplace"];
  const isPublicRoute = publicRoutes.includes(currentPath);
  
  if (
    preferences.frequency === "none" || 
    tips.length === 0 || 
    !currentTip || 
    !user || 
    isPublicRoute
  ) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <AnimatePresence>
        {visible && (
          <div className="flex items-end">
            {/* Mascot Character */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="mr-2 relative"
            >
              <MascotAvatar 
                size="md" 
                expression={currentExpression}
                className="shadow-lg"
              />
            </motion.div>
            
            {/* Tip Bubble */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-4 max-w-xs relative"
            >
              <button 
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start mb-2">
                {currentTip.icon}
                <div className="ml-2 font-medium text-sm">
                  {currentTip.emoji && <span className="mr-2">{currentTip.emoji}</span>}
                  SOMIE Assistant
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{currentTip.content}</p>
              
              <div className="flex justify-between items-center">
                {currentTip.cta ? (
                  <Button 
                    size="sm" 
                    onClick={currentTip.cta.action}
                    className="text-xs py-1 h-8"
                  >
                    {currentTip.cta.text}
                  </Button>
                ) : (
                  <div></div> // Placeholder for flex layout
                )}
                
                {tips.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleNextTip}
                    className="text-xs py-1 h-8"
                  >
                    Next Tip <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Tip counter */}
              {tips.length > 1 && (
                <div className="absolute bottom-1 left-0 w-full flex justify-center">
                  <div className="flex space-x-1">
                    {tips.slice(0, 5).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full ${i === currentTipIndex ? 'bg-primary' : 'bg-gray-300'}`}
                      />
                    ))}
                    {tips.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}