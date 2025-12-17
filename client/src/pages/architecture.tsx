import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchitectureAlert } from "@/components/architecture-alert";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileCode, 
  GitMerge, 
  Layers, 
  FolderTree,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from "lucide-react";
import type { ArchitectureDrift } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const mockDrifts: ArchitectureDrift[] = [
  {
    id: "1",
    repositoryId: "repo1",
    driftType: "god_file",
    severity: "critical",
    affectedFiles: ["src/core/main.ts", "src/core/utils.ts"],
    description: "src/core/main.ts has grown to 2,847 lines with 45 functions. This file handles authentication, routing, database connections, and business logic.",
    suggestion: "Split into separate modules: auth.ts, router.ts, db.ts, and services/*.ts",
    isResolved: false,
    createdAt: new Date(),
  },
  {
    id: "2",
    repositoryId: "repo1",
    driftType: "circular_dependency",
    severity: "high",
    affectedFiles: ["src/api/users.ts", "src/services/auth.ts", "src/utils/validation.ts"],
    description: "Circular dependency detected: users.ts -> auth.ts -> validation.ts -> users.ts",
    suggestion: "Extract shared types to a common module and use dependency injection",
    isResolved: false,
    createdAt: new Date(),
  },
  {
    id: "3",
    repositoryId: "repo1",
    driftType: "boundary_blur",
    severity: "medium",
    affectedFiles: ["src/components/UserProfile.tsx"],
    description: "UI component UserProfile.tsx contains direct database queries and business logic",
    suggestion: "Move data fetching to a custom hook and business logic to a service layer",
    isResolved: false,
    createdAt: new Date(),
  },
  {
    id: "4",
    repositoryId: "repo1",
    driftType: "structure_degradation",
    severity: "low",
    affectedFiles: ["src/helpers/", "src/lib/", "src/utils/"],
    description: "Multiple utility folders with overlapping responsibilities: helpers/, lib/, utils/",
    suggestion: "Consolidate into a single utils/ folder with clear submodule organization",
    isResolved: true,
    createdAt: new Date(),
  },
];

const fileComplexityData = [
  { file: "main.ts", lines: 2847, complexity: 92 },
  { file: "auth.ts", lines: 856, complexity: 68 },
  { file: "api.ts", lines: 1234, complexity: 75 },
  { file: "db.ts", lines: 678, complexity: 58 },
  { file: "utils.ts", lines: 445, complexity: 42 },
  { file: "types.ts", lines: 312, complexity: 25 },
];

const driftTypeConfig = {
  god_file: { icon: FileCode, color: "text-red-500", bgColor: "bg-red-500/10" },
  circular_dependency: { icon: GitMerge, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  boundary_blur: { icon: Layers, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  structure_degradation: { icon: FolderTree, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDrift, setSelectedDrift] = useState<ArchitectureDrift | null>(null);

  const { data: drifts, isLoading } = useQuery<ArchitectureDrift[]>({
    queryKey: ["/api/architecture/drifts"],
  });

  const displayDrifts = drifts || mockDrifts;
  
  const filteredDrifts = displayDrifts.filter(drift => {
    if (activeTab === "resolved") return drift.isResolved;
    if (activeTab === "active") return !drift.isResolved;
    return true;
  });

  const criticalCount = displayDrifts.filter(d => d.severity === "critical" && !d.isResolved).length;
  const highCount = displayDrifts.filter(d => d.severity === "high" && !d.isResolved).length;
  const resolvedCount = displayDrifts.filter(d => d.isResolved).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Architecture Drift Detection</h1>
        <p className="text-muted-foreground mt-1">
          Detect and resolve architectural anti-patterns and degradation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Critical Issues"
          value={criticalCount}
          variant={criticalCount > 0 ? "danger" : "default"}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        />
        <MetricCard
          title="High Severity"
          value={highCount}
          variant={highCount > 0 ? "warning" : "default"}
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
        />
        <MetricCard
          title="Resolved"
          value={resolvedCount}
          trend={25}
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        />
        <MetricCard
          title="Debt Trend"
          value="-12%"
          trend={-12}
          icon={<TrendingDown className="w-5 h-5 text-blue-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              File Complexity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fileComplexityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="file" 
                    type="category"
                    width={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="complexity" radius={[0, 4, 4, 0]}>
                    {fileComplexityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.complexity > 80 ? 'hsl(var(--chart-5))' : 
                              entry.complexity > 60 ? 'hsl(var(--chart-4))' : 
                              'hsl(var(--chart-2))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Drift by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(driftTypeConfig).map(([type, config]) => {
              const count = displayDrifts.filter(d => d.driftType === type && !d.isResolved).length;
              const Icon = config.icon;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <Progress value={count * 25} className="h-1.5 mt-1" />
                  </div>
                  <Badge variant="secondary" className="font-mono">{count}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Detected Drifts
            </CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all-drifts">
                  All ({displayDrifts.length})
                </TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active-drifts">
                  Active ({displayDrifts.filter(d => !d.isResolved).length})
                </TabsTrigger>
                <TabsTrigger value="resolved" data-testid="tab-resolved-drifts">
                  Resolved ({resolvedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredDrifts.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No architecture drifts"
              description="Your codebase is looking healthy with no detected architectural issues."
            />
          ) : (
            filteredDrifts.map((drift) => (
              <ArchitectureAlert
                key={drift.id}
                drift={drift}
                onViewDetails={setSelectedDrift}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
