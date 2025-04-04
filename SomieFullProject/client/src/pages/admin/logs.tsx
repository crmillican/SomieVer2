import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Eye, Clock, Calendar, List } from "lucide-react";
import { format } from "date-fns";

const LogsPage = () => {
  const [page, setPage] = useState(1);
  const [logFilter, setLogFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch logs
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/logs", logFilter, timeFilter, page, searchQuery],
    retry: false,
  });

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge variant="default">Create</Badge>;
      case 'update':
        return <Badge variant="secondary">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      case 'login':
        return <Badge variant="outline">Login</Badge>;
      case 'approve':
        return <Badge variant="success">Approve</Badge>;
      case 'reject':
        return <Badge variant="warning">Reject</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const logs = logsData?.logs || [];
  const totalPages = logsData?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Activity and audit log history
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <Select value={logFilter} onValueChange={setLogFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="approve">Approval</SelectItem>
              <SelectItem value="reject">Rejection</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs list */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Logs</TabsTrigger>
            <TabsTrigger value="user">User Actions</TabsTrigger>
            <TabsTrigger value="content">Content Changes</TabsTrigger>
            <TabsTrigger value="system">System Events</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading logs...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p>Failed to load logs. Please try again later.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead className="hidden md:table-cell">Date & Time</TableHead>
                        <TableHead className="text-right">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No logs found. Try a different search or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getActionBadge(log.action)}
                              </div>
                            </TableCell>
                            <TableCell>{log.adminUsername}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.resourceType}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {`ID: ${log.resourceId}`}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center">
                                <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                                <span>{log.createdAt ? formatDate(log.createdAt) : 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
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
          
          {["user", "content", "system"].map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{type} Logs</CardTitle>
                  <CardDescription>
                    Activity logs related to {type === "user" ? "user management" : 
                                             type === "content" ? "content moderation" : 
                                             "system changes"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground capitalize">{type} logs will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* View Log Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Action</h3>
                  {getActionBadge(selectedLog.action)}
                </div>
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">Admin</h3>
                <p>{selectedLog.adminUsername}</p>
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">Resource</h3>
                <p>{`${selectedLog.resourceType} (ID: ${selectedLog.resourceId})`}</p>
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">Time</h3>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{selectedLog.createdAt ? formatDate(selectedLog.createdAt) : 'N/A'}</span>
                </div>
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">IP Address</h3>
                <p>{selectedLog.ipAddress || 'Not recorded'}</p>
              </div>
              {selectedLog.details && (
                <div className="grid gap-1">
                  <h3 className="font-semibold">Details</h3>
                  <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
                    <pre className="text-xs whitespace-pre-wrap">
                      {typeof selectedLog.details === 'string' 
                        ? selectedLog.details 
                        : JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default LogsPage;