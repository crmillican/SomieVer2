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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Flag, Eye, Shield, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ReportsPage = () => {
  const [page, setPage] = useState(1);
  const [reportFilter, setReportFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState({
    action: "dismiss",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/reports", reportFilter, page, searchQuery],
    retry: false,
  });

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: async (data: { reportId: number; action: string; notes: string }) => {
      return apiRequest(`/api/admin/reports/${data.reportId}/resolve`, {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Report resolved",
        description: "The report has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setIsResolveDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error processing the report.",
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

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsDetailDialogOpen(true);
  };

  const handleResolveDialog = (report: any) => {
    setSelectedReport(report);
    setResolution({
      action: "dismiss",
      notes: "",
    });
    setIsResolveDialogOpen(true);
  };

  const handleResolveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    resolveReportMutation.mutate({
      reportId: selectedReport.id,
      action: resolution.action,
      notes: resolution.notes,
    });
  };

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'user':
        return <Badge variant="outline">User</Badge>;
      case 'content':
        return <Badge variant="secondary">Content</Badge>;
      case 'offer':
        return <Badge variant="default">Offer</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getReportSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const reports = reportsData?.reports || [];
  const totalPages = reportsData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Handle user reports and content moderation
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <Select value={reportFilter} onValueChange={setReportFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports list */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="user">User Reports</TabsTrigger>
            <TabsTrigger value="content">Content Reports</TabsTrigger>
            <TabsTrigger value="offer">Offer Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading reports...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p>Failed to load reports. Please try again later.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reported By</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No reports found. Try a different search or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report: any) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="rounded-full bg-red-100 p-1">
                                  <Flag className="h-4 w-4 text-red-500" />
                                </div>
                                <div>
                                  <p className="font-medium">{report.reason}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {report.details?.substring(0, 50)}
                                    {report.details?.length > 50 && "..."}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getReportTypeBadge(report.type)}
                                {report.severity && (
                                  <span className="ml-1">{getReportSeverityBadge(report.severity)}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{report.reportedBy?.username || 'Anonymous'}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {report.createdAt ? formatDate(report.createdAt) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(report.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewReport(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                                {report.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResolveDialog(report)}
                                  >
                                    <Shield className="h-4 w-4" />
                                    <span className="sr-only">Resolve</span>
                                  </Button>
                                )}
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
          
          {["user", "content", "offer"].map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{type} Reports</CardTitle>
                  <CardDescription>
                    Reports related to {type}s on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground capitalize">{type} reports will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* View Report Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Full information about the reported content
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Report Type</h3>
                  <div className="flex items-center gap-2">
                    {getReportTypeBadge(selectedReport.type)}
                    {selectedReport.severity && (
                      <span className="ml-1">{getReportSeverityBadge(selectedReport.severity)}</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Status</h3>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Reported By</h3>
                  <p>{selectedReport.reportedBy?.username || 'Anonymous'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Date Reported</h3>
                  <p>{selectedReport.createdAt ? formatDate(selectedReport.createdAt) : 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-1">Reason</h3>
                  <p>{selectedReport.reason}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-1">Details</h3>
                  <p className="whitespace-pre-wrap">{selectedReport.details}</p>
                </div>
                
                {selectedReport.type === 'user' && selectedReport.target && (
                  <>
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="font-semibold mb-1">Reported User</h3>
                      <p>{selectedReport.target.username}</p>
                    </div>
                  </>
                )}
                
                {selectedReport.type === 'content' && selectedReport.target && (
                  <>
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="font-semibold mb-1">Reported Content</h3>
                      <div className="p-3 border rounded-md">
                        <p className="whitespace-pre-wrap">{selectedReport.target.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted by: {selectedReport.target.creator?.username || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {selectedReport.status !== 'pending' && (
                  <>
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="font-semibold mb-1">Resolution</h3>
                      <p>
                        <Badge variant={selectedReport.resolution === 'action_taken' ? 'default' : 'outline'}>
                          {selectedReport.resolution === 'action_taken' ? 'Action Taken' : 'Dismissed'}
                        </Badge>
                      </p>
                      {selectedReport.resolutionNotes && (
                        <div className="mt-2">
                          <h3 className="font-semibold mb-1">Notes</h3>
                          <p className="whitespace-pre-wrap">{selectedReport.resolutionNotes}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedReport && selectedReport.status === 'pending' && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                handleResolveDialog(selectedReport);
              }}>
                Resolve Report
              </Button>
            )}
            <Button variant={selectedReport?.status === 'pending' ? 'outline' : 'default'} onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Report Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Take action on this report. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <form onSubmit={handleResolveReport}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <h3 className="font-semibold">Report Type: {selectedReport.type}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.reason}
                  </p>
                </div>
                <div className="grid gap-2">
                  <h3 className="font-semibold">Action</h3>
                  <Select
                    value={resolution.action}
                    onValueChange={(value) => setResolution({...resolution, action: value})}
                  >
                    <SelectTrigger id="action">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dismiss">Dismiss Report</SelectItem>
                      <SelectItem value="warning">Issue Warning</SelectItem>
                      <SelectItem value="remove_content">Remove Content</SelectItem>
                      <SelectItem value="suspend_user">Suspend User</SelectItem>
                      <SelectItem value="ban_user">Ban User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <h3 className="font-semibold">Notes</h3>
                  <Textarea
                    placeholder="Add notes about the resolution (optional)"
                    value={resolution.notes}
                    onChange={(e) => setResolution({...resolution, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant={resolution.action === 'dismiss' ? 'outline' : 'default'} disabled={resolveReportMutation.isPending}>
                  {resolveReportMutation.isPending ? "Processing..." : "Confirm Action"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReportsPage;