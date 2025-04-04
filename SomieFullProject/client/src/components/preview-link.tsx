import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link2, Copy, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function PreviewLink() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createPreviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/preview-link");
      const data = await res.json();
      return data.previewUrl;
    },
    onSuccess: (url) => {
      setPreviewUrl(url);
      toast({
        title: "Preview link created",
        description: "Share this link with your testers",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create preview link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    if (previewUrl) {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "The preview link has been copied",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Share Preview Link
        </CardTitle>
        <CardDescription>
          Create a preview link to share with testers. The link will be valid for 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => createPreviewMutation.mutate()}
            disabled={createPreviewMutation.isPending}
          >
            Generate Preview Link
          </Button>
        </div>
        {previewUrl && (
          <div className="flex gap-2">
            <Input value={previewUrl} readOnly />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
