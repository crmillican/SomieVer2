import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Globe, Instagram, Youtube, MessageSquare, Loader2 } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: number;
  title: string;
  description: string;
  reward: string;
  minFollowers: number;
  minEngagement: number;
  postsRequired: number;
  timeframe: number;
  category: string;
  tags: string[];
  status: string;
  business: {
    id: number;
    businessName: string;
    industry: string;
    location: string;
    description: string;
    website?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    youtubeUrl?: string;
  };
}

export default function OfferDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const { data: offer, isLoading } = useQuery<Offer>({
    queryKey: [`/api/offers/${id}`],
  });

  const claimOfferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/offers/${id}/claims`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to claim offer");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer claimed successfully!",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{offer.title}</h1>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{offer.business.location}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">{offer.description}</p>
                </div>
                <div>
                  <h3 className="font-medium">Reward</h3>
                  <p className="text-muted-foreground">{offer.reward}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Minimum Followers</h3>
                    <p className="text-muted-foreground">{offer.minFollowers}+</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Required Engagement</h3>
                    <p className="text-muted-foreground">{offer.minEngagement}%</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Posts Required</h3>
                    <p className="text-muted-foreground">{offer.postsRequired}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Timeframe</h3>
                    <p className="text-muted-foreground">{offer.timeframe} days</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{offer.category}</Badge>
                  {offer.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{offer.business.businessName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {offer.business.industry}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">About</h3>
                  <p className="text-muted-foreground">{offer.business.description}</p>
                </div>
                <div className="flex gap-4">
                  {offer.business.website && (
                    <a
                      href={offer.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {offer.business.instagramUrl && (
                    <a
                      href={offer.business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {offer.business.tiktokUrl && (
                    <a
                      href={offer.business.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <SiTiktok className="h-5 w-5" />
                    </a>
                  )}
                  {offer.business.youtubeUrl && (
                    <a
                      href={offer.business.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Required Deliverables</CardTitle>
              <CardDescription>Complete these items within the timeframe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: offer.postsRequired }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>Post {i + 1}</span>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={() => claimOfferMutation.mutate()}
            disabled={claimOfferMutation.isPending}
          >
            {claimOfferMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Claim This Offer
          </Button>
        </div>
      </div>
    </div>
  );
}