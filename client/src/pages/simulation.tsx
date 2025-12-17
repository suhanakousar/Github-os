import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimulationPanel } from "@/components/simulation-panel";
import { MetricCard } from "@/components/metric-card";
import { 
  FlaskConical, 
  GitPullRequest, 
  UserMinus, 
  Play,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Loader2
} from "lucide-react";
import type { SimulationResult } from "@shared/schema";

const mockPRs = [
  { number: 1234, title: "Major API refactoring" },
  { number: 1245, title: "Database migration v3" },
  { number: 1267, title: "New dashboard widgets" },
  { number: 1278, title: "Security patches" },
];

const mockContributors = [
  { username: "johndoe", role: "Core Maintainer" },
  { username: "janedoe", role: "Frontend Lead" },
  { username: "senior_eng", role: "Principal Engineer" },
  { username: "newdev", role: "Junior Developer" },
];

const mockPRMergeResult: SimulationResult = {
  scenario: "What if PR #1234 merges today?",
  currentRisk: 45,
  projectedRisk: 68,
  riskDelta: 23,
  impactAreas: [
    "Authentication Module",
    "API Endpoints",
    "Database Connections",
    "Test Coverage (-12%)",
  ],
  recommendations: [
    "Add unit tests for new auth handlers before merge",
    "Request review from @senior_eng for database changes",
    "Deploy to staging first and monitor for 24h",
    "Prepare rollback scripts for quick revert if needed",
  ],
};

const mockDepartureResult: SimulationResult = {
  scenario: "What if @senior_eng leaves the team?",
  currentRisk: 45,
  projectedRisk: 82,
  riskDelta: 37,
  impactAreas: [
    "Core Module Ownership (91%)",
    "Database Layer (82%)",
    "API Design Decisions",
    "Code Review Capacity (-40%)",
  ],
  recommendations: [
    "Document all architectural decisions in ADRs",
    "Cross-train @johndoe on database layer",
    "Pair program critical features with junior devs",
    "Create runbooks for common maintenance tasks",
  ],
};

export default function SimulationPage() {
  const [simulationType, setSimulationType] = useState<"pr_merge" | "contributor_departure">("pr_merge");
  const [selectedPR, setSelectedPR] = useState<string>("");
  const [selectedContributor, setSelectedContributor] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      if (simulationType === "pr_merge") {
        setResult(mockPRMergeResult);
      } else {
        setResult(mockDepartureResult);
      }
    }, 1500);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedPR("");
    setSelectedContributor("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Developer Simulation Mode</h1>
        <p className="text-muted-foreground mt-1">
          Simulate "what-if" scenarios to predict risk impact
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Current Risk"
          value={45}
          icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
        />
        <MetricCard
          title="Simulations Run"
          value={12}
          trend={8}
          icon={<FlaskConical className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="Avg Risk Delta"
          value="+18"
          icon={<TrendingUp className="w-5 h-5 text-red-500" />}
        />
        <MetricCard
          title="Mitigations Applied"
          value={7}
          icon={<RotateCcw className="w-5 h-5 text-green-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              Configure Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Simulation Type</label>
              <Select 
                value={simulationType} 
                onValueChange={(v) => setSimulationType(v as "pr_merge" | "contributor_departure")}
              >
                <SelectTrigger data-testid="select-simulation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pr_merge">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="w-4 h-4" />
                      PR Merge Impact
                    </div>
                  </SelectItem>
                  <SelectItem value="contributor_departure">
                    <div className="flex items-center gap-2">
                      <UserMinus className="w-4 h-4" />
                      Contributor Departure
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {simulationType === "pr_merge" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Pull Request</label>
                <Select value={selectedPR} onValueChange={setSelectedPR}>
                  <SelectTrigger data-testid="select-pr">
                    <SelectValue placeholder="Choose a PR..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPRs.map((pr) => (
                      <SelectItem key={pr.number} value={pr.number.toString()}>
                        #{pr.number} - {pr.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Contributor</label>
                <Select value={selectedContributor} onValueChange={setSelectedContributor}>
                  <SelectTrigger data-testid="select-contributor">
                    <SelectValue placeholder="Choose a contributor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockContributors.map((c) => (
                      <SelectItem key={c.username} value={c.username}>
                        @{c.username} ({c.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <Button 
                onClick={handleRunSimulation}
                disabled={isSimulating || (simulationType === "pr_merge" ? !selectedPR : !selectedContributor)}
                className="w-full"
                data-testid="button-run-simulation"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              {result && (
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="w-full"
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {result ? (
            <SimulationPanel result={result} />
          ) : (
            <Card className="overflow-visible h-full">
              <CardContent className="h-full flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FlaskConical className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No Simulation Running</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Configure a simulation on the left panel to see projected risk impact and recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Simulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: "pr_merge", target: "PR #1234", delta: "+23%", time: "10 minutes ago" },
              { type: "contributor_departure", target: "@senior_eng", delta: "+37%", time: "1 hour ago" },
              { type: "pr_merge", target: "PR #1267", delta: "+8%", time: "3 hours ago" },
              { type: "contributor_departure", target: "@janedoe", delta: "+22%", time: "Yesterday" },
            ].map((sim, i) => (
              <div 
                key={i}
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {sim.type === "pr_merge" ? (
                    <GitPullRequest className="w-4 h-4 text-purple-500" />
                  ) : (
                    <UserMinus className="w-4 h-4 text-orange-500" />
                  )}
                  <div>
                    <span className="font-medium">{sim.target}</span>
                    <p className="text-xs text-muted-foreground">
                      {sim.type === "pr_merge" ? "PR Merge Impact" : "Departure Simulation"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="destructive" className="font-mono">
                    {sim.delta}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{sim.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
