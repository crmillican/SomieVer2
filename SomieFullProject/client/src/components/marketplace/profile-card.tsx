import React from 'react';
import { useLocation } from 'wouter';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Award, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Gift, 
  CheckCircle
} from 'lucide-react';

function MatchQualityBadge({ matchScore }: { matchScore: number }) {
  let label = '';
  let colorClass = '';
  
  if (matchScore >= 85) {
    label = 'Best Match';
    colorClass = 'bg-green-100 text-green-800 border-green-300';
  } else if (matchScore >= 70) {
    label = 'Great Match';
    colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (matchScore >= 50) {
    label = 'Good Match';
    colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
  } else {
    label = 'Potential Match';
    colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
  }
  
  return (
    <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${colorClass}`}>
      {matchScore >= 70 && <Award className="h-3 w-3 mr-1" />}
      {label}
    </div>
  );
}

interface ProfileCardProps {
  userType: 'business' | 'influencer';
  profile: BusinessCardProfile | InfluencerCardProfile;
  matchScore: number;
}

interface BusinessCardProfile {
  id: number;
  businessName: string;
  logoUrl?: string;
  industry: string;
  location: string;
  description: string;
  rating: number;
  ratingCount: number;
  rewardType: 'monetary' | 'product' | 'both';
  avgReward: number;  
  tags: string[];
  verified: boolean;
}

interface InfluencerCardProfile {
  id: number;
  displayName: string;
  avatarUrl?: string;
  platform: string;
  niche: string; 
  location: string;
  bio: string;
  followerCount: number;
  engagementRate: number;
  rating: number;
  ratingCount: number;
  credibilityScore: number;
  tags: string[];
  verified: boolean;
}

export function ProfileCard({ userType, profile, matchScore }: ProfileCardProps) {
  return userType === 'business' 
    ? <InfluencerProfileCard profile={profile as InfluencerCardProfile} matchScore={matchScore} />
    : <BusinessProfileCard profile={profile as BusinessCardProfile} matchScore={matchScore} />;
}

function BusinessProfileCard({ profile, matchScore }: { profile: BusinessCardProfile; matchScore: number }) {
  const [_, navigate] = useLocation();
  
  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2 relative">
        <div className="absolute top-2 right-2">
          <MatchQualityBadge matchScore={matchScore} />
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.logoUrl} alt={profile.businessName} />
            <AvatarFallback className="bg-primary/10">
              {profile.businessName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <CardTitle className="text-lg flex items-center">
              {profile.businessName}
              {profile.verified && <CheckCircle className="h-4 w-4 ml-1 text-primary" />}
            </CardTitle>
            <CardDescription className="flex items-center text-xs">
              <span className="mr-3">{profile.industry}</span>
              {profile.location && (
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profile.location}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 pt-1 flex-grow">
        <p className="text-sm mb-3 line-clamp-3">{profile.description}</p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 flex justify-center items-center">
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <span>{profile.rating.toFixed(1)} ({profile.ratingCount})</span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 flex justify-center items-center">
              {profile.rewardType === 'monetary' && <DollarSign className="h-4 w-4 text-green-500" />}
              {profile.rewardType === 'product' && <Package className="h-4 w-4 text-blue-500" />}
              {profile.rewardType === 'both' && <Gift className="h-4 w-4 text-purple-500" />}
            </div>
            <span>
              {profile.rewardType === 'monetary' && 'Cash Rewards'}
              {profile.rewardType === 'product' && 'Product Rewards'}
              {profile.rewardType === 'both' && 'Mixed Rewards'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-1">
          {profile.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {profile.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{profile.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click handlers
            navigate(`/auth-page?mode=register&type=influencer`);
          }}
        >
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}

function InfluencerProfileCard({ profile, matchScore }: { profile: InfluencerCardProfile; matchScore: number }) {
  const [_, navigate] = useLocation();
  
  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2 relative">
        <div className="absolute top-2 right-2">
          <MatchQualityBadge matchScore={matchScore} />
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback className="bg-primary/10">
              {profile.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <CardTitle className="text-lg flex items-center">
              {profile.displayName}
              {profile.verified && <CheckCircle className="h-4 w-4 ml-1 text-primary" />}
            </CardTitle>
            <CardDescription className="flex items-center text-xs">
              <span className="mr-3">{profile.platform} • {profile.niche}</span>
              {profile.location && (
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profile.location}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 pt-1 flex-grow">
        <p className="text-sm mb-3 line-clamp-3">{profile.bio}</p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 flex justify-center items-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <span>{formatNumber(profile.followerCount)} followers</span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 flex justify-center items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <span>{profile.engagementRate.toFixed(1)}% engagement</span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 flex justify-center items-center">
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <span>{profile.rating.toFixed(1)} ({profile.ratingCount})</span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 flex justify-center items-center">
              <Award className="h-4 w-4 text-purple-500" />
            </div>
            <span>{profile.credibilityScore} credibility</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-1">
          {profile.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {profile.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{profile.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click handlers
            navigate(`/auth-page?mode=register&type=business`);
          }}
        >
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}