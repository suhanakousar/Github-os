import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/metric-card";
import { HealthGauge } from "@/components/health-gauge";
import { RiskBadge } from "@/components/risk-badge";
import { InsightCard } from "@/components/insight-card";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { GitHubRepoSelector } from "@/components/github-repo-selector";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  FileCode, 
  TrendingUp, 
  Users, 
  GitPullRequest, 
  Shield,
  Activity,
  LayoutDashboard,
  Database
} from "lucide-react";
import type { DashboardMetrics, TemporalInsight, RiskAnalysis } from "@shared/schema";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Velocity data will be fetched from API

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedRepoId, currentRepoName, setSelectedRepo } = useRepository();

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics", selectedRepoId],
    queryFn: async () => {
      const url = selectedRepoId 
        ? `/api/dashboard/metrics?repositoryId=${selectedRepoId}`
        : "/api/dashboard/metrics";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    enabled: !!selectedRepoId, // Only fetch when a repo is selected
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<TemporalInsight[]>({
    queryKey: ["/api/dashboard/insights", selectedRepoId],
    queryFn: async () => {
      const url = selectedRepoId 
        ? `/api/dashboard/insights?repositoryId=${selectedRepoId}`
        : "/api/dashboard/insights";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    enabled: !!selectedRepoId,
  });

  const { data: highRiskPRs, isLoading: prsLoading } = useQuery<RiskAnalysis[]>({
    queryKey: ["/api/risk/high", selectedRepoId],
    queryFn: async () => {
      const url = selectedRepoId 
        ? `/api/risk/high?repositoryId=${selectedRepoId}`
        : "/api/risk/high";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch high risk PRs");
      return res.json();
    },
    enabled: !!selectedRepoId,
  });

  const createRepoMutation = useMutation({
    mutationFn: async ({ owner, name }: { owner: string; name: string }) => {
      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name }),
      });
      if (!response.ok) {
        let errorMessage = "Failed to create repository";
        try {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            console.error("Server error text:", text);
            errorMessage = text || response.statusText || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
        }
        console.error("Throwing error:", errorMessage);
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedRepo(data.id, data.fullName);
      toast({
        title: "Repository connected",
        description: `Successfully connected ${data.fullName}`,
      });
      // Refetch all queries with the new repository ID
      queryClient.refetchQueries({ queryKey: ["/api/dashboard/metrics", data.id] });
      queryClient.refetchQueries({ queryKey: ["/api/dashboard/insights", data.id] });
      queryClient.refetchQueries({ queryKey: ["/api/risk/high", data.id] });
      // Invalidate all other queries to refetch with new repo ID
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect repository",
        variant: "destructive",
      });
    },
  });

  const isLoading = metricsLoading || insightsLoading || prsLoading || createRepoMutation.isPending;

  const displayMetrics = metrics;
  const displayInsights: TemporalInsight[] = insights || [];

  const handleSelectRepo = async (owner: string, name: string) => {
    await createRepoMutation.mutateAsync({ owner, name });
  };

  const generateMockDataMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRepoId) throw new Error("No repository selected");
      const response = await fetch(`/api/mock-data/generate?repositoryId=${selectedRepoId}`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate mock data");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mock data generated",
        description: "Mock data has been created for all pages. Refreshing data...",
      });
      // Invalidate and refetch all queries
      queryClient.invalidateQueries();
      // Force refetch all queries after a short delay to ensure data is available
      setTimeout(() => {
        queryClient.refetchQueries();
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate mock data",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Connect a repository to start analyzing
            </p>
          </div>
          <GitHubRepoSelector 
            currentRepo={currentRepoName} 
            onSelectRepo={handleSelectRepo}
            isLoading={createRepoMutation.isPending}
          />
        </div>
        <EmptyState
          icon={LayoutDashboard}
          title="No repository connected"
          description="Connect a GitHub repository to see health metrics, risk analysis, and intelligent insights."
          actionLabel="Connect Repository"
          onAction={() => {}}
        />
      </div>
    );
  }

  // At this point, metrics is guaranteed to be defined
  if (!displayMetrics) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time intelligence overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRepoId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMockDataMutation.mutate()}
              disabled={generateMockDataMutation.isPending}
              title="Generate mock data for demonstration"
            >
              <Database className="w-4 h-4 mr-2" />
              Generate Mock Data
            </Button>
          )}
          <GitHubRepoSelector 
            currentRepo={currentRepoName} 
            onSelectRepo={handleSelectRepo}
            isLoading={createRepoMutation.isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Repository Health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <HealthGauge score={displayMetrics.healthScore} size="lg" />
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-mono">+{displayMetrics.healthTrend}%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="High Risk PRs"
            value={displayMetrics.highRiskPRs}
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
            variant={displayMetrics.highRiskPRs > 0 ? "warning" : "default"}
          />
          <MetricCard
            title="Architecture Warnings"
            value={displayMetrics.architectureWarnings}
            icon={<FileCode className="w-5 h-5 text-yellow-500" />}
            variant={displayMetrics.architectureWarnings > 2 ? "warning" : "default"}
          />
          <MetricCard
            title="Active Contributors"
            value={displayMetrics.activeContributors}
            trend={8}
            trendLabel="this month"
            icon={<Users className="w-5 h-5 text-blue-500" />}
          />
          <MetricCard
            title="Pending Reviews"
            value={displayMetrics.pendingReviews}
            icon={<GitPullRequest className="w-5 h-5 text-purple-500" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Velocity & Churn Trends
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">Last 2 weeks</span>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="No velocity data"
              description="Velocity and churn data will appear here once repository activity is tracked."
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Temporal Insights
          </h3>
          {displayInsights.length > 0 ? (
            displayInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))
          ) : (
            <EmptyState
              icon={Activity}
              title="No insights yet"
              description="Temporal insights will appear here as repository activity is analyzed."
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                High Risk Pull Requests
              </CardTitle>
              <RiskBadge score={82} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {highRiskPRs && highRiskPRs.length > 0 ? (
              highRiskPRs.slice(0, 5).map((pr) => (
                <div 
                  key={pr.id} 
                  className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                  data-testid={`dashboard-pr-${pr.prNumber}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{pr.prNumber}</span>
                      <span className="font-medium truncate">{pr.explanation || `PR #${pr.prNumber}`}</span>
                    </div>
                  </div>
                  <RiskBadge score={pr.overallRisk} size="sm" />
                </div>
              ))
            ) : (
              <EmptyState
                icon={GitPullRequest}
                title="No high risk PRs"
                description="All pull requests are within acceptable risk levels."
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Governance Status
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {displayMetrics.governanceViolations} violation(s)
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayMetrics && displayMetrics.governanceViolations > 0 ? (
              <EmptyState
                icon={Shield}
                title="Governance rules active"
                description={`${displayMetrics.governanceViolations} violation(s) detected. Check the Governance page for details.`}
              />
            ) : (
              <EmptyState
                icon={Shield}
                title="No governance violations"
                description="All governance rules are passing."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
