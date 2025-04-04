import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, XCircle, Eye, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const OffersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [offerFilter, setOfferFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch offers
  const { data: offersData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/offers", offerFilter, page, searchQuery],
    retry: false,
  });

  // Update offer status mutation
  const updateOfferMutation = useMutation({
    mutationFn: async (data: { offerId: number; status: string; reason?: string }) => {
      return apiRequest(`/api/admin/offers/${data.offerId}/status`, {
        method: "PATCH",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Offer updated",
        description: "Offer status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the offer.",
        variant: "destructive",
      });
    },
  });

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleViewOffer = (offer: any) => {
    setSelectedOffer(offer);
    setIsViewDialogOpen(true);
  };

  const handleEditOffer = (offer: any) => {
    setSelectedOffer(offer);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOfferStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    updateOfferMutation.mutate({
      offerId: selectedOffer.id,
      status: selectedOffer.status,
      reason: selectedOffer.statusReason,
    });
  };

  const offers = offersData?.offers || [];
  const totalPages = offersData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
          <p className="text-muted-foreground">
            Manage and moderate campaign offers
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title or business..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <Select value={offerFilter} onValueChange={setOfferFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offers</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Offers list */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Offers</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading offers...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p>Failed to load offers. Please try again later.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No offers found. Try a different search or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        offers.map((offer: any) => (
                          <TableRow key={offer.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="rounded-full bg-primary/10 p-1">
                                  <Package className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{offer.title}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {offer.description}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {offer.business?.businessName || 'Unknown'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {offer.createdAt ? formatDate(offer.createdAt) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                offer.status === 'active' ? 'success' :
                                offer.status === 'pending' ? 'warning' :
                                offer.status === 'rejected' ? 'destructive' : 'outline'
                              }>
                                {offer.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewOffer(offer)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditOffer(offer)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page => Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page => Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="flagged" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Offers</CardTitle>
                <CardDescription>
                  Offers that have been flagged for review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center border rounded-md">
                  <p className="text-muted-foreground">Flagged offers will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Review</CardTitle>
                <CardDescription>
                  Offers awaiting admin approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center border rounded-md">
                  <p className="text-muted-foreground">Pending offers will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Offer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected offer
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Title</h3>
                  <p>{selectedOffer.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Status</h3>
                  <Badge variant={
                    selectedOffer.status === 'active' ? 'success' :
                    selectedOffer.status === 'pending' ? 'warning' :
                    selectedOffer.status === 'rejected' ? 'destructive' : 'outline'
                  }>
                    {selectedOffer.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Business</h3>
                  <p>{selectedOffer.business?.businessName || 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created</h3>
                  <p>{selectedOffer.createdAt ? formatDate(selectedOffer.createdAt) : 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="whitespace-pre-wrap">{selectedOffer.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Reward</h3>
                  <p>{selectedOffer.reward}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Posts Required</h3>
                  <p>{selectedOffer.postsRequired}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Min Followers</h3>
                  <p>{selectedOffer.minFollowers?.toLocaleString() || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Min Engagement</h3>
                  <p>{selectedOffer.minEngagement ? `${selectedOffer.minEngagement}%` : 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Category</h3>
                  <p>{selectedOffer.category || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Content Type</h3>
                  <p>{selectedOffer.contentType || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p>{selectedOffer.location || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Timeframe</h3>
                  <p>{selectedOffer.timeframe ? `${selectedOffer.timeframe} days` : 'Not specified'}</p>
                </div>
                {selectedOffer.tags && selectedOffer.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold mb-1">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedOffer.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Offer Status</DialogTitle>
            <DialogDescription>
              Change the status of this offer. This will affect its visibility on the platform.
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <form onSubmit={handleUpdateOfferStatus}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={selectedOffer.title}
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedOffer.status}
                    onValueChange={(value) => setSelectedOffer({...selectedOffer, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedOffer.status === 'rejected' && (
                  <div className="grid gap-2">
                    <Label htmlFor="statusReason">Reason for rejection</Label>
                    <Textarea
                      id="statusReason"
                      placeholder="Explain why this offer is being rejected"
                      value={selectedOffer.statusReason || ''}
                      onChange={(e) => setSelectedOffer({...selectedOffer, statusReason: e.target.value})}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={selectedOffer.isFeatured || false}
                      onCheckedChange={(checked) => setSelectedOffer({...selectedOffer, isFeatured: checked})}
                    />
                    <Label htmlFor="featured">Feature this offer on the marketplace</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOfferMutation.isPending}>
                  {updateOfferMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default OffersPage;