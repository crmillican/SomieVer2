import { useState, useEffect } from "react";
import { Check, ChevronsRight, Lightbulb, MessageCircle, DollarSign, BarChart3, Sparkles, Zap, Layers, Target, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  useAIOfferTools, 
  MatchPreview, 
  ContentBriefSuggestion, 
  IndustryTemplate, 
  BudgetRecommendation 
} from "@/hooks/use-ai-offer-tools";

// Import our new AI-enhanced components
import { SmartBudgetOptimizer, BudgetOptimization } from "@/components/smart-budget-optimizer";
import { PerformanceForecaster, CampaignForecast } from "@/components/performance-forecaster";
import { InfluencerMatcher, InfluencerMatch } from "@/components/influencer-matcher";

interface AIEnhancedOfferWizardProps {
  initialData?: any;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export function AIEnhancedOfferWizard({
  initialData,
  onComplete,
  onCancel
}: AIEnhancedOfferWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    reward: initialData?.reward || "",
    rewardType: initialData?.rewardType || "monetary",
    minFollowers: initialData?.minFollowers || 1000,
    minEngagement: initialData?.minEngagement || 3,
    postsRequired: initialData?.postsRequired || 1,
    timeframe: initialData?.timeframe || 14,
    category: initialData?.category || "fashion",
    contentType: initialData?.contentType || "image",
    location: initialData?.location || "",
    tags: initialData?.tags || []
  });
  
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [matchPreviewData, setMatchPreviewData] = useState<MatchPreview | null>(null);
  
  // Get AI hooks
  const { 
    useIndustryTemplate, 
    useBudgetRecommendation, 
    useMatchPreview, 
    useContentBrief,
    useCampaignObjectives 
  } = useAIOfferTools();
  
  // Initialize queries
  const industryTemplate = useIndustryTemplate();
  const budgetRecommendation = useBudgetRecommendation(
    formData.rewardType === 'monetary' ? parseInt(formData.reward) || 0 : 0, 
    formData.minFollowers * 5, // estimate potential reach
    formData.contentType
  );
  const contentBrief = useContentBrief(formData.category, formData.contentType);
  const campaignObjectives = useCampaignObjectives();
  const { generateMatchPreview, isGenerating } = useMatchPreview();
  
  // Apply template data when available
  useEffect(() => {
    if (industryTemplate.isSuccess && industryTemplate.data && step === 1) {
      const template = industryTemplate.data as IndustryTemplate;
      setFormData(prev => ({
        ...prev,
        title: prev.title || template.title,
        description: prev.description || template.description,
        contentType: prev.contentType || template.contentType,
        category: prev.category || template.category,
        postsRequired: prev.postsRequired || template.suggestedPostsRequired,
        timeframe: prev.timeframe || template.suggestedTimeframe,
        minFollowers: prev.minFollowers || template.suggestedRequirements.minFollowers,
        minEngagement: prev.minEngagement || template.suggestedRequirements.minEngagement,
        tags: prev.tags.length ? prev.tags : template.suggestedTags
      }));
    }
  }, [industryTemplate.data, industryTemplate.isSuccess, step]);
  
  // Generate match preview when changing to step 3
  useEffect(() => {
    if (step === 3 && !matchPreviewData && !isGenerating) {
      handleGenerateMatchPreview();
    }
  }, [step]);
  
  // Update content suggestions when relevant fields change
  useEffect(() => {
    if (step === 2 && contentBrief.isSuccess && contentBrief.data) {
      // Reset selected suggestions when content type/category changes
      setSelectedSuggestions([]);
    }
  }, [formData.category, formData.contentType, contentBrief.isSuccess, contentBrief.data, step]);
  
  // Handle form input changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset match preview when criteria change
    if (['minFollowers', 'minEngagement', 'category', 'contentType', 'location'].includes(field)) {
      setMatchPreviewData(null);
    }
  };
  
  // Handle suggestion toggle
  const toggleSuggestion = (suggestion: string) => {
    if (selectedSuggestions.includes(suggestion)) {
      setSelectedSuggestions(prev => prev.filter(s => s !== suggestion));
    } else {
      setSelectedSuggestions(prev => [...prev, suggestion]);
    }
  };
  
  // Handle match preview generation
  const handleGenerateMatchPreview = async () => {
    try {
      const preview = await generateMatchPreview({
        minFollowers: formData.minFollowers,
        minEngagement: formData.minEngagement,
        category: formData.category,
        contentType: formData.contentType,
        location: formData.location,
        tags: formData.tags
      });
      
      setMatchPreviewData(preview);
    } catch (error) {
      console.error("Error generating match preview:", error);
    }
  };
  
  // Apply budget recommendation
  const applyBudgetRecommendation = () => {
    if (budgetRecommendation.data) {
      const data = budgetRecommendation.data as BudgetRecommendation;
      // Extract a reasonable value from the suggested reward range
      let rewardValue = data.suggestedReward;
      
      // Handle the case of "X-Y per post" format
      if (rewardValue.includes('-')) {
        // Take the lower value from the range as a safe default
        const match = rewardValue.match(/\$?(\d+)/);
        if (match && match[1]) {
          rewardValue = match[1];
        } else {
          // Fallback to middle of range
          const numbers = rewardValue.match(/\d+/g);
          if (numbers && numbers.length >= 2) {
            const min = parseInt(numbers[0]);
            const max = parseInt(numbers[1]);
            rewardValue = Math.floor((min + max) / 2).toString();
          }
        }
      } else if (rewardValue.includes('/post')) {
        rewardValue = rewardValue.split('/')[0];
        rewardValue = rewardValue.replace(/[^0-9.]/g, '').trim();
      } else {
        // Just extract the number
        rewardValue = rewardValue.replace(/[^0-9.]/g, '').trim();
      }
      
      setFormData(prev => ({
        ...prev,
        reward: rewardValue,
        rewardType: data.rewardType || prev.rewardType
      }));
    }
  };
  
  // Apply suggestion adjustment
  const applySuggestionAdjustment = (adjustment: { field: string; suggestedValue: any }) => {
    setFormData(prev => ({
      ...prev,
      [adjustment.field]: adjustment.suggestedValue
    }));
    
    // Reset match preview to trigger regeneration
    setMatchPreviewData(null);
  };
  
  // Combine selected suggestions into the description
  const combineDescription = () => {
    let finalDescription = formData.description ? formData.description + "\n\n" : "";
    
    if (selectedSuggestions.length > 0) {
      finalDescription += "Content Requirements:\n";
      selectedSuggestions.forEach(suggestion => {
        finalDescription += `- ${suggestion}\n`;
      });
    }
    
    return finalDescription.trim();
  };
  
  // Handle wizard completion
  const handleComplete = () => {
    // Combine the description with selected content suggestions
    const finalData = {
      ...formData,
      description: combineDescription(),
      // Add tags based on content type and category if none provided
      tags: formData.tags.length > 0 ? formData.tags : [formData.category, formData.contentType]
    };
    
    onComplete(finalData);
  };
  
  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };
  
  // Render step 1: Basic offer information with AI template
  const renderStep1 = () => (
    <div className="space-y-4">
      {industryTemplate.isLoading && (
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      
      {industryTemplate.isSuccess && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-medium">AI-Generated Template Applied</h4>
            <p className="text-sm text-muted-foreground">
              We've pre-filled your offer with industry-specific settings.
              Feel free to customize as needed.
            </p>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="title">Offer Title</Label>
        <Input 
          id="title" 
          placeholder="e.g., Promote our new skincare line" 
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A clear, concise title that describes what you're looking for
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange('category', value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="tech">Technology</SelectItem>
              <SelectItem value="gaming">Gaming</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contentType">Content Type</Label>
          <Select
            value={formData.contentType}
            onValueChange={(value) => handleChange('contentType', value)}
          >
            <SelectTrigger id="contentType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Photos/Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="story">Stories</SelectItem>
              <SelectItem value="multiple">Multiple Types</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reward-type">What are you offering?</Label>
        <RadioGroup 
          value={formData.rewardType} 
          onValueChange={(value) => handleChange('rewardType', value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-2"
        >
          <Label 
            htmlFor="monetary" 
            className={`flex items-center gap-2 p-4 border rounded-md cursor-pointer ${formData.rewardType === 'monetary' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
            <RadioGroupItem value="monetary" id="monetary" />
            <div>
              <p className="font-medium">Money</p>
              <p className="text-xs text-muted-foreground">Pay influencers directly</p>
            </div>
          </Label>
          
          <Label 
            htmlFor="product" 
            className={`flex items-center gap-2 p-4 border rounded-md cursor-pointer ${formData.rewardType === 'product' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
            <RadioGroupItem value="product" id="product" />
            <div>
              <p className="font-medium">Product</p>
              <p className="text-xs text-muted-foreground">Send free products</p>
            </div>
          </Label>
          
          <Label 
            htmlFor="exposure" 
            className={`flex items-center gap-2 p-4 border rounded-md cursor-pointer ${formData.rewardType === 'exposure' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
            <RadioGroupItem value="exposure" id="exposure" />
            <div>
              <p className="font-medium">Exposure</p>
              <p className="text-xs text-muted-foreground">Feature them in your channels</p>
            </div>
          </Label>
        </RadioGroup>
      </div>
      
      {formData.rewardType === 'monetary' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="reward">Amount ($)</Label>
            {budgetRecommendation.isSuccess && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-1 text-xs" 
                onClick={applyBudgetRecommendation}
              >
                <Zap className="h-3.5 w-3.5" />
                Apply AI Suggestion
              </Button>
            )}
          </div>
          
          <div className="relative">
            <span className="absolute left-3 top-2.5">$</span>
            <Input 
              id="reward" 
              className="pl-7" 
              placeholder="150" 
              value={formData.reward}
              onChange={(e) => handleChange('reward', e.target.value)}
            />
          </div>
          
          {budgetRecommendation.isSuccess && budgetRecommendation.data ? (
            <p className="text-xs text-primary">
              AI recommends: {(budgetRecommendation.data as BudgetRecommendation).suggestedReward} 
              for an estimated {formatNumber((budgetRecommendation.data as BudgetRecommendation).estimatedReach || 0)} reach
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              The typical rate for content creators in your category starts at $100
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Brief Description (Optional)</Label>
        <Textarea 
          id="description" 
          placeholder="Briefly describe your product/service and what you're looking for" 
          className="min-h-[100px]"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>
    </div>
  );
  
  // Render step 2: Content requirements and AI-generated suggestions
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h4 className="font-medium">AI-Generated Content Suggestions</h4>
          <p className="text-sm text-muted-foreground">
            Based on your category and content type, we recommend these specific content ideas.
            Select the ones you like to add them to your offer.
          </p>
        </div>
      </div>
      
      {contentBrief.isLoading ? (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : contentBrief.isSuccess ? (
        <div className="grid grid-cols-1 gap-2 mt-4">
          <div className="p-3 border-2 border-primary/40 bg-primary/5 rounded-md space-y-2 mb-2">
            <h3 className="font-medium text-sm">Recommended Format: {contentBrief.data.suggestedFormat}</h3>
            <div className="flex flex-wrap gap-1">
              {contentBrief.data.platformSpecificTips.map((tip, i) => 
                <Badge key={i} variant="outline" className="bg-background">{tip}</Badge>
              )}
            </div>
          </div>
          
          {/* Key Messages */}
          {contentBrief.data.keyMessages.map((suggestion, index) => (
            <div 
              key={`message-${index}`}
              onClick={() => toggleSuggestion(suggestion)}
              className={`p-3 border rounded-md flex items-center gap-3 cursor-pointer ${
                selectedSuggestions.includes(suggestion) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                selectedSuggestions.includes(suggestion) ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}>
                {selectedSuggestions.includes(suggestion) && (
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </div>
              <p className="text-sm">{suggestion}</p>
            </div>
          ))}
          
          {/* Do's from Best Practices */}
          {contentBrief.data.dosDonts.dos.map((suggestion, index) => (
            <div 
              key={`dos-${index}`}
              onClick={() => toggleSuggestion(suggestion)}
              className={`p-3 border rounded-md flex items-center gap-3 cursor-pointer ${
                selectedSuggestions.includes(suggestion) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                selectedSuggestions.includes(suggestion) ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}>
                {selectedSuggestions.includes(suggestion) && (
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </div>
              <p className="text-sm">{suggestion}</p>
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertTitle>Couldn't load content suggestions</AlertTitle>
          <AlertDescription>
            We'll use basic suggestions instead. Try refreshing the page.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-4">
        <Label>Add a Custom Requirement (Optional)</Label>
        <div className="flex gap-2 mt-1">
          <Input 
            placeholder="e.g., Use our branded hashtag #YourBrand" 
            id="custom-suggestion"
          />
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              const customInput = document.getElementById('custom-suggestion') as HTMLInputElement;
              if (customInput && customInput.value) {
                toggleSuggestion(customInput.value);
                customInput.value = '';
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>
      
      <div className="mt-4">
        <Label>Selected Requirements ({selectedSuggestions.length})</Label>
        {selectedSuggestions.length > 0 ? (
          <div className="mt-2 border rounded-md p-3 space-y-2">
            {selectedSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            No requirements selected. Click on suggestions above to add them.
          </p>
        )}
      </div>
      
      {contentBrief.isSuccess && (
        <div className="mt-4 border rounded-md p-4">
          <h3 className="font-medium mb-2">Expected Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Engagement Rate</p>
              <p className="font-medium">{contentBrief.data.estimatedPerformance.expectedEngagementRate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Views Estimate</p>
              <p className="font-medium">{contentBrief.data.estimatedPerformance.viewsEstimate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversion Potential</p>
              <p className="font-medium">{contentBrief.data.estimatedPerformance.conversionPotential}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render step 3: Target audience and AI match preview
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium">AI-Optimized Audience Metrics</h3>
            <p className="text-sm text-muted-foreground">
              We've calculated the optimal metrics based on your industry and content type
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Reset to default
              if (industryTemplate.data) {
                const template = industryTemplate.data as IndustryTemplate;
                setFormData(prev => ({
                  ...prev,
                  minFollowers: template.suggestedRequirements.minFollowers,
                  minEngagement: template.suggestedRequirements.minEngagement,
                  postsRequired: template.suggestedPostsRequired,
                  timeframe: template.suggestedTimeframe
                }));
                // Reset match preview to trigger regeneration
                setMatchPreviewData(null);
              }
            }}
            className="gap-1"
          >
            <Zap className="h-3.5 w-3.5" />
            Reset to Optimal
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="minFollowers">Follower Count</Label>
              <Badge variant="outline" className="font-normal">Industry: {formData.category}</Badge>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Slider 
                  id="minFollowers"
                  min={500}
                  max={20000}
                  step={500}
                  value={[formData.minFollowers]}
                  onValueChange={(value: number[]) => handleChange('minFollowers', value[0])}
                  className="py-4"
                />
              </div>
              <div className="w-20">
                <Input 
                  value={formData.minFollowers}
                  onChange={(e) => handleChange('minFollowers', parseInt(e.target.value) || 0)}
                  className="h-8 text-center"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Micro (500+)</span>
              <span>Mid-Tier (10K+)</span>
              <span>Macro (20K+)</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="minEngagement">Engagement Rate (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help font-normal">
                      Avg: {budgetRecommendation.data ? 
                        (budgetRecommendation.data as BudgetRecommendation).recommendedInfluencerTier : 'micro'} tier
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">Suggested based on your budget and industry. {formData.category} industry typically sees {
                      formData.category === 'beauty' ? '4-5%' :
                      formData.category === 'food' ? '5-6%' : 
                      formData.category === 'fitness' ? '4-5%' : '2-4%'
                    } engagement.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Slider 
                  id="minEngagement"
                  min={1}
                  max={10}
                  step={0.5}
                  value={[formData.minEngagement]}
                  onValueChange={(value: number[]) => handleChange('minEngagement', value[0])}
                  className="py-4"
                />
              </div>
              <div className="w-20">
                <Input 
                  value={formData.minEngagement}
                  onChange={(e) => handleChange('minEngagement', parseFloat(e.target.value) || 0)}
                  className="h-8 text-center"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low (1%)</span>
              <span>Average (3%)</span>
              <span>High (10%+)</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="postsRequired">Posts Required</Label>
              <Badge variant="outline" className="font-normal">Suggested: {industryTemplate.data ? 
                  (industryTemplate.data as IndustryTemplate).suggestedPostsRequired : '1-2'}</Badge>
            </div>
            <div className="flex gap-2 items-center">
              <RadioGroup 
                value={formData.postsRequired.toString()} 
                onValueChange={(value) => handleChange('postsRequired', parseInt(value))}
                className="flex gap-2"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <Label 
                    key={num}
                    htmlFor={`posts-${num}`} 
                    className={`flex items-center justify-center h-9 w-9 border rounded-md cursor-pointer ${
                      formData.postsRequired === num ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value={num.toString()} id={`posts-${num}`} className="sr-only" />
                    {num}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              More posts increases reach but may reduce influencer interest
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="timeframe">Campaign Duration (Days)</Label>
              <Badge variant="outline" className="font-normal">Content: {formData.contentType}</Badge>
            </div>
            <Select
              value={formData.timeframe.toString()}
              onValueChange={(value) => handleChange('timeframe', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days (1 week)</SelectItem>
                <SelectItem value="14">14 days (2 weeks)</SelectItem>
                <SelectItem value="21">21 days (3 weeks)</SelectItem>
                <SelectItem value="30">30 days (1 month)</SelectItem>
                <SelectItem value="60">60 days (2 months)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {formData.timeframe < 14 ? 'Short campaigns work best for time-sensitive promotions' : 
               formData.timeframe < 30 ? 'Two weeks is ideal for most campaigns' : 
               'Longer campaigns work best for ongoing partnerships'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  AI Match Analysis
                </CardTitle>
                <CardDescription>
                  How many influencers match your criteria
                </CardDescription>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateMatchPreview}
                disabled={isGenerating}
              >
                {isGenerating ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isGenerating ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : matchPreviewData ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Potential Matches</h4>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        {matchPreviewData.potentialMatches}
                      </span>
                      <span className="text-muted-foreground ml-2 text-sm">creators match your criteria</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Match Quality Distribution</h4>
                    <div className="flex gap-2 mt-1">
                      <div className="bg-green-100 rounded px-2 py-1 text-xs">
                        <span className="font-medium">{matchPreviewData.matchDistribution.excellent}</span> Excellent
                      </div>
                      <div className="bg-blue-100 rounded px-2 py-1 text-xs">
                        <span className="font-medium">{matchPreviewData.matchDistribution.good}</span> Good
                      </div>
                      <div className="bg-amber-100 rounded px-2 py-1 text-xs">
                        <span className="font-medium">{matchPreviewData.matchDistribution.average}</span> Average
                      </div>
                    </div>
                  </div>
                </div>
                
                {matchPreviewData.potentialMatches < 5 && matchPreviewData.suggestedAdjustments.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Suggestions to Increase Matches
                    </h4>
                    <div className="mt-2 space-y-2">
                      {matchPreviewData.suggestedAdjustments.map((adjustment, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm">
                              Change {adjustment.field === 'minFollowers' ? 'minimum followers' : 
                                     adjustment.field === 'minEngagement' ? 'minimum engagement rate' : 
                                     adjustment.field} from{' '}
                              <span className="font-medium">{adjustment.currentValue}</span> to{' '}
                              <span className="font-medium">{adjustment.suggestedValue}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{adjustment.potentialIncrease} potential matches
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applySuggestionAdjustment(adjustment)}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {matchPreviewData.potentialMatches >= 5 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Good Match Potential
                    </h4>
                    <p className="text-sm mt-1">
                      Your criteria have a good number of potential matches. You're ready to create this offer!
                    </p>
                  </div>
                )}
                
                {matchPreviewData.mostRestrictiveCriteria.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Most Restrictive Criteria</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matchPreviewData.mostRestrictiveCriteria.map((criteria, index) => (
                        <Badge key={index} variant="outline">
                          {criteria === 'followers' ? 'Minimum Followers' :
                           criteria === 'engagement' ? 'Engagement Rate' :
                           criteria === 'location' ? 'Location' :
                           criteria === 'category' ? 'Category' :
                           criteria === 'contentType' ? 'Content Type' : criteria}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                <Button onClick={handleGenerateMatchPreview}>
                  Generate Match Preview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
            <span className={step === 1 ? 'font-medium' : 'text-muted-foreground'}>Basic Info</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-primary-foreground' : step > 2 ? 'bg-muted' : 'bg-muted text-muted-foreground'}`}>2</div>
            <span className={step === 2 ? 'font-medium' : 'text-muted-foreground'}>Content</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
            <span className={step === 3 ? 'font-medium' : 'text-muted-foreground'}>Audience</span>
          </div>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="gap-1"
          >
            Continue <ChevronsRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            className="gap-1"
          >
            Create Offer <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}