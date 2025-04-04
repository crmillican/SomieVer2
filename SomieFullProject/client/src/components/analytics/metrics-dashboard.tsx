import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MetricInfo } from "@/components/ui/metric-info";
import { AreaChart, Area } from 'recharts';
import { ChevronUp, TrendingUp, DollarSign, Users, Award, Target, BarChart3, Activity, MapPin, UserCircle, PercentCircle, Heart } from 'lucide-react';

interface MetricsDashboardProps {
  userType: 'business' | 'influencer';
  metrics: {
    totalEngagements: number;
    successfulEngagements: number;
    pendingEngagements: number;
    totalIncentives: number; // For influencers: earned, For businesses: spent
    avgEngagementRate: number;
    audienceReach: number; // For influencers: own audience, For businesses: cumulative influencer reach
    engagementMilestones: { 
      completed: number; 
      inProgress: number; 
      upcoming: number; 
    };
    topPerformingContent?: string[];
    historyData: {
      engagementHistory: Array<{ date: string; count: number }>;
      incentiveHistory: Array<{ date: string; value: number }>;
      successRateHistory: Array<{ date: string; rate: number }>;
    };
    categoryBreakdown: Array<{ name: string; value: number; color: string }>;
    audienceDemographics?: {
      location: string;
      age: {
        [key: string]: number;
      };
      gender: {
        [key: string]: number;
      };
      topLocations: Array<{ name: string; percentage: number }>;
      interests: Array<{ name: string; percentage: number }>;
    };
  };
}

export function MetricsDashboard({ userType, metrics }: MetricsDashboardProps) {
  const {
    totalEngagements,
    successfulEngagements,
    pendingEngagements,
    totalIncentives,
    avgEngagementRate,
    audienceReach,
    engagementMilestones,
    historyData,
    categoryBreakdown,
    audienceDemographics
  } = metrics;

  const successRate = totalEngagements > 0 
    ? Math.round((successfulEngagements / totalEngagements) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Key Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Engagements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagements}</div>
            <p className="text-xs text-muted-foreground">
              {successRate}% success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {userType === 'business' ? 'Total Spent' : 'Total Earned'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncentives.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ChevronUp className="h-3 w-3 mr-1" /> 
                {Math.round(totalIncentives / Math.max(totalEngagements, 1))}
              </span>{" "}
              per engagement
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 
                0.8%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audience Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audienceReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total potential impressions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Engagement Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
                <CardDescription>Monthly engagement activity</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={historyData.engagementHistory} 
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#colorEngagement)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} engagements`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Incentives Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {userType === 'business' ? 'Spending' : 'Earnings'} Over Time
                </CardTitle>
                <CardDescription>Monthly financial activity</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={historyData.incentiveHistory} 
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Success Rate Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Success Rate Over Time</CardTitle>
                <CardDescription>Monthly success rate evolution</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={historyData.successRateHistory} 
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#8b5cf6" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Status</CardTitle>
                <CardDescription>Current state of all engagements</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Successful', value: successfulEngagements, color: '#10b981' },
                      { name: 'Pending', value: pendingEngagements, color: '#f59e0b' },
                      { name: 'Failed', value: totalEngagements - successfulEngagements - pendingEngagements, color: '#ef4444' }
                    ]}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} engagements`, 'Count']} />
                    <Bar dataKey="value" fill="#8884d8">
                      {[
                        { name: 'Successful', value: successfulEngagements, color: '#10b981' },
                        { name: 'Pending', value: pendingEngagements, color: '#f59e0b' },
                        { name: 'Failed', value: totalEngagements - successfulEngagements - pendingEngagements, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <MetricInfo 
                    label="Success Rate" 
                    value={`${successRate}%`} 
                    tooltip="Percentage of successful engagements out of total"
                  />
                  <MetricInfo 
                    label="Average Value" 
                    value={`$${Math.round(totalIncentives / Math.max(totalEngagements, 1))}`} 
                    tooltip={userType === 'business' ? "Average spending per engagement" : "Average earnings per engagement"}
                  />
                  <MetricInfo 
                    label="Engagement Efficiency" 
                    value={`${Math.min(Math.round((successfulEngagements / Math.max(totalEngagements, 1)) * 100 + avgEngagementRate), 100)}%`} 
                    tooltip="Combined metric of success rate and engagement rate"
                  />
                </div>
              </CardContent>
            </Card>
            
            {userType === 'influencer' && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Content</CardTitle>
                  <CardDescription>Your best engaging content</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {metrics.topPerformingContent?.map((content, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                        <span className="text-sm">{content}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {userType === 'business' && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                  <CardDescription>Your most successful campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {metrics.topPerformingContent?.map((content, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Target className="h-5 w-5 text-amber-500 mt-0.5" />
                        <span className="text-sm">{content}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="audience" className="space-y-4">
          {audienceDemographics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audience Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                    Audience Location
                  </CardTitle>
                  <CardDescription>Primary location: {audienceDemographics.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Top Locations</h4>
                    <div className="space-y-3">
                      {audienceDemographics.topLocations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-orange-500'} mr-2`}></div>
                            <span className="text-sm">{location.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{location.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 text-xs text-gray-500">
                      Most of your audience is located in {audienceDemographics.topLocations[0]?.name || audienceDemographics.location}.
                      Businesses in these areas are more likely to want to collaborate with you.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCircle className="h-5 w-5 mr-2 text-purple-500" />
                    Audience Demographics
                  </CardTitle>
                  <CardDescription>Age and gender breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Age Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(audienceDemographics.age).map(([range, value], index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{range}</span>
                            <span>{value}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className="bg-purple-500 h-1.5 rounded-full" 
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Gender</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(audienceDemographics.gender).map(([gender, value], index) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded-md">
                          <div className="text-lg font-bold">{value}%</div>
                          <div className="text-xs text-gray-500 capitalize">{gender}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience Interests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Audience Interests
                  </CardTitle>
                  <CardDescription>What your audience cares about</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {audienceDemographics.interests.map((interest, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{interest.name}</span>
                            <span>{interest.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full`}
                              style={{ 
                                width: `${interest.percentage}%`,
                                backgroundColor: index === 0 ? '#f43f5e' : 
                                                index === 1 ? '#ec4899' : 
                                                index === 2 ? '#8b5cf6' :
                                                index === 3 ? '#3b82f6' : '#10b981'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 text-xs text-gray-500">
                      Your audience is most interested in {audienceDemographics.interests[0]?.name}. 
                      Consider partnering with brands in this category for higher engagement.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience Engagement Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PercentCircle className="h-5 w-5 mr-2 text-green-500" />
                    Engagement Analysis
                  </CardTitle>
                  <CardDescription>How your audience interacts with your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <MetricInfo 
                      label="Engagement Rate" 
                      value={`${avgEngagementRate}%`} 
                      tooltip="Average percentage of followers who engage with your content"
                    />
                    <MetricInfo 
                      label="Primary Audience" 
                      value={`${audienceDemographics.age ? Object.entries(audienceDemographics.age).sort((a, b) => b[1] - a[1])[0][0] : '18-24'}`} 
                      tooltip="Age group that engages most with your content"
                    />
                    <MetricInfo 
                      label="Top Location" 
                      value={audienceDemographics.topLocations[0]?.name || audienceDemographics.location}
                      tooltip="Location with the highest concentration of your audience"
                    />
                    <p className="text-xs text-gray-500 mt-4">
                      Your engagement is {avgEngagementRate > 3 ? 'above' : 'below'} the industry average of 3%. 
                      {avgEngagementRate > 3 
                        ? ' This makes your profile more attractive to potential business partners.'
                        : ' Consider posting more content related to your audience\'s interests to improve engagement.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-60">
                <UserCircle className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">No audience data available</p>
                <p className="text-sm text-gray-400">
                  Complete your profile with location and niche information
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Milestones</CardTitle>
                <CardDescription>Progress towards campaign goals</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Completed', value: engagementMilestones.completed, color: '#10b981' },
                      { name: 'In Progress', value: engagementMilestones.inProgress, color: '#f59e0b' },
                      { name: 'Upcoming', value: engagementMilestones.upcoming, color: '#94a3b8' }
                    ]}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value) => [`${value} milestones`, 'Count']} />
                    <Bar dataKey="value" fill="#8884d8" barSize={30}>
                      {[
                        { name: 'Completed', value: engagementMilestones.completed, color: '#10b981' },
                        { name: 'In Progress', value: engagementMilestones.inProgress, color: '#f59e0b' },
                        { name: 'Upcoming', value: engagementMilestones.upcoming, color: '#94a3b8' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}