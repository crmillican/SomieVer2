import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, AlertTriangle, Star, Activity, Users, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricHistoryEntry {
  date: string;
  value: number;
  reason?: string;
}

export default function MetricsDetail() {
  const [location] = useLocation();
  const metricType = location.split("/").pop(); // e.g., "credibility" or "strikes"

  const { data: metricHistory } = useQuery<MetricHistoryEntry[]>({
    queryKey: [`/api/metrics/${metricType}/history`],
  });

  const getMetricInfo = () => {
    switch (metricType) {
      case "credibility":
        return {
          title: "Credibility Score History",
          description: "Your credibility score is calculated based on successful campaign completions, post authenticity, and engagement metrics.",
          icon: Star,
          color: "text-yellow-500",
        };
      case "strikes":
        return {
          title: "Account Strikes History",
          description: "Strikes are issued for policy violations, missed deadlines, or failed post verifications.",
          icon: AlertTriangle,
          color: "text-red-500",
        };
      case "engagement":
        return {
          title: "Engagement Rate History",
          description: "Your engagement rate is calculated as (likes + comments) / followers * 100.",
          icon: Activity,
          color: "text-blue-500",
        };
      case "claims":
        return {
          title: "Offer Claims History",
          description: "Track the number of times your offers have been claimed by influencers.",
          icon: Users,
          color: "text-green-500",
        };
      case "campaigns":
        return {
          title: "Active Campaigns History",
          description: "Monitor your active promotional campaigns over time.",
          icon: BarChart3,
          color: "text-purple-500",
        };
      default:
        return {
          title: "Metric History",
          description: "Detailed history of your account metrics",
          icon: TrendingUp,
          color: "text-green-500",
        };
    }
  };

  const info = getMetricInfo();
  const Icon = info.icon;

  // Generate mock data if no real data is available yet
  const mockData = !metricHistory ? Array.from({ length: 10 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    value: Math.floor(Math.random() * (metricType === 'strikes' ? 3 : 100)),
    reason: `Sample ${info.title} update ${i + 1}`,
  })).reverse() : metricHistory;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${info.color}`} />
          <h1 className="text-3xl font-bold">{info.title}</h1>
        </div>
        <p className="text-muted-foreground mt-2">{info.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [value, info.title.split(" ")[0]]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">History Log</h2>
        <div className="space-y-4">
          {mockData.map((entry, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <div className="font-medium">{entry.reason}</div>
                  </div>
                  <div className="text-xl font-bold">{entry.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}