import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { CheckIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  userType: 'business' | 'influencer';
  filters: {
    query: string;
    category: string[];
    location: string;
    minEngagementRate: number;
    maxEngagementRate: number;
    minFollowers: number;
    maxFollowers: number;
    rewardType?: 'monetary' | 'product' | 'both'; // for influencers searching businesses
    sortBy: 'relevance' | 'engagement' | 'followers' | 'rating';
    tags: string[];
  };
  onFilterChange: (key: string, value: any) => void;
  availableCategories: string[];
  availableTags: string[];
}

export function SearchFilters({ 
  userType, 
  filters, 
  onFilterChange,
  availableCategories,
  availableTags
}: SearchFiltersProps) {
  
  // Format follower count in a readable way
  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value}%`;
  };
  
  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['location', 'categories', 'engagement', 'followers', 'sort', 'tags']}>
        {/* Location Filter */}
        <AccordionItem value="location">
          <AccordionTrigger>Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Label htmlFor="location">Search by location</Label>
              <Input
                id="location"
                placeholder="City, state, or country..."
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Categories Filter */}
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {filters.category.length === 0 
                      ? "Select categories..." 
                      : `${filters.category.length} selected`}
                    <Plus className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found</CommandEmpty>
                      <CommandGroup>
                        {availableCategories.map((category) => {
                          const isSelected = filters.category.includes(category);
                          return (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={(currentValue) => {
                                const selected = filters.category.includes(currentValue);
                                const newCategories = selected
                                  ? filters.category.filter((s) => s !== currentValue)
                                  : [...filters.category, currentValue];
                                onFilterChange('category', newCategories);
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </div>
                              <span>{category}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {filters.category.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.category.map((cat) => (
                    <Badge 
                      key={cat} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {cat}
                      <button
                        className="h-3 w-3 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => onFilterChange('category', filters.category.filter(c => c !== cat))}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Engagement Rate Filter */}
        <AccordionItem value="engagement">
          <AccordionTrigger>Engagement Rate</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Min-Max Engagement</Label>
                  <span className="text-xs text-muted-foreground">
                    {formatPercentage(filters.minEngagementRate)} - {formatPercentage(filters.maxEngagementRate)}
                  </span>
                </div>
                <div className="pt-1">
                  <Slider
                    min={0}
                    max={20}
                    step={0.5}
                    defaultValue={[filters.minEngagementRate, filters.maxEngagementRate]}
                    value={[filters.minEngagementRate, filters.maxEngagementRate]}
                    onValueChange={(value) => {
                      onFilterChange('minEngagementRate', value[0]);
                      onFilterChange('maxEngagementRate', value[1]);
                    }}
                    className="my-4"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Followers Filter */}
        <AccordionItem value="followers">
          <AccordionTrigger>Followers</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Follower Range</Label>
                  <span className="text-xs text-muted-foreground">
                    {formatFollowerCount(filters.minFollowers)} - {formatFollowerCount(filters.maxFollowers)}
                  </span>
                </div>
                <div className="pt-1">
                  <Slider
                    min={0}
                    max={1000000}
                    step={1000}
                    defaultValue={[filters.minFollowers, filters.maxFollowers]}
                    value={[filters.minFollowers, filters.maxFollowers]}
                    onValueChange={(value) => {
                      onFilterChange('minFollowers', value[0]);
                      onFilterChange('maxFollowers', value[1]);
                    }}
                    className="my-4"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Reward Type Filter - Only for influencers searching businesses */}
        {userType === 'influencer' && (
          <AccordionItem value="rewardType">
            <AccordionTrigger>Reward Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Select
                  value={filters.rewardType}
                  onValueChange={(value) => onFilterChange('rewardType', value as 'monetary' | 'product' | 'both')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any reward type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Reward Types</SelectLabel>
                      <SelectItem value="monetary">Cash/Monetary</SelectItem>
                      <SelectItem value="product">Products/Services</SelectItem>
                      <SelectItem value="both">Mixed Rewards</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        
        {/* Sort By */}
        <AccordionItem value="sort">
          <AccordionTrigger>Sort Results</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => onFilterChange('sortBy', value as 'relevance' | 'engagement' | 'followers' | 'rating')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Sort Options</SelectLabel>
                    <SelectItem value="relevance">Best Match</SelectItem>
                    <SelectItem value="engagement">
                      {userType === 'business' ? 'Highest Engagement' : 'Highest Reward Value'}
                    </SelectItem>
                    <SelectItem value="followers">
                      {userType === 'business' ? 'Most Followers' : 'Most Reviews'}
                    </SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Tags Filter */}
        <AccordionItem value="tags">
          <AccordionTrigger>Tags</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {filters.tags.length === 0 
                      ? "Select tags..." 
                      : `${filters.tags.length} selected`}
                    <Plus className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found</CommandEmpty>
                      <CommandGroup>
                        {availableTags.map((tag) => {
                          const isSelected = filters.tags.includes(tag);
                          return (
                            <CommandItem
                              key={tag}
                              value={tag}
                              onSelect={(currentValue) => {
                                const selected = filters.tags.includes(currentValue);
                                const newTags = selected
                                  ? filters.tags.filter((s) => s !== currentValue)
                                  : [...filters.tags, currentValue];
                                onFilterChange('tags', newTags);
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </div>
                              <span>{tag}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        className="h-3 w-3 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => onFilterChange('tags', filters.tags.filter(t => t !== tag))}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}