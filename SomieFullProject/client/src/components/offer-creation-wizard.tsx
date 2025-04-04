import { useState, useEffect } from "react";
import { Check, ChevronsRight, Lightbulb, MessageCircle, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface OfferCreationWizardProps {
  initialData?: any;
  onComplete: (data: any) => void;
  onCancel: () => void;
  generateContentSuggestions: (category: string, contentType: string, rewardType: string) => string[];
  calculateEstimatedReach: (minFollowers: number, engagementRate: number, postsRequired: number) => { total: number; engagement: number };
}

export function OfferCreationWizard({
  initialData,
  onComplete,
  onCancel,
  generateContentSuggestions,
  calculateEstimatedReach
}: OfferCreationWizardProps) {
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
  
  const [contentSuggestions, setContentSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [reachEstimate, setReachEstimate] = useState({ total: 0, engagement: 0 });
  
  // Update content suggestions when relevant fields change
  useEffect(() => {
    if (step === 2) {
      const suggestions = generateContentSuggestions(
        formData.category,
        formData.contentType,
        formData.rewardType
      );
      setContentSuggestions(suggestions);
    }
  }, [step, formData.category, formData.contentType, formData.rewardType, generateContentSuggestions]);
  
  // Update reach estimates when relevant fields change
  useEffect(() => {
    if (step === 3) {
      const estimates = calculateEstimatedReach(
        formData.minFollowers,
        formData.minEngagement,
        formData.postsRequired
      );
      setReachEstimate(estimates);
    }
  }, [step, formData.minFollowers, formData.minEngagement, formData.postsRequired, calculateEstimatedReach]);
  
  // Handle form input changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle suggestion toggle
  const toggleSuggestion = (suggestion: string) => {
    if (selectedSuggestions.includes(suggestion)) {
      setSelectedSuggestions(prev => prev.filter(s => s !== suggestion));
    } else {
      setSelectedSuggestions(prev => [...prev, suggestion]);
    }
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
  
  // Render step 1: Basic offer information
  const renderStep1 = () => (
    <div className="space-y-4">
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
          <Label htmlFor="reward">Amount ($)</Label>
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
          <p className="text-xs text-muted-foreground">
            The typical rate for content creators in your category starts at $100
          </p>
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
  
  // Render step 2: Content requirements and suggestions
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h4 className="font-medium">AI-Generated Content Suggestions</h4>
          <p className="text-sm text-muted-foreground">
            Based on your category and content type, we recommend these specific content ideas.
            Select the ones you like to add them to your offer.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 mt-4">
        {contentSuggestions.map((suggestion, index) => (
          <div 
            key={index}
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
    </div>
  );
  
  // Render step 3: Target audience and performance metrics
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Target Audience Metrics</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Define the minimum requirements for influencers to join your campaign
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minFollowers">Minimum Followers</Label>
            <Input 
              id="minFollowers" 
              type="number"
              placeholder="1000" 
              value={formData.minFollowers}
              onChange={(e) => handleChange('minFollowers', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Micro-influencers (1-10K followers) often have higher engagement rates
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="minEngagement">Minimum Engagement Rate (%)</Label>
            <Input 
              id="minEngagement" 
              type="number"
              placeholder="3" 
              value={formData.minEngagement}
              onChange={(e) => handleChange('minEngagement', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              The average engagement rate across platforms is 2-3%
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postsRequired">Posts Required</Label>
            <Input 
              id="postsRequired" 
              type="number"
              placeholder="1" 
              value={formData.postsRequired}
              onChange={(e) => handleChange('postsRequired', parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe (Days)</Label>
            <Input 
              id="timeframe" 
              type="number"
              placeholder="14" 
              value={formData.timeframe}
              onChange={(e) => handleChange('timeframe', parseInt(e.target.value) || 7)}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estimated Campaign Performance
            </CardTitle>
            <CardDescription>
              Based on your target metrics, here's what you can expect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Potential Reach</h4>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{formatNumber(reachEstimate.total)}</span>
                  <span className="text-muted-foreground text-sm ml-2">people</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Estimated Engagement</h4>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{formatNumber(reachEstimate.engagement)}</span>
                  <span className="text-muted-foreground text-sm ml-2">interactions</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
            
            <div className="mt-4 p-3 border rounded-md bg-muted/50">
              <h4 className="text-sm font-medium mb-1">Campaign Overview</h4>
              <p className="text-sm text-muted-foreground">
                Your campaign will run for {formData.timeframe} days and require {formData.postsRequired} post(s) from each creator.
                We estimate about 4-5 creators matching your criteria will participate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  // Determine the current step content
  const renderCurrentStep = () => {
    switch(step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = (step / 3) * 100;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === 1 && "Campaign Details"}
            {step === 2 && "Content Requirements"}
            {step === 3 && "Audience & Metrics"}
          </h2>
          <span className="text-sm text-muted-foreground">Step {step} of 3</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      <div className="flex flex-col gap-6">
        {renderCurrentStep()}
      </div>
      
      <Separator />
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <div className="flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(prev => prev - 1)}
            >
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(prev => prev + 1)}
              disabled={step === 1 && (!formData.title || !formData.rewardType)}
            >
              Continue
              <ChevronsRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Create Offer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}