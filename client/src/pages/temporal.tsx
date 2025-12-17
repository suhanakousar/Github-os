import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { InsightCard } from "@/components/insight-card";
import { LoadingSkeleton } from "@/components/loading-skeleton";
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

const velocityData = [
  { week: "W1", velocity: 45, commits: 32, prs: 8 },
  { week: "W2", velocity: 52, commits: 41, prs: 12 },
  { week: "W3", velocity: 48, commits: 38, prs: 10 },
  { week: "W4", velocity: 61, commits: 52, prs: 15 },
  { week: "W5", velocity: 55, commits: 45, prs: 11 },
  { week: "W6", velocity: 67, commits: 58, prs: 14 },
  { week: "W7", velocity: 72, commits: 65, prs: 18 },
  { week: "W8", velocity: 68, commits: 61, prs: 16 },
];

const churnData = [
  { day: "Mon", additions: 450, deletions: 120 },
  { day: "Tue", additions: 680, deletions: 280 },
  { day: "Wed", additions: 520, deletions: 180 },
  { day: "Thu", additions: 890, deletions: 420 },
  { day: "Fri", additions: 340, deletions: 90 },
  { day: "Sat", additions: 120, deletions: 30 },
  { day: "Sun", additions: 80, deletions: 20 },
];

const reviewTimeData = [
  { week: "W1", avgTime: 18, p90Time: 48 },
  { week: "W2", avgTime: 24, p90Time: 56 },
  { week: "W3", avgTime: 22, p90Time: 52 },
  { week: "W4", avgTime: 16, p90Time: 42 },
  { week: "W5", avgTime: 28, p90Time: 72 },
  { week: "W6", avgTime: 32, p90Time: 84 },
  { week: "W7", avgTime: 26, p90Time: 68 },
  { week: "W8", avgTime: 20, p90Time: 48 },
];

const contributorActivityData = [
  { week: "W1", active: 8, new: 1, churned: 0 },
  { week: "W2", active: 9, new: 2, churned: 1 },
  { week: "W3", active: 10, new: 1, churned: 0 },
  { week: "W4", active: 9, new: 0, churned: 1 },
  { week: "W5", active: 11, new: 3, churned: 1 },
  { week: "W6", active: 10, new: 0, churned: 1 },
  { week: "W7", active: 8, new: 0, churned: 2 },
  { week: "W8", active: 9, new: 2, churned: 1 },
];

const insights: TemporalInsight[] = [
  { 
    type: "velocity", 
    message: "Repository velocity increased 12% this week, driven by sprint planning completion", 
    severity: "info", 
    trend: 12 
  },
  { 
    type: "delay", 
    message: "PR review time spiked to 32h average in W6, correlating with team vacation period", 
    severity: "warning", 
    trend: 78 
  },
  { 
    type: "burnout", 
    message: "Core contributor @johndoe activity dropped 65% - potential burnout signal", 
    severity: "critical", 
    trend: -65 
  },
  { 
    type: "churn", 
    message: "Code churn ratio (deletions/additions) improved from 0.42 to 0.28 - stabilizing codebase", 
    severity: "info", 
    trend: -33 
  },
];

export default function TemporalPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Temporal Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Time-aware analysis of repository evolution and patterns
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Weekly Velocity"
          value={68}
          trend={12}
          trendLabel="vs last week"
          icon={<Activity className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard
          title="Avg Review Time"
          value="20h"
          trend={-23}
          trendLabel="improvement"
          icon={<Clock className="w-5 h-5 text-green-500" />}
        />
        <MetricCard
          title="Commit Frequency"
          value={61}
          trend={-6}
          icon={<GitCommit className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="Active Contributors"
          value={9}
          trend={12}
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
                <LineChart data={velocityData}>
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
                <BarChart data={churnData}>
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
                <AreaChart data={reviewTimeData}>
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
                <BarChart data={contributorActivityData}>
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
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}
