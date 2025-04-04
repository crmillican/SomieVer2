import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { NavigationBar } from '@/components/ui/navigation-bar';
import { SearchFilters } from '@/components/marketplace/search-filters';
import { ProfileCard } from '@/components/marketplace/profile-card';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Filter } from 'lucide-react';

// Mock data for demonstration
const mockBusinesses = Array(20).fill(null).map((_, i) => ({
  id: i + 1,
  businessName: `Business ${i + 1}`,
  logoUrl: null,
  industry: ['Fashion', 'Beauty', 'Health', 'Tech', 'Food'][Math.floor(Math.random() * 5)],
  location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'][Math.floor(Math.random() * 5)],
  description: 'A sample business description that highlights the unique value proposition and brand identity.',
  rating: Math.floor(Math.random() * 5) + 1,
  ratingCount: Math.floor(Math.random() * 100) + 1,
  rewardType: ['monetary', 'product', 'both'][Math.floor(Math.random() * 3)] as 'monetary' | 'product' | 'both',
  avgReward: Math.floor(Math.random() * 1000) + 100,
  tags: ['eco-friendly', 'sustainable', 'innovative', 'luxury', 'affordable'].filter(() => Math.random() > 0.5),
  verified: Math.random() > 0.3,
  matchScore: Math.floor(Math.random() * 100) + 1,
}));

const mockInfluencers = Array(20).fill(null).map((_, i) => ({
  id: i + 1,
  displayName: `Influencer ${i + 1}`,
  avatarUrl: null,
  platform: ['Instagram', 'TikTok', 'YouTube'][Math.floor(Math.random() * 3)],
  niche: ['Fashion', 'Beauty', 'Health', 'Tech', 'Food'][Math.floor(Math.random() * 5)],
  location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'][Math.floor(Math.random() * 5)],
  bio: 'A creative content creator passionate about sharing authentic experiences with my engaged audience.',
  followerCount: Math.floor(Math.random() * 100000) + 1000,
  engagementRate: Math.random() * 10 + 1,
  rating: Math.floor(Math.random() * 5) + 1,
  ratingCount: Math.floor(Math.random() * 50) + 1,
  credibilityScore: Math.floor(Math.random() * 100) + 1,
  tags: ['fashion', 'beauty', 'lifestyle', 'travel', 'fitness'].filter(() => Math.random() > 0.5),
  verified: Math.random() > 0.3,
  matchScore: Math.floor(Math.random() * 100) + 1,
}));

const availableCategories = ['All', 'Fashion', 'Beauty', 'Health', 'Tech', 'Food', 'Lifestyle', 'Travel', 'Fitness'];
const availableTags = [
  'eco-friendly', 'sustainable', 'innovative', 'luxury', 'affordable',
  'fashion', 'beauty', 'lifestyle', 'travel', 'fitness'
];

export default function Marketplace() {
  const { user } = useAuth();
  const userType = user?.userType || 'influencer';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Filters state
  const [filters, setFilters] = useState({
    query: '',
    category: [] as string[],
    location: '',
    minEngagementRate: 0,
    maxEngagementRate: 20,
    minFollowers: 0,
    maxFollowers: 1000000,
    rewardType: undefined as 'monetary' | 'product' | 'both' | undefined,
    sortBy: 'relevance' as 'relevance' | 'engagement' | 'followers' | 'rating',
    tags: [] as string[],
  });

  // Function to handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Get data based on user type
  const getData = () => {
    const data = userType === 'business' ? mockInfluencers : mockBusinesses;
    
    // Apply basic filtering
    let filtered = data.filter(item => {
      const matchesQuery = searchQuery === '' || 
        (userType === 'business' && 
          ((item as any).displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item as any).bio.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (userType === 'influencer' && 
          ((item as any).businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item as any).description.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return matchesQuery;
    });
    
    // Apply sorting
    filtered = sortResults(filtered, filters.sortBy, userType as 'business' | 'influencer');
    
    return filtered;
  };

  // Get paginated results
  const getPaginatedResults = () => {
    const allData = getData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allData.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    return Math.ceil(getData().length / itemsPerPage);
  };

  // Get recommended items (those with high match scores)
  const getRecommendedItems = () => {
    const allData = getData();
    return allData
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, itemsPerPage);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationBar />

      <main className="flex-1 container py-6 space-y-6">
        <div className="flex flex-col space-y-1.5">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            {userType === 'business' 
              ? 'Find and connect with influencers that match your brand' 
              : 'Discover business opportunities that align with your content'}
          </p>

          <Breadcrumb className="mt-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Marketplace</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          {/* Filters */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Filter className="mr-2 h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SearchFilters 
                  userType={userType as 'business' | 'influencer'}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  availableCategories={availableCategories}
                  availableTags={availableTags}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setFilters({
                    query: '',
                    category: [] as string[],
                    location: '',
                    minEngagementRate: 0,
                    maxEngagementRate: 20,
                    minFollowers: 0,
                    maxFollowers: 1000000,
                    rewardType: undefined as 'monetary' | 'product' | 'both' | undefined,
                    sortBy: 'relevance' as 'relevance' | 'engagement' | 'followers' | 'rating',
                    tags: [] as string[],
                  })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Search Results */}
          <div className="space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={`Search for ${userType === 'business' ? 'influencers' : 'businesses'}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.category.map(cat => (
                  <Badge key={cat} variant="outline" className="bg-primary/10">
                    {cat}
                    <button 
                      className="ml-1 hover:text-destructive" 
                      onClick={() => handleFilterChange('category', filters.category.filter(c => c !== cat))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="bg-secondary/10">
                    #{tag}
                    <button 
                      className="ml-1 hover:text-destructive" 
                      onClick={() => handleFilterChange('tags', filters.tags.filter(t => t !== tag))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Tabs defaultValue="recommended" value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'recommended')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
                <TabsTrigger value="all">All Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recommended" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {getRecommendedItems().map(item => (
                    <ProfileCard 
                      key={item.id}
                      userType={userType as 'business' | 'influencer'}
                      profile={item as any}
                      matchScore={item.matchScore}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="all" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {getPaginatedResults().map(item => (
                    <ProfileCard 
                      key={item.id}
                      userType={userType as 'business' | 'influencer'}
                      profile={item as any}
                      matchScore={item.matchScore}
                    />
                  ))}
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                      let pageNum;
                      const totalPages = getTotalPages();
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < getTotalPages()) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === getTotalPages() ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function sortResults(results: any[], sortBy: string, userType: 'business' | 'influencer') {
  switch (sortBy) {
    case 'engagement':
      return [...results].sort((a, b) => {
        if (userType === 'business') {
          return b.engagementRate - a.engagementRate;
        } else {
          return b.avgReward - a.avgReward;
        }
      });
    case 'followers':
      return [...results].sort((a, b) => {
        if (userType === 'business') {
          return b.followerCount - a.followerCount;
        } else {
          return b.ratingCount - a.ratingCount;
        }
      });
    case 'rating':
      return [...results].sort((a, b) => b.rating - a.rating);
    case 'relevance':
    default:
      return [...results].sort((a, b) => b.matchScore - a.matchScore);
  }
}