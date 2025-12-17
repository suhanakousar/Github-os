import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { createRepoQueryFn } from "@/lib/api-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { InsightCard } from "@/components/insight-card";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Clock, 
  GitCommit,
  Users,
  Zap,
  Calendar
} from "lucide-react";
import type { TemporalInsight } from "@shared/schema";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TemporalMetricsResponse {
  metrics: Array<{
    id: string;
    metricDate: string;
    velocity: number;
    codeChurn: number;
    prReviewTime: number;
    commitFrequency: number;
    contributorActivity: number;
  }>;
  velocityData: Array<{ week: string; velocity: number; commits: number; prs: number }>;
  churnData: Array<{ day: string; additions: number; deletions: number }>;
  reviewTimeData: Array<{ week: string; avgTime: number; p90Time: number }>;
  contributorActivityData: Array<{ week: string; active: number; new: number; churned: number }>;
  insights: TemporalInsight[];
  summary: {
    weeklyVelocity: number;
    avgReviewTime: number;
    commitFrequency: number;
    activeContributors: number;
  } | null;
}

export default function TemporalPage() {
  const { selectedRepoId } = useRepository();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: temporalData, isLoading, refetch } = useQuery<TemporalMetricsResponse>({
    queryKey: ["/api/temporal/metrics", selectedRepoId],
    queryFn: createRepoQueryFn<TemporalMetricsResponse>("/api/temporal/metrics", selectedRepoId),
    enabled: !!selectedRepoId,
    refetchInterval: 5000, // Auto-refetch every 5 seconds
  });

  const handleRefresh = async () => {
    if (!selectedRepoId) {
      toast({
        title: "No repository selected",
        description: "Please select a repository first",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Refreshing temporal metrics",
        description: "Fetching data from GitHub... This may take a moment.",
      });

      const response = await fetch(`/api/temporal/populate?repositoryId=${selectedRepoId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger population");
      }
      
      // Poll for data
      let attempts = 0;
      const maxAttempts = 12;
      const pollInterval = setInterval(async () => {
        attempts++;
        const result = await refetch();
        const currentData = result.data;
        
        if (currentData && currentData.summary && currentData.metrics.length > 0 || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (currentData && currentData.summary && currentData.metrics.length > 0) {
            toast({
              title: "Success",
              description: `Temporal metrics populated with ${currentData.metrics.length} weeks of data`,
            });
          } else if (attempts >= maxAttempts) {
            toast({
              title: "Still loading",
              description: "Data is being fetched. Please wait a bit longer and try refreshing again.",
            });
          }
        }
      }, 5000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh temporal metrics",
        variant: "destructive",
      });
    }
  };

  if (!selectedRepoId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Calendar}
          title="No repository selected"
          description="Please select a repository from the dashboard to view temporal intelligence."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!temporalData || !temporalData.summary || temporalData.metrics.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Temporal Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              Time-aware analysis of repository evolution and patterns
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={!selectedRepoId || isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <EmptyState
          icon={Calendar}
          title="No temporal data"
          description="Click 'Refresh' to fetch temporal metrics from GitHub. This may take a moment."
        />
      </div>
    );
  }

  const { velocityData, churnData, reviewTimeData, contributorActivityData, insights, summary } = temporalData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Temporal Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Time-aware analysis of repository evolution and patterns
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={!selectedRepoId || isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Weekly Velocity"
          value={Math.round(summary.weeklyVelocity)}
          trend={velocityData.length >= 2 
            ? Math.round(((velocityData[velocityData.length - 1]?.velocity || 0) - (velocityData[velocityData.length - 2]?.velocity || 0)) / (velocityData[velocityData.length - 2]?.velocity || 1) * 100)
            : 0}
          trendLabel="vs last week"
          icon={<Activity className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard
          title="Avg Review Time"
          value={`${Math.round(summary.avgReviewTime)}h`}
          trend={reviewTimeData.length >= 2
            ? Math.round(((reviewTimeData[reviewTimeData.length - 1]?.avgTime || 0) - (reviewTimeData[reviewTimeData.length - 2]?.avgTime || 0)) / (reviewTimeData[reviewTimeData.length - 2]?.avgTime || 1) * 100)
            : 0}
          trendLabel={reviewTimeData.length >= 2 && (reviewTimeData[reviewTimeData.length - 1]?.avgTime || 0) < (reviewTimeData[reviewTimeData.length - 2]?.avgTime || 0) ? "improvement" : "change"}
          icon={<Clock className="w-5 h-5 text-green-500" />}
        />
        <MetricCard
          title="Commit Frequency"
          value={summary.commitFrequency}
          trend={velocityData.length >= 2
            ? Math.round(((velocityData[velocityData.length - 1]?.commits || 0) - (velocityData[velocityData.length - 2]?.commits || 0)) / (velocityData[velocityData.length - 2]?.commits || 1) * 100)
            : 0}
          icon={<GitCommit className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="Active Contributors"
          value={summary.activeContributors}
          trend={contributorActivityData.length >= 2
            ? Math.round(((contributorActivityData[contributorActivityData.length - 1]?.active || 0) - (contributorActivityData[contributorActivityData.length - 2]?.active || 0)) / (contributorActivityData[contributorActivityData.length - 2]?.active || 1) * 100)
            : 0}
          icon={<Users className="w-5 h-5 text-orange-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Velocity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityData.length > 0 ? velocityData : [{ week: "W1", velocity: 0, commits: 0, prs: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="velocity" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                    name="Velocity Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commits" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                    name="Commits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Code Churn (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnData.length > 0 ? churnData : [{ day: "Mon", additions: 0, deletions: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="additions" 
                    fill="hsl(var(--chart-2))" 
                    name="Additions"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="deletions" 
                    fill="hsl(var(--chart-5))" 
                    name="Deletions"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              PR Review Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reviewTimeData.length > 0 ? reviewTimeData : [{ week: "W1", avgTime: 0, p90Time: 0 }]}>
                  <defs>
                    <linearGradient id="avgTimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    label={{ 
                      value: 'Hours', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avgTime"
                    stroke="hsl(var(--chart-3))"
                    fill="url(#avgTimeGradient)"
                    strokeWidth={2}
                    name="Avg Time (hours)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p90Time" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="P90 Time"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contributor Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributorActivityData.length > 0 ? contributorActivityData : [{ week: "W1", active: 0, new: 0, churned: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="active" 
                    fill="hsl(var(--chart-1))" 
                    name="Active"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="new" 
                    fill="hsl(var(--chart-2))" 
                    name="New"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="churned" 
                    fill="hsl(var(--chart-5))" 
                    name="Churned"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Temporal Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))
          ) : (
            <div className="col-span-2 text-center text-muted-foreground py-8">
              No insights available yet. Temporal metrics are still being calculated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
