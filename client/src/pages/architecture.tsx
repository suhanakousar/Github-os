import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { createRepoQueryFn } from "@/lib/api-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchitectureAlert } from "@/components/architecture-alert";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";
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

// Architecture drift data will be fetched from API

const driftTypeConfig = {
  god_file: { icon: FileCode, color: "text-red-500", bgColor: "bg-red-500/10" },
  circular_dependency: { icon: GitMerge, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  boundary_blur: { icon: Layers, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  structure_degradation: { icon: FolderTree, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

export default function ArchitecturePage() {
  const { selectedRepoId } = useRepository();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDrift, setSelectedDrift] = useState<ArchitectureDrift | null>(null);

  const { data: drifts, isLoading, refetch } = useQuery<ArchitectureDrift[]>({
    queryKey: ["/api/architecture/drifts", selectedRepoId],
    queryFn: createRepoQueryFn<ArchitectureDrift[]>("/api/architecture/drifts", selectedRepoId),
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
        title: "Analyzing architecture",
        description: "Detecting architectural drifts... This may take a moment.",
      });

      const response = await fetch(`/api/architecture/populate?repositoryId=${selectedRepoId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger analysis");
      }
      
      // Poll for data
      let attempts = 0;
      const maxAttempts = 12;
      const pollInterval = setInterval(async () => {
        attempts++;
        const result = await refetch();
        const currentData = result.data;
        
        if (currentData && currentData.length > 0 || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (currentData && currentData.length > 0) {
            toast({
              title: "Success",
              description: `Detected ${currentData.length} architecture drift(s)`,
            });
          } else if (attempts >= maxAttempts) {
            toast({
              title: "Still analyzing",
              description: "Architecture analysis is in progress. Please wait a bit longer and try refreshing again.",
            });
          }
        }
      }, 5000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze architecture",
        variant: "destructive",
      });
    }
  };

  if (!selectedRepoId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FolderTree}
          title="No repository selected"
          description="Please select a repository from the dashboard to view architecture drift detection."
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

  const displayDrifts = drifts || [];
  
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Architecture Drift Detection</h1>
          <p className="text-muted-foreground mt-1">
            Detect and resolve architectural anti-patterns and degradation
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
            <EmptyState
              icon={FileCode}
              title="No complexity data"
              description="File complexity analysis will appear here once the repository is analyzed."
            />
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
            <div className="space-y-4">
              <EmptyState
                icon={CheckCircle}
                title="No architecture drifts"
                description={displayDrifts.length === 0 
                  ? "Click 'Refresh' to analyze the repository for architectural issues."
                  : "Your codebase is looking healthy with no detected architectural issues."}
              />
              {displayDrifts.length === 0 && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={!selectedRepoId || isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyze Architecture
                  </Button>
                </div>
              )}
            </div>
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
