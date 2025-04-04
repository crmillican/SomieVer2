import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle, FileText,
  Calendar, ArrowUpRight, BarChart3, PieChart as PieChartIcon, Activity
} from "lucide-react";

export default function AdminDashboard() {
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
    retry: false,
  });
  
  // Fetch activity data
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/activity"],
    retry: false,
  });

  // Colors for charts
  const colors = {
    primary: "#0090ff",
    secondary: "#6c5ce7",
    success: "#00b894",
    warning: "#fdcb6e",
    danger: "#ff6b6b",
    neutral: "#a0aec0"
  };

  // Generate a formatted date for last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  };

  // Sample data for charts when API data is not available
  const userStats = statsData?.users ? {
    total: statsData.users.total,
    growth: statsData.users.growth,
    distribution: statsData.users.distribution
  } : {
    total: 0,
    growth: 0,
    distribution: []
  };

  const signupStats = statsData?.signups ? {
    total: statsData.signups.total,
    growth: statsData.signups.growth,
    data: statsData.signups.data
  } : {
    total: 0,
    growth: 0,
    data: getLast7Days().map(day => ({ date: day, count: 0 }))
  };

  const offerStats = statsData?.offers ? {
    total: statsData.offers.total,
    growth: statsData.offers.growth,
    data: statsData.offers.data
  } : {
    total: 0,
    growth: 0,
    data: []
  };

  const reportStats = statsData?.reports ? {
    total: statsData.reports.total,
    growth: statsData.reports.growth,
    data: statsData.reports.data
  } : {
    total: 0,
    growth: 0,
    data: []
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of platform statistics and activity
          </p>
        </div>

        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-7 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {userStats.growth >= 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                      <span className="text-success">+{userStats.growth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-danger transform rotate-90" />
                      <span className="text-danger">{userStats.growth}%</span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signupStats.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {signupStats.growth >= 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                      <span className="text-success">+{signupStats.growth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-danger transform rotate-90" />
                      <span className="text-danger">{signupStats.growth}%</span>
                    </>
                  )}
                  <span className="ml-1">from last week</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{offerStats.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {offerStats.growth >= 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                      <span className="text-success">+{offerStats.growth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-danger transform rotate-90" />
                      <span className="text-danger">{offerStats.growth}%</span>
                    </>
                  )}
                  <span className="ml-1">from last week</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportStats.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {reportStats.growth >= 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-danger" />
                      <span className="text-danger">+{reportStats.growth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-success transform rotate-90" />
                      <span className="text-success">{reportStats.growth}%</span>
                    </>
                  )}
                  <span className="ml-1">from last week</span>
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              User Stats
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center">
              <PieChartIcon className="mr-2 h-4 w-4" />
              Content Stats
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Signups Over Time</CardTitle>
                  <CardDescription>
                    New user registrations for the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={signupStats.data}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={colors.primary}
                          fill={colors.primary}
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of user roles across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userStats.distribution.length > 0 ? userStats.distribution : [
                            { name: 'Influencers', value: 65 },
                            { name: 'Businesses', value: 30 },
                            { name: 'Admins', value: 5 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            colors.primary,
                            colors.secondary,
                            colors.success,
                            colors.warning,
                            colors.danger
                          ].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions performed on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center space-x-4 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                ) : activityData?.activities?.length > 0 ? (
                  <div className="space-y-5">
                    {activityData.activities.map((activity: any, i: number) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'create' ? 'bg-green-100 text-green-600' :
                          activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'delete' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.type === 'create' ? <CheckCircle className="h-5 w-5" /> :
                           activity.type === 'update' ? <Activity className="h-5 w-5" /> :
                           activity.type === 'delete' ? <AlertTriangle className="h-5 w-5" /> :
                           <Calendar className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.message}</p>
                          <p className="text-sm text-muted-foreground">{activity.user}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No recent activity found</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto">
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  Monthly user signups over time
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: 'Jan', count: 120 },
                        { month: 'Feb', count: 150 },
                        { month: 'Mar', count: 180 },
                        { month: 'Apr', count: 220 },
                        { month: 'May', count: 300 },
                        { month: 'Jun', count: 380 }
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Users" fill={colors.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Offers by Category</CardTitle>
                  <CardDescription>
                    Distribution of offers across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Fashion', value: 35 },
                            { name: 'Tech', value: 25 },
                            { name: 'Beauty', value: 20 },
                            { name: 'Food', value: 15 },
                            { name: 'Travel', value: 5 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            colors.primary,
                            colors.secondary,
                            colors.success,
                            colors.warning,
                            colors.danger
                          ].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Content Performance</CardTitle>
                  <CardDescription>
                    Engagement rates by content type
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { type: 'Photo', rate: 4.2 },
                          { type: 'Video', rate: 6.8 },
                          { type: 'Story', rate: 3.7 },
                          { type: 'Reel', rate: 8.1 },
                          { type: 'Live', rate: 5.4 }
                        ]}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="type" />
                        <YAxis label={{ value: 'Engagement Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="rate" name="Engagement Rate %" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}