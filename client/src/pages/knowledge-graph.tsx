import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { createRepoQueryFn } from "@/lib/api-helpers";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { 
  Network, 
  FileCode, 
  GitCommit, 
  GitPullRequest, 
  Users, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter
} from "lucide-react";
import type { KnowledgeGraphData } from "@shared/schema";

// Knowledge graph data will be fetched from API

const nodeTypeConfig = {
  file: { icon: FileCode, color: "bg-blue-500", label: "Files" },
  commit: { icon: GitCommit, color: "bg-green-500", label: "Commits" },
  pr: { icon: GitPullRequest, color: "bg-purple-500", label: "Pull Requests" },
  contributor: { icon: Users, color: "bg-orange-500", label: "Contributors" },
  issue: { icon: AlertCircle, color: "bg-red-500", label: "Issues" },
};

export default function KnowledgeGraphPage() {
  const { selectedRepoId } = useRepository();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: graphData, isLoading, refetch } = useQuery<KnowledgeGraphData>({
    queryKey: ["/api/knowledge-graph", selectedRepoId],
    queryFn: createRepoQueryFn<KnowledgeGraphData>("/api/knowledge-graph", selectedRepoId),
    enabled: !!selectedRepoId,
    refetchInterval: 5000, // Refetch every 5 seconds to catch async population
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
        title: "Refreshing knowledge graph",
        description: "Fetching data from GitHub... This may take a moment.",
      });

      // Trigger knowledge graph population
      const response = await fetch(`/api/knowledge-graph/populate?repositoryId=${selectedRepoId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger population");
      }
      
      // Poll for data - refetch every 5 seconds until we have data
      let attempts = 0;
      const maxAttempts = 12; // 12 attempts = ~60 seconds
      const pollInterval = setInterval(async () => {
        attempts++;
        const result = await refetch();
        const currentNodes = result.data?.nodes || [];
        
        // Check if we have data now
        if (currentNodes.length > 0 || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (currentNodes.length > 0) {
            toast({
              title: "Success",
              description: `Knowledge graph populated with ${currentNodes.length} nodes`,
            });
          } else if (attempts >= maxAttempts) {
            toast({
              title: "Still loading",
              description: "Data is being fetched. Please wait a bit longer and try refreshing again.",
            });
          }
        }
      }, 5000); // Check every 5 seconds
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh knowledge graph",
        variant: "destructive",
      });
    }
  };

  const nodes = (graphData && typeof graphData === 'object' && 'nodes' in graphData && Array.isArray(graphData.nodes)) 
    ? graphData.nodes 
    : [];
  const edges = (graphData && typeof graphData === 'object' && 'edges' in graphData && Array.isArray(graphData.edges)) 
    ? graphData.edges 
    : [];

  // Debug logging
  if (selectedRepoId && !isLoading) {
    console.log("Knowledge Graph Data:", {
      hasData: !!graphData,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      selectedRepoId,
    });
  }

  type NodeType = { id: string; type: string; label: string; size: number; color: string };
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(["file", "commit", "pr", "contributor", "issue"]);
  const [zoom, setZoom] = useState(1);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };
  const filteredNodes = nodes.filter(n => activeFilters.includes(n.type));
  const filteredEdges = edges.filter(
    e => filteredNodes.some(n => n.id === e.source) && filteredNodes.some(n => n.id === e.target)
  );

  const nodeStats = {
    files: nodes.filter(n => n.type === "file").length,
    commits: nodes.filter(n => n.type === "commit").length,
    prs: nodes.filter(n => n.type === "pr").length,
    contributors: nodes.filter(n => n.type === "contributor").length,
    issues: nodes.filter(n => n.type === "issue").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-1">
          Repository knowledge graph with interconnected entities
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(nodeTypeConfig).map(([type, config]) => {
          const count = nodes.filter(n => n.type === type).length;
          const Icon = config.icon;
          const isActive = activeFilters.includes(type);
          
          return (
            <Card 
              key={type}
              className={`overflow-visible cursor-pointer transition-all ${
                isActive ? "ring-2 ring-primary" : "opacity-60"
              }`}
              onClick={() => toggleFilter(type)}
              data-testid={`filter-${type}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md ${config.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 overflow-visible">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Graph Visualization
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={!selectedRepoId || isLoading}
                >
                  <Network className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  data-testid="button-zoom-out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                  data-testid="button-zoom-in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" data-testid="button-fullscreen">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredNodes.length === 0 ? (
              <div className="h-96 bg-muted/30 rounded-md border border-border flex items-center justify-center">
                <EmptyState
                  icon={Network}
                  title="No graph data"
                  description="Click 'Refresh' to fetch data from GitHub, or wait for automatic population to complete."
                />
              </div>
            ) : (
            <div 
              className="h-96 bg-muted/30 rounded-md border border-border relative overflow-hidden"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              <svg width="100%" height="100%" className="absolute inset-0">
                {filteredEdges.map((edge, i) => {
                  const sourceNode = filteredNodes.find(n => n.id === edge.source);
                  const targetNode = filteredNodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  
                  const sourceIdx = filteredNodes.indexOf(sourceNode);
                  const targetIdx = filteredNodes.indexOf(targetNode);
                  const cols = 4;
                  const cellW = 200;
                  const cellH = 120;
                  
                  const x1 = (sourceIdx % cols) * cellW + cellW / 2;
                  const y1 = Math.floor(sourceIdx / cols) * cellH + cellH / 2;
                  const x2 = (targetIdx % cols) * cellW + cellW / 2;
                  const y2 = Math.floor(targetIdx / cols) * cellH + cellH / 2;

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="hsl(var(--border))"
                      strokeWidth={2}
                      strokeOpacity={0.5}
                    />
                  );
                })}
              </svg>
              
              <div className="absolute inset-0 p-4 grid grid-cols-4 gap-4 place-items-center">
                {filteredNodes.map((node) => {
                  const config = nodeTypeConfig[node.type as keyof typeof nodeTypeConfig];
                  const Icon = config?.icon || FileCode;
                  
                  return (
                    <div
                      key={node.id}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer transition-all hover-elevate ${
                        selectedNode?.id === node.id ? "ring-2 ring-primary bg-primary/10" : ""
                      }`}
                      onClick={() => setSelectedNode(node)}
                      style={{ transform: `scale(${node.size / 25})` }}
                      data-testid={`node-${node.id}`}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: node.color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-center font-mono truncate max-w-24">
                        {node.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Graph Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Nodes</span>
                <span className="font-mono">{filteredNodes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Edges</span>
                <span className="font-mono">{filteredEdges.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Connections</span>
                <span className="font-mono">
                  {(filteredEdges.length / Math.max(filteredNodes.length, 1)).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card className="overflow-visible border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Selected Node
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedNode.color }}
                  >
                    {(() => {
                      const config = nodeTypeConfig[selectedNode.type as keyof typeof nodeTypeConfig];
                      const Icon = config?.icon || FileCode;
                      return <Icon className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedNode.label}</p>
                    <Badge variant="secondary" className="text-xs">
                      {selectedNode.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Connected To:</p>
                  <div className="space-y-1">
                    {filteredEdges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .slice(0, 5)
                      .map((edge, i) => {
                        const connectedId = edge.source === selectedNode.id ? edge.target : edge.source;
                        const connectedNode = nodes.find(n => n.id === connectedId);
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{edge.type}:</span>
                            <span className="font-mono truncate">{connectedNode?.label}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(nodeTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${config.color}`} />
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs">{config.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
