import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { createRepoQueryFn } from "@/lib/api-helpers";
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

// Risk data will be fetched from API

export default function RiskAnalysisPage() {
  const { selectedRepoId } = useRepository();
  const [selectedPR, setSelectedPR] = useState<PRData | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: riskAnalyses, isLoading } = useQuery<RiskAnalysis[]>({
    queryKey: ["/api/risk", selectedRepoId],
    queryFn: createRepoQueryFn<RiskAnalysis[]>("/api/risk", selectedRepoId),
    enabled: !!selectedRepoId,
  });

  const filteredPRs = (riskAnalyses || []).filter(pr => {
    if (activeTab === "critical") return pr.overallRisk >= 80;
    if (activeTab === "high") return pr.overallRisk >= 60 && pr.overallRisk < 80;
    if (activeTab === "medium") return pr.overallRisk >= 40 && pr.overallRisk < 60;
    if (activeTab === "low") return pr.overallRisk < 40;
    return true;
  });

  const overallRepoRisk = riskAnalyses && riskAnalyses.length > 0
    ? Math.round(riskAnalyses.reduce((acc, pr) => acc + pr.overallRisk, 0) / riskAnalyses.length)
    : 0;

  const riskDimensionData = riskAnalyses && riskAnalyses.length > 0 ? [
    { dimension: "Code", value: Math.round(riskAnalyses.reduce((acc, pr) => acc + pr.codeRisk, 0) / riskAnalyses.length), fullMark: 100 },
    { dimension: "Process", value: Math.round(riskAnalyses.reduce((acc, pr) => acc + pr.processRisk, 0) / riskAnalyses.length), fullMark: 100 },
    { dimension: "Human", value: Math.round(riskAnalyses.reduce((acc, pr) => acc + pr.humanRisk, 0) / riskAnalyses.length), fullMark: 100 },
    { dimension: "Architecture", value: Math.round(riskAnalyses.reduce((acc, pr) => acc + pr.architecturalRisk, 0) / riskAnalyses.length), fullMark: 100 },
    { dimension: "Release", value: Math.round(riskAnalyses.reduce((acc, pr) => acc + pr.releaseRisk, 0) / riskAnalyses.length), fullMark: 100 },
  ] : [];

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
              {riskDimensionData.length > 0 ? (
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
              ) : (
                <EmptyState
                  icon={AlertTriangle}
                  title="No risk data"
                  description="Risk dimension data will appear here once PRs are analyzed."
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {riskDimensionData.length > 0 ? riskDimensionData.map((item) => (
          <Card key={item.dimension} className="overflow-visible">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {item.dimension === "Code" && <Code className="w-4 h-4 text-blue-500" />}
                {item.dimension === "Process" && <GitPullRequest className="w-4 h-4 text-purple-500" />}
                {item.dimension === "Human" && <Users className="w-4 h-4 text-green-500" />}
                {item.dimension === "Architecture" && <Building className="w-4 h-4 text-orange-500" />}
                {item.dimension === "Release" && <Rocket className="w-4 h-4 text-pink-500" />}
                <span className="text-xs text-muted-foreground uppercase tracking-wide truncate">
                  {item.dimension} Risk
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold">{item.value}</span>
                <Progress value={item.value} className="flex-1 h-2" />
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="col-span-5">
            <CardContent className="p-8">
              <EmptyState
                icon={AlertTriangle}
                title="No risk data"
                description="Risk analysis data will appear here once pull requests are analyzed."
              />
            </CardContent>
          </Card>
        )}
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
                <TabsTrigger value="all" data-testid="tab-all">All ({riskAnalyses?.length || 0})</TabsTrigger>
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
                pr={{
                  id: parseInt(pr.id) || 0,
                  number: pr.prNumber || 0,
                  title: pr.explanation || `PR #${pr.prNumber}`,
                  author: { username: "unknown", avatarUrl: "" },
                  overallRisk: pr.overallRisk,
                  codeRisk: pr.codeRisk,
                  processRisk: pr.processRisk,
                  humanRisk: pr.humanRisk,
                  additions: 0,
                  deletions: 0,
                  comments: 0,
                  createdAt: pr.createdAt || new Date(),
                }}
                onViewDetails={setSelectedPR}
              />
            ))
          )}
        </CardContent>
      </Card>

      {selectedPR && riskAnalyses && (
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
                  {riskAnalyses.find(r => r.prNumber === selectedPR.number)?.explanation || "Risk analysis details"}
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4" />
                  Process Risk: {selectedPR.processRisk}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Process risk assessment based on review patterns and workflow.
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Human Risk: {selectedPR.humanRisk}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Human risk based on contributor experience and activity patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
