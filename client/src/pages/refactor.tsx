import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { createRepoQueryFn } from "@/lib/api-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RefactorStep } from "@/components/refactor-step";
import { EmptyState } from "@/components/empty-state";
import { 
  Wrench, 
  Sparkles, 
  Play, 
  Clock,
  CheckCircle,
  FileCode,
  TestTube,
  Shield,
  Loader2
} from "lucide-react";
import type { RefactorPlan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Refactor plans will be fetched from API

export default function RefactorPage() {
  const [selectedPlan, setSelectedPlan] = useState<RefactorPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const { toast } = useToast();

  const { selectedRepoId } = useRepository();
  
  const { data: plans, isLoading } = useQuery<RefactorPlan[]>({
    queryKey: ["/api/refactor/plans", selectedRepoId],
    queryFn: createRepoQueryFn<RefactorPlan[]>("/api/refactor/plans", selectedRepoId),
    enabled: !!selectedRepoId,
  });

  const displayPlans = plans || [];
  
  if (displayPlans.length > 0 && !selectedPlan) {
    setSelectedPlan(displayPlans[0]);
  }

  const handleGeneratePlan = async () => {
    if (!customPrompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what you want to refactor.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Plan Generated",
        description: "AI has created a new refactor plan based on your request.",
      });
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">In Progress</Badge>;
      case "proposed":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">Proposed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Copilot-Driven Refactor Planner</h1>
        <p className="text-muted-foreground mt-1">
          AI-generated step-by-step refactoring plans with risk mitigation
        </p>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate New Refactor Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what you want to refactor... e.g., 'Split the large UserService class into smaller, focused services for authentication, profile management, and permissions'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-24"
            data-testid="input-refactor-prompt"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleGeneratePlan} 
              disabled={isGenerating}
              data-testid="button-generate-plan"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Refactor Plans
          </h2>
          {displayPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`overflow-visible cursor-pointer transition-all ${
                selectedPlan?.id === plan.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedPlan(plan)}
              data-testid={`plan-card-${plan.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{plan.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(plan.status || "proposed")}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.estimatedEffort}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedPlan ? (
            <Card className="overflow-visible">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {selectedPlan.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPlan.description}
                    </p>
                  </div>
                  {getStatusBadge(selectedPlan.status || "proposed")}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Estimated Time</span>
                    </div>
                    <span className="font-medium">{selectedPlan.estimatedEffort}</span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCode className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Steps</span>
                    </div>
                    <span className="font-medium">
                      {(selectedPlan.steps as Array<{status?: string}>).filter(s => s.status === "completed").length} / {(selectedPlan.steps as Array<unknown>).length}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Risk Level</span>
                    </div>
                    <span className="font-medium">Medium</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Step-by-Step Plan
                  </h3>
                  <div className="space-y-1">
                    {(selectedPlan.steps as Array<{order: number; title: string; description: string; status?: string}>).map((step, i) => (
                      <RefactorStep 
                        key={step.order}
                        step={step as {order: number; title: string; description: string; status?: "pending" | "in_progress" | "completed"}}
                        isLast={i === (selectedPlan.steps as Array<unknown>).length - 1}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-500">Risk Mitigation</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedPlan.riskMitigation}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedPlan.status === "proposed" && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Reject</Button>
                    <Button data-testid="button-start-refactor">
                      <Play className="w-4 h-4 mr-2" />
                      Start Refactor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Wrench}
              title="Select a refactor plan"
              description="Choose a refactor plan from the list to view its details and steps."
            />
          )}
        </div>
      </div>
    </div>
  );
}
