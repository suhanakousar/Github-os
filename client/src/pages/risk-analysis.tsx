import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRRiskRow } from "@/components/pr-risk-row";
import { RiskBadge } from "@/components/risk-badge";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Code, 
  GitPullRequest, 
  Users,
  Building,
  Rocket,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import type { RiskAnalysis } from "@shared/schema";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PRData {
  id: number;
  number: number;
  title: string;
  author: { username: string; avatarUrl?: string };
  overallRisk: number;
  codeRisk: number;
  processRisk: number;
  humanRisk: number;
  additions: number;
  deletions: number;
  comments: number;
  createdAt: Date;
}

const mockPRs: PRData[] = [
  {
    id: 1,
    number: 1234,
    title: "feat: Major API refactoring for v2 endpoints",
    author: { username: "johndoe", avatarUrl: "" },
    overallRisk: 85,
    codeRisk: 92,
    processRisk: 78,
    humanRisk: 65,
    additions: 1250,
    deletions: 890,
    comments: 12,
    createdAt: new Date("2024-12-15"),
  },
  {
    id: 2,
    number: 1245,
    title: "chore: Database migration to v3 schema",
    author: { username: "janedoe", avatarUrl: "" },
    overallRisk: 78,
    codeRisk: 72,
    processRisk: 85,
    humanRisk: 70,
    additions: 450,
    deletions: 120,
    comments: 8,
    createdAt: new Date("2024-12-14"),
  },
  {
    id: 3,
    number: 1256,
    title: "fix: Critical security patch for auth module",
    author: { username: "security_team", avatarUrl: "" },
    overallRisk: 65,
    codeRisk: 58,
    processRisk: 72,
    humanRisk: 55,
    additions: 120,
    deletions: 45,
    comments: 15,
    createdAt: new Date("2024-12-16"),
  },
  {
    id: 4,
    number: 1267,
    title: "feat: Add new dashboard widgets",
    author: { username: "frontend_dev", avatarUrl: "" },
    overallRisk: 35,
    codeRisk: 28,
    processRisk: 42,
    humanRisk: 30,
    additions: 380,
    deletions: 50,
    comments: 5,
    createdAt: new Date("2024-12-17"),
  },
];

const riskDimensionData = [
  { dimension: "Code", value: 78, fullMark: 100 },
  { dimension: "Process", value: 65, fullMark: 100 },
  { dimension: "Human", value: 52, fullMark: 100 },
  { dimension: "Architecture", value: 71, fullMark: 100 },
  { dimension: "Release", value: 45, fullMark: 100 },
];

export default function RiskAnalysisPage() {
  const [selectedPR, setSelectedPR] = useState<PRData | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: riskAnalyses, isLoading } = useQuery<RiskAnalysis[]>({
    queryKey: ["/api/risk"],
  });

  const filteredPRs = mockPRs.filter(pr => {
    if (activeTab === "critical") return pr.overallRisk >= 80;
    if (activeTab === "high") return pr.overallRisk >= 60 && pr.overallRisk < 80;
    if (activeTab === "medium") return pr.overallRisk >= 40 && pr.overallRisk < 60;
    if (activeTab === "low") return pr.overallRisk < 40;
    return true;
  });

  const overallRepoRisk = Math.round(
    mockPRs.reduce((acc, pr) => acc + pr.overallRisk, 0) / mockPRs.length
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Risk Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Multi-dimensional risk assessment for pull requests
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Repository Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <RiskBadge score={overallRepoRisk} size="lg" />
            <div className="flex items-center gap-2 mt-3 text-sm">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-mono">-8%</span>
              <span className="text-muted-foreground">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Risk Dimension Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskDimensionData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Risk"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Code Risk", value: 78, icon: Code, color: "text-blue-500" },
          { label: "Process Risk", value: 65, icon: GitPullRequest, color: "text-purple-500" },
          { label: "Human Risk", value: 52, icon: Users, color: "text-green-500" },
          { label: "Architectural Risk", value: 71, icon: Building, color: "text-orange-500" },
          { label: "Release Risk", value: 45, icon: Rocket, color: "text-pink-500" },
        ].map((item) => (
          <Card key={item.label} className="overflow-visible">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold">{item.value}</span>
                <Progress value={item.value} className="flex-1 h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Pull Request Risk Analysis
            </CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all">All ({mockPRs.length})</TabsTrigger>
                <TabsTrigger value="critical" data-testid="tab-critical">Critical</TabsTrigger>
                <TabsTrigger value="high" data-testid="tab-high">High</TabsTrigger>
                <TabsTrigger value="medium" data-testid="tab-medium">Medium</TabsTrigger>
                <TabsTrigger value="low" data-testid="tab-low">Low</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredPRs.length === 0 ? (
            <EmptyState
              icon={GitPullRequest}
              title="No PRs in this category"
              description="There are no pull requests matching this risk level."
            />
          ) : (
            filteredPRs.map((pr) => (
              <PRRiskRow
                key={pr.id}
                pr={pr}
                onViewDetails={setSelectedPR}
              />
            ))
          )}
        </CardContent>
      </Card>

      {selectedPR && (
        <Card className="overflow-visible border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Risk Explanation: #{selectedPR.number}
              </CardTitle>
              <RiskBadge score={selectedPR.overallRisk} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-medium">{selectedPR.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Risk: {selectedPR.codeRisk}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Large changeset with {selectedPR.additions + selectedPR.deletions} lines modified. 
                  High complexity detected in modified files.
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4" />
                  Process Risk: {selectedPR.processRisk}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Only {selectedPR.comments} review comments. Missing required reviewers 
                  from core team. No linked issues.
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Human Risk: {selectedPR.humanRisk}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Author @{selectedPR.author.username} has moderate experience with this codebase. 
                  Recent commit history shows stable patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
