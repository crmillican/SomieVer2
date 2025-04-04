import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Instagram, 
  Youtube, 
  MessageSquare, 
  Calendar,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Business {
  id: number;
  businessName: string;
  industry: string;
  location: string;
  userId: number;
  website: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  description: string | null;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  business: Business;
}

interface Deal {
  id: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  deadline: string;
  timeframe: number;
  offer: Offer;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  timestamp: string;
}

interface Deliverable {
  id: number;
  description: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  submissionUrl: string | null;
  submittedAt: string | null;
  feedback: string | null;
}

function DealDetailContent() {
  // Initialize all hooks at the top
  const [message, setMessage] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const parsedId = params.id ? parseInt(params.id) : null;

  // Authentication check
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  // Protected queries - only run when authenticated
  const { data: deal, isLoading: dealLoading, error: dealError } = useQuery<Deal>({
    queryKey: [`/api/offers/claims/${parsedId}`],
    enabled: !!user && !!parsedId && !isNaN(parsedId),
    retry: false
  });

  const { data: messages = [], error: messagesError } = useQuery<Message[]>({
    queryKey: [`/api/offers/claims/${parsedId}/messages`],
    enabled: !!user && !!deal && !!parsedId && !isNaN(parsedId),
    retry: false
  });

  const { data: deliverables = [], error: deliverablesError } = useQuery<Deliverable[]>({
    queryKey: [`/api/offers/claims/${parsedId}/deliverables`],
    enabled: !!user && !!deal && !!parsedId && !isNaN(parsedId),
    retry: false
  });

  // Authentication effect
  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/login');
    }
  }, [user, userLoading, setLocation]);

  // Loading states
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Deal loading
  if (dealLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (dealError || !deal) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          Error loading deal details. Please try again.
        </div>
      </div>
    );
  }

  // Calculate progress safely
  const progress = deliverables.length > 0
    ? (deliverables.filter(d => d.status === "approved").length / deliverables.length) * 100
    : 0;

  // Mutations
  const submitDeliverableMutation = useMutation({
    mutationFn: async (deliverableId: number) => {
      if (!parsedId) throw new Error("No claim ID available");
      const res = await apiRequest(
        "POST",
        `/api/offers/claims/${parsedId}/deliverables/${deliverableId}`,
        { submissionUrl }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offers/claims/${parsedId}/deliverables`] });
      setSubmissionUrl("");
    },
  });

  // Message handler
  const sendMessage = async () => {
    if (!message.trim() || !parsedId) return;

    try {
      await apiRequest("POST", `/api/offers/claims/${parsedId}/messages`, {
        content: message
      });
      queryClient.invalidateQueries({ queryKey: [`/api/offers/claims/${parsedId}/messages`] });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/deals">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{deal.offer.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{deal.offer.business.location}</span>
            </div>
          </div>
          <Badge className="text-lg" variant={deal.status === "completed" ? "default" : "secondary"}>
            {deal.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Progress</CardTitle>
              <CardDescription>Track your deliverables and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-4" />
              <div className="flex justify-between text-sm text-muted-foreground mb-6">
                <span>{Math.round(progress)}% Complete</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {deal.timeframe} days remaining
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{deliverable.description}</span>
                      <Badge variant={
                        deliverable.status === "approved" ? "default" :
                        deliverable.status === "submitted" ? "secondary" :
                        deliverable.status === "rejected" ? "destructive" :
                        "outline"
                      }>
                        {deliverable.status}
                      </Badge>
                    </div>
                    {deliverable.status === "pending" ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter submission URL"
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                        />
                        <Button 
                          onClick={() => submitDeliverableMutation.mutate(deliverable.id)}
                          disabled={!submissionUrl || submitDeliverableMutation.isPending}
                        >
                          {submitDeliverableMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Submit"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <>
                        {deliverable.submittedAt && (
                          <div className="text-sm text-muted-foreground">
                            Submitted: {new Date(deliverable.submittedAt).toLocaleDateString()}
                          </div>
                        )}
                        {deliverable.feedback && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            Feedback: {deliverable.feedback}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started on {new Date(deal.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Due by {new Date(deal.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{deal.offer.business.businessName}</h3>
                  {deal.offer.business.description && (
                    <p className="text-muted-foreground">{deal.offer.business.description}</p>
                  )}
                </div>
                <div className="flex gap-4">
                  {deal.offer.business.website && (
                    <a
                      href={deal.offer.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {deal.offer.business.instagramUrl && (
                    <a
                      href={deal.offer.business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {deal.offer.business.tiktokUrl && (
                    <a
                      href={deal.offer.business.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <SiTiktok className="h-5 w-5" />
                    </a>
                  )}
                  {deal.offer.business.youtubeUrl && (
                    <a
                      href={deal.offer.business.youtubeUrl}
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

          <Drawer>
            <DrawerTrigger asChild>
              <Button className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat with Business
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Chat with {deal.offer.business.businessName}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4">
                <div className="h-[400px] overflow-y-auto border rounded-lg p-4 mb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 ${
                        msg.senderId === deal.offer.business.userId
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          msg.senderId === deal.offer.business.userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!message.trim()}>Send</Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}

// Wrap the main component in an error boundary
export default function DealDetail() {
  try {
    return <DealDetailContent />;
  } catch (error) {
    console.error('Error in DealDetail:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          An error occurred while loading the page. Please try again.
        </div>
      </div>
    );
  }
}