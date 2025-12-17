import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/metric-card";
import { RiskBadge } from "@/components/risk-badge";
import { 
  GitPullRequest, 
  AlertCircle, 
  Clock, 
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Hourglass,
  Calendar
} from "lucide-react";
import type { SprintAnalysis } from "@shared/schema";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const mockSprintData: SprintAnalysis = {
  id: "1",
  repositoryId: "repo1",
  sprintName: "Sprint 24 - Q4 Release",
  riskLevel: "high",
  blockerCount: 2,
  unreviewedPRs: 4,
  idleIssues: 3,
  predictedCompletion: 72,
  insights: [
    "2 critical PRs blocked pending review for 3+ days",
    "Core maintainer @johndoe on PTO until Dec 20",
    "3 issues idle for 6+ days without assignment",
    "Velocity trending 18% below sprint average",
  ],
  recommendations: [
    "Prioritize PR #1234 and #1245 review immediately",
    "Redistribute @johndoe's tasks to available reviewers",
    "Triage idle issues and reassign or move to backlog",
    "Consider scope reduction for sprint completion",
  ],
  createdAt: new Date(),
};

const issueStatusData = [
  { name: "Completed", value: 12, color: "hsl(var(--chart-2))" },
  { name: "In Progress", value: 8, color: "hsl(var(--chart-1))" },
  { name: "Blocked", value: 2, color: "hsl(var(--chart-5))" },
  { name: "To Do", value: 5, color: "hsl(var(--chart-4))" },
];

const prStatusData = [
  { name: "Merged", value: 15, color: "hsl(var(--chart-2))" },
  { name: "In Review", value: 6, color: "hsl(var(--chart-3))" },
  { name: "Changes Requested", value: 3, color: "hsl(var(--chart-4))" },
  { name: "Draft", value: 2, color: "hsl(var(--muted))" },
];

const blockers = [
  { id: 1, type: "PR", number: 1234, title: "Major API refactoring", daysBlocked: 4, reason: "Awaiting core team review" },
  { id: 2, type: "Issue", number: 567, title: "Database migration blocked", daysBlocked: 6, reason: "Dependency on external team" },
];

const unreviewedPRs = [
  { number: 1234, title: "feat: Major API refactoring", author: "johndoe", age: "4 days" },
  { number: 1267, title: "fix: Critical auth bug", author: "security", age: "2 days" },
  { number: 1278, title: "chore: Update dependencies", author: "dependabot", age: "1 day" },
  { number: 1289, title: "feat: New dashboard widgets", author: "frontend_dev", age: "3 hours" },
];

export default function SprintPage() {
  const { data: sprintAnalysis, isLoading } = useQuery<SprintAnalysis>({
    queryKey: ["/api/sprint/current"],
  });

  const sprint = sprintAnalysis || mockSprintData;

  const getRiskColor = () => {
    switch (sprint.riskLevel) {
      case "critical": return "text-red-500 bg-red-500/10 border-red-500/30";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      default: return "text-green-500 bg-green-500/10 border-green-500/30";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sprint Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered sprint analysis and risk prediction
          </p>
        </div>
        <div className={`px-4 py-2 rounded-md border ${getRiskColor()}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Sprint Risk: {sprint.riskLevel?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <Card className="overflow-visible">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {sprint.sprintName}
            </CardTitle>
            <Badge variant="secondary" className="font-mono">
              {(sprint.predictedCompletion || 0).toFixed(0)}% Predicted Completion
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={sprint.predictedCompletion || 0} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>Target: 100%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Blockers"
          value={sprint.blockerCount || 0}
          variant={(sprint.blockerCount || 0) > 0 ? "danger" : "default"}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
        />
        <MetricCard
          title="Unreviewed PRs"
          value={sprint.unreviewedPRs || 0}
          variant={(sprint.unreviewedPRs || 0) > 2 ? "warning" : "default"}
          icon={<GitPullRequest className="w-5 h-5 text-orange-500" />}
        />
        <MetricCard
          title="Idle Issues"
          value={sprint.idleIssues || 0}
          icon={<Hourglass className="w-5 h-5 text-yellow-500" />}
        />
        <MetricCard
          title="Days Remaining"
          value={5}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Issue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {issueStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5" />
              PR Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {prStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              Blockers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blockers.map((blocker) => (
              <div 
                key={blocker.id}
                className="p-3 rounded-md bg-red-500/5 border border-red-500/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {blocker.type} #{blocker.number}
                      </Badge>
                      <span className="font-medium">{blocker.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{blocker.reason}</p>
                  </div>
                  <Badge variant="destructive" className="font-mono">
                    {blocker.daysBlocked}d blocked
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-visible border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <GitPullRequest className="w-5 h-5" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreviewedPRs.map((pr) => (
              <div 
                key={pr.number}
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-orange-500/5 border border-orange-500/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{pr.number}
                    </span>
                    <span className="font-medium truncate">{pr.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">by @{pr.author}</p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {pr.age}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(sprint.insights as string[] || []).map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(sprint.recommendations as string[] || []).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
