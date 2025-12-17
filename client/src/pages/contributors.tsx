import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContributorCard } from "@/components/contributor-card";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Users, 
  AlertTriangle, 
  Star, 
  Shield,
  TrendingUp
} from "lucide-react";
import type { Contributor } from "@shared/schema";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const mockContributors: Contributor[] = [
  {
    id: "1",
    repositoryId: "repo1",
    username: "johndoe",
    avatarUrl: "",
    qualityScore: 92,
    reviewReliability: 88,
    riskProfile: "low",
    totalCommits: 342,
    totalPRs: 78,
    totalReviews: 156,
    isSinglePointOfFailure: true,
    codeOwnership: { "src/core": 0.65, "src/api": 0.45 },
    lastActiveAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: "2",
    repositoryId: "repo1",
    username: "janedoe",
    avatarUrl: "",
    qualityScore: 85,
    reviewReliability: 92,
    riskProfile: "low",
    totalCommits: 256,
    totalPRs: 62,
    totalReviews: 198,
    isSinglePointOfFailure: false,
    codeOwnership: { "src/ui": 0.72, "src/components": 0.58 },
    lastActiveAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: "3",
    repositoryId: "repo1",
    username: "newdev",
    avatarUrl: "",
    qualityScore: 68,
    reviewReliability: 72,
    riskProfile: "high",
    totalCommits: 45,
    totalPRs: 12,
    totalReviews: 8,
    isSinglePointOfFailure: false,
    codeOwnership: { "src/utils": 0.15 },
    lastActiveAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: "4",
    repositoryId: "repo1",
    username: "senior_eng",
    avatarUrl: "",
    qualityScore: 95,
    reviewReliability: 96,
    riskProfile: "low",
    totalCommits: 521,
    totalPRs: 112,
    totalReviews: 342,
    isSinglePointOfFailure: true,
    codeOwnership: { "src/core": 0.82, "src/api": 0.68, "src/db": 0.91 },
    lastActiveAt: new Date(),
    createdAt: new Date(),
  },
];

const riskDistribution = [
  { name: "Low Risk", value: 6, color: "hsl(var(--chart-2))" },
  { name: "Normal Risk", value: 2, color: "hsl(var(--chart-4))" },
  { name: "High Risk", value: 1, color: "hsl(var(--chart-5))" },
];

const codeOwnershipData = [
  { area: "src/core", owner: "senior_eng", percentage: 82 },
  { area: "src/ui", owner: "janedoe", percentage: 72 },
  { area: "src/api", owner: "johndoe", percentage: 65 },
  { area: "src/db", owner: "senior_eng", percentage: 91 },
  { area: "src/components", owner: "janedoe", percentage: 58 },
];

export default function ContributorsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contributors, isLoading } = useQuery<Contributor[]>({
    queryKey: ["/api/contributors"],
  });

  const displayContributors = contributors || mockContributors;
  const filteredContributors = displayContributors.filter(c =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const spofCount = displayContributors.filter(c => c.isSinglePointOfFailure).length;
  const highRiskCount = displayContributors.filter(c => c.riskProfile === "high").length;
  const avgQuality = displayContributors.length > 0 
    ? Math.round(displayContributors.reduce((acc, c) => acc + (c.qualityScore || 0), 0) / displayContributors.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contributor Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Reputation engine and risk profiling for contributors
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Contributors"
          value={displayContributors.length}
          trend={12}
          icon={<Users className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard
          title="SPOF Contributors"
          value={spofCount}
          variant={spofCount > 1 ? "warning" : "default"}
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
        />
        <MetricCard
          title="Avg Quality Score"
          value={avgQuality}
          trend={5}
          icon={<Star className="w-5 h-5 text-yellow-500" />}
        />
        <MetricCard
          title="High Risk New Devs"
          value={highRiskCount}
          variant={highRiskCount > 0 ? "danger" : "default"}
          icon={<Shield className="w-5 h-5 text-red-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
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

        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Code Ownership Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {codeOwnershipData.map((item) => (
              <div key={item.area} className="flex items-center gap-4">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono w-32 truncate">
                  {item.area}
                </code>
                <div className="flex-1">
                  <Progress value={item.percentage} className="h-2" />
                </div>
                <div className="flex items-center gap-2 w-32">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[8px]">
                      {item.owner.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">@{item.owner}</span>
                </div>
                <span className="text-xs font-mono w-12 text-right">{item.percentage}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Contributors
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contributors..."
                className="pl-9"
                data-testid="input-search-contributors"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContributors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No contributors found"
              description="No contributors match your search criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContributors.map((contributor) => (
                <ContributorCard key={contributor.id} contributor={contributor} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-visible border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="w-5 h-5" />
            Single Point of Failure Warning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The following contributors have critical ownership of key code areas. 
            Consider cross-training or documentation to reduce bus factor risk.
          </p>
          <div className="space-y-3">
            {displayContributors.filter(c => c.isSinglePointOfFailure).map((contributor) => (
              <div 
                key={contributor.id}
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-orange-500/10 border border-orange-500/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={contributor.avatarUrl || undefined} />
                    <AvatarFallback>{contributor.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium">@{contributor.username}</span>
                    <p className="text-xs text-muted-foreground">
                      {contributor.totalCommits} commits, owns {Object.keys(contributor.codeOwnership as object || {}).length} areas
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                  SPOF
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
