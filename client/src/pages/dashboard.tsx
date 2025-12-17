import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { HealthGauge } from "@/components/health-gauge";
import { RiskBadge } from "@/components/risk-badge";
import { InsightCard } from "@/components/insight-card";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { RepositorySelector } from "@/components/repository-selector";
import { 
  AlertTriangle, 
  FileCode, 
  TrendingUp, 
  Users, 
  GitPullRequest, 
  Shield,
  Activity,
  LayoutDashboard
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

const mockVelocityData = [
  { date: "Dec 1", velocity: 45, churn: 12 },
  { date: "Dec 3", velocity: 52, churn: 8 },
  { date: "Dec 5", velocity: 48, churn: 15 },
  { date: "Dec 7", velocity: 61, churn: 10 },
  { date: "Dec 9", velocity: 55, churn: 18 },
  { date: "Dec 11", velocity: 67, churn: 7 },
  { date: "Dec 13", velocity: 72, churn: 9 },
  { date: "Dec 15", velocity: 68, churn: 11 },
  { date: "Dec 17", velocity: 75, churn: 6 },
];

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<TemporalInsight[]>({
    queryKey: ["/api/dashboard/insights"],
  });

  const { data: highRiskPRs, isLoading: prsLoading } = useQuery<RiskAnalysis[]>({
    queryKey: ["/api/risk/high"],
  });

  const isLoading = metricsLoading || insightsLoading || prsLoading;

  const displayMetrics = metrics || {
    healthScore: 71,
    healthTrend: 5,
    highRiskPRs: 2,
    architectureWarnings: 3,
    velocityTrend: 12,
    activeContributors: 8,
    pendingReviews: 4,
    governanceViolations: 1,
  };

  const displayInsights: TemporalInsight[] = insights || [
    { type: "velocity", message: "Repository velocity increased 12% this week", severity: "info", trend: 12 },
    { type: "delay", message: "Average PR review time: 2.3 days (↑ from 1.8 days)", severity: "warning", trend: 28 },
    { type: "burnout", message: "Core contributor activity dropped 38% in 2 weeks", severity: "critical", trend: -38 },
  ];

  const handleSelectRepo = (owner: string, name: string) => {
    console.log("Selected repo:", owner, name);
  };

  if (!metrics && !isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Connect a repository to start analyzing
            </p>
          </div>
          <RepositorySelector onSelectRepo={handleSelectRepo} />
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time intelligence overview
          </p>
        </div>
        <RepositorySelector currentRepo="facebook/react" onSelectRepo={handleSelectRepo} />
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockVelocityData}>
                  <defs>
                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="velocity"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#velocityGradient)"
                    strokeWidth={2}
                    name="Velocity"
                  />
                  <Area
                    type="monotone"
                    dataKey="churn"
                    stroke="hsl(var(--chart-5))"
                    fill="url(#churnGradient)"
                    strokeWidth={2}
                    name="Churn"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Temporal Insights
          </h3>
          {displayInsights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
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
            {[
              { number: 1234, title: "Major API refactoring", risk: 85, author: "johndoe" },
              { number: 1245, title: "Database migration v3", risk: 78, author: "janedoe" },
            ].map((pr) => (
              <div 
                key={pr.number} 
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                data-testid={`dashboard-pr-${pr.number}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{pr.number}</span>
                    <span className="font-medium truncate">{pr.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">by @{pr.author}</span>
                </div>
                <RiskBadge score={pr.risk} size="sm" />
              </div>
            ))}
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
            {[
              { rule: "PR Size Limit", status: "passing", details: "Max 500 lines" },
              { rule: "Required Reviewers", status: "passing", details: "Min 2 reviewers" },
              { rule: "Test Coverage", status: "warning", details: "78% (min 80%)" },
              { rule: "Commit Message", status: "passing", details: "Conventional commits" },
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
              >
                <div className="flex-1">
                  <span className="font-medium">{item.rule}</span>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  item.status === "passing" 
                    ? "bg-green-500" 
                    : item.status === "warning" 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
                }`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
