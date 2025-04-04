import React from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  Search,
  DollarSign,
  Bell,
  User,
  Settings,
  Mail,
  Briefcase,
  PlusCircle
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  showOn: "mobile" | "desktop" | "all";
  userType?: "all" | "business" | "influencer";
}

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Get user type from the user object
  const userType = user?.userType || "influencer";
  
  const navItems: NavItem[] = [
    {
      label: "Home",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      showOn: "all",
      userType: "all"
    },
    {
      label: "Discover",
      path: "/marketplace",
      icon: <Search className="h-5 w-5" />,
      showOn: "all",
      userType: "all"
    },
    // Influencer-specific nav items
    {
      label: "Earnings",
      path: "/influencer/earnings",
      icon: <DollarSign className="h-5 w-5" />,
      showOn: "all",
      userType: "influencer"
    },
    {
      label: "My Deals",
      path: "/influencer/deals",
      icon: <Briefcase className="h-5 w-5" />,
      showOn: "all",
      userType: "influencer"
    },
    {
      label: "Messages",
      path: "/messages",
      icon: <Mail className="h-5 w-5" />,
      showOn: "all",
      userType: "influencer"
    },
    // Business-specific nav items
    {
      label: "My Offers",
      path: "/business/offers",
      icon: <Briefcase className="h-5 w-5" />,
      showOn: "all",
      userType: "business"
    },
    {
      label: "New Offer",
      path: "/business/create-offer",
      icon: <PlusCircle className="h-5 w-5" />,
      showOn: "all",
      userType: "business"
    },
    {
      label: "Campaigns",
      path: "/business/campaigns",
      icon: <DollarSign className="h-5 w-5" />,
      showOn: "all",
      userType: "business"
    },
    {
      label: "Messages",
      path: "/messages",
      icon: <Mail className="h-5 w-5" />,
      showOn: "all",
      userType: "business"
    },
    // Common items
    {
      label: "Notifications",
      path: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      showOn: "all",
      userType: "all"
    },
    {
      label: "Profile",
      path: `/${userType === "business" ? "business" : "influencer"}/profile`,
      icon: <User className="h-5 w-5" />,
      showOn: "all",
      userType: "all"
    }
  ];

  // Filter items by user type and device type
  const filteredNavItems = navItems.filter(item => {
    const matchesUserType = item.userType === "all" || item.userType === userType;
    const matchesDeviceType = item.showOn === "all" || 
                              (item.showOn === "mobile" && isMobile) || 
                              (item.showOn === "desktop" && !isMobile);
    return matchesUserType && matchesDeviceType;
  });

  // Limit to max 5 items for mobile
  const mobileNavItems = isMobile ? filteredNavItems.slice(0, 5) : filteredNavItems;

  if (!user) {
    return null;
  }

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {mobileNavItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full",
                  "text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <span className="mb-1">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}