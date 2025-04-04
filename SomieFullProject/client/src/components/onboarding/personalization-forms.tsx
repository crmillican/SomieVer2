import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";

export interface BusinessPersonalizationData {
  industry: string;
  marketingGoal: string;
}

export interface InfluencerPersonalizationData {
  primaryPlatform: string;
  contentNiche: string;
}

interface BusinessPersonalizationFormProps {
  onSubmit: (data: BusinessPersonalizationData) => void;
}

export function BusinessPersonalizationForm({ onSubmit }: BusinessPersonalizationFormProps) {
  const [formData, setFormData] = useState<BusinessPersonalizationData>({
    industry: "",
    marketingGoal: "awareness"
  });

  const handleChange = (field: keyof BusinessPersonalizationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const industries = [
    "Fashion & Apparel",
    "Beauty & Cosmetics",
    "Health & Wellness",
    "Food & Beverage",
    "Tech & Software",
    "Finance & Fintech",
    "Home & Decor",
    "Travel & Lifestyle",
    "Gaming & Entertainment",
    "Education & EdTech",
    "Retail & E-commerce",
    "Sports & Fitness"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="industry" className="text-base font-medium">
          What industry is your business in?
        </Label>
        <Select 
          value={formData.industry} 
          onValueChange={(value) => handleChange("industry", value)}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map(industry => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2">
        <Label className="text-base font-medium mb-3 block">
          What's your main marketing goal right now?
        </Label>
        <RadioGroup 
          value={formData.marketingGoal} 
          onValueChange={(value) => handleChange("marketingGoal", value)}
          className="flex flex-col space-y-3"
        >
          <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer border">
            <RadioGroupItem value="awareness" id="awareness" />
            <Label htmlFor="awareness" className="cursor-pointer font-normal flex flex-col">
              <span className="font-medium">Brand Awareness</span>
              <span className="text-xs text-muted-foreground">Increase visibility and reach new audiences</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer border">
            <RadioGroupItem value="engagement" id="engagement" />
            <Label htmlFor="engagement" className="cursor-pointer font-normal flex flex-col">
              <span className="font-medium">Engagement & Community</span>
              <span className="text-xs text-muted-foreground">Build deeper connections with your audience</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer border">
            <RadioGroupItem value="sales" id="sales" />
            <Label htmlFor="sales" className="cursor-pointer font-normal flex flex-col">
              <span className="font-medium">Direct Sales & Conversions</span>
              <span className="text-xs text-muted-foreground">Drive immediate purchases and actions</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full mt-6">
        Find My Perfect Creators
      </Button>
    </form>
  );
}

interface InfluencerPersonalizationFormProps {
  onSubmit: (data: InfluencerPersonalizationData) => void;
}

export function InfluencerPersonalizationForm({ onSubmit }: InfluencerPersonalizationFormProps) {
  const [formData, setFormData] = useState<InfluencerPersonalizationData>({
    primaryPlatform: "",
    contentNiche: ""
  });

  const handleChange = (field: keyof InfluencerPersonalizationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const contentNiches = [
    "Beauty & Makeup",
    "Fashion & Style",
    "Fitness & Wellness",
    "Food & Cooking",
    "Travel & Adventure",
    "Tech & Gadgets",
    "Gaming",
    "Lifestyle & Vlogs",
    "Educational Content",
    "Comedy & Entertainment",
    "Art & Design",
    "Personal Finance",
    "Parenting & Family"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-base font-medium mb-3 block">
          Which platform do you create content for most often?
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <Button
            type="button"
            variant={formData.primaryPlatform === "instagram" ? "default" : "outline"}
            className={`flex flex-col items-center py-6 h-auto ${formData.primaryPlatform === "instagram" ? "" : "hover:bg-muted/50"}`}
            onClick={() => handleChange("primaryPlatform", "instagram")}
          >
            <SiInstagram className="h-8 w-8 mb-2" />
            <span className="text-sm">Instagram</span>
          </Button>
          
          <Button
            type="button"
            variant={formData.primaryPlatform === "tiktok" ? "default" : "outline"}
            className={`flex flex-col items-center py-6 h-auto ${formData.primaryPlatform === "tiktok" ? "" : "hover:bg-muted/50"}`}
            onClick={() => handleChange("primaryPlatform", "tiktok")}
          >
            <SiTiktok className="h-8 w-8 mb-2" />
            <span className="text-sm">TikTok</span>
          </Button>
          
          <Button
            type="button"
            variant={formData.primaryPlatform === "youtube" ? "default" : "outline"}
            className={`flex flex-col items-center py-6 h-auto ${formData.primaryPlatform === "youtube" ? "" : "hover:bg-muted/50"}`}
            onClick={() => handleChange("primaryPlatform", "youtube")}
          >
            <SiYoutube className="h-8 w-8 mb-2" />
            <span className="text-sm">YouTube</span>
          </Button>
        </div>
      </div>

      <div className="pt-2">
        <Label htmlFor="contentNiche" className="text-base font-medium">
          What's your main content niche?
        </Label>
        <Select 
          value={formData.contentNiche} 
          onValueChange={(value) => handleChange("contentNiche", value)}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your content niche" />
          </SelectTrigger>
          <SelectContent>
            {contentNiches.map(niche => (
              <SelectItem key={niche} value={niche}>
                {niche}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full mt-6"
        disabled={!formData.primaryPlatform || !formData.contentNiche}
      >
        Find My Brand Matches
      </Button>
    </form>
  );
}