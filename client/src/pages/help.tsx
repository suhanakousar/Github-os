import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Brain, 
  Network, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  Shield,
  Wrench,
  FlaskConical,
  Zap,
  FileCode,
  Terminal,
  ExternalLink
} from "lucide-react";

const features = [
  {
    icon: Network,
    title: "Knowledge Graph Engine",
    description: "Builds a comprehensive knowledge graph of your repository connecting files, commits, PRs, contributors, and issues. Powers advanced reasoning and dependency impact analysis.",
    category: "Intelligence",
  },
  {
    icon: TrendingUp,
    title: "Temporal Intelligence",
    description: "Analyzes how your repository evolves over time, tracking velocity trends, code churn, contributor patterns, and PR review delays with actionable insights.",
    category: "Intelligence",
  },
  {
    icon: AlertTriangle,
    title: "Multi-Dimensional Risk Engine",
    description: "Calculates risk across five dimensions: Code, Process, Human, Architectural, and Release. Each PR gets a detailed breakdown with explanations.",
    category: "Analysis",
  },
  {
    icon: FileCode,
    title: "Architecture Drift Detection",
    description: "Detects god-files, circular dependencies, boundary blur, and folder structure degradation. Auto-suggests refactoring strategies.",
    category: "Analysis",
  },
  {
    icon: Wrench,
    title: "Copilot Refactor Planner",
    description: "AI-generated step-by-step refactoring plans with file order, test strategy, and risk mitigation built-in.",
    category: "Automation",
  },
  {
    icon: Users,
    title: "Contributor Intelligence",
    description: "Tracks contribution quality, review reliability, and risk profiles. Identifies single-point-of-failure contributors.",
    category: "Intelligence",
  },
  {
    icon: Brain,
    title: "Sprint Intelligence",
    description: "Predicts sprint failures, identifies blockers, and suggests priority reordering based on AI analysis of open issues and PRs.",
    category: "Intelligence",
  },
  {
    icon: Shield,
    title: "Governance Engine",
    description: "Policy-as-code system with configurable rules for PR size, test coverage, required reviewers, and commit message format.",
    category: "Governance",
  },
  {
    icon: Zap,
    title: "Predictive Failure Engine",
    description: "Predicts likely bugs, PR reverts, and missed deadlines using heuristic analysis of historical patterns.",
    category: "Prediction",
  },
  {
    icon: FlaskConical,
    title: "Developer Simulation",
    description: "Simulate 'what-if' scenarios like PR merges or contributor departures to see projected risk impact.",
    category: "Simulation",
  },
];

const cliCommands = [
  { command: "gitmind analyze", description: "Run full repository analysis" },
  { command: "gitmind risk --pr 1234", description: "Analyze risk for specific PR" },
  { command: "gitmind contributors", description: "Show contributor intelligence" },
  { command: "gitmind drift", description: "Detect architecture drifts" },
  { command: "gitmind simulate", description: "Run simulation mode" },
  { command: "gitmind govern check", description: "Check governance compliance" },
];

export default function HelpPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Learn how to use GitMind OS effectively
        </p>
      </div>

      <Card className="overflow-visible bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">GitMind OS v1.0</h2>
              <p className="text-muted-foreground mt-1">
                An autonomous AI-driven GitHub Intelligence & Governance Platform that observes, 
                reasons, predicts, enforces, and evolves software projects.
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary">AI-Powered</Badge>
                <Badge variant="secondary">Real-time Analysis</Badge>
                <Badge variant="secondary">Policy-as-Code</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Feature Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="overflow-visible">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{feature.title}</h3>
                      <Badge variant="outline" className="text-xs">{feature.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            CLI Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cliCommands.map((cmd, i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
                <code className="font-mono text-sm bg-background px-2 py-1 rounded border border-border">
                  {cmd.command}
                </code>
                <span className="text-sm text-muted-foreground">{cmd.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ol className="space-y-3">
            <li>
              <strong>Connect Repository:</strong> Click "Select Repository" in the header and enter your GitHub repository URL or owner/name format.
            </li>
            <li>
              <strong>Configure GitHub Token:</strong> Go to Settings and add your GitHub Personal Access Token with repo, read:org, and read:user scopes.
            </li>
            <li>
              <strong>Review Dashboard:</strong> The main dashboard shows your repository health score, high-risk PRs, and temporal insights.
            </li>
            <li>
              <strong>Set Up Governance:</strong> Navigate to Governance Rules to configure policies like PR size limits and test coverage requirements.
            </li>
            <li>
              <strong>Explore Intelligence:</strong> Use the sidebar to explore Knowledge Graph, Risk Analysis, Contributor Intelligence, and more.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Copilot Usage Documentation</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            GitMind OS leverages AI throughout the platform:
          </p>
          <ul className="space-y-2 mt-3">
            <li>
              <strong>Risk Analysis:</strong> GPT-5 analyzes PR changesets, commit patterns, and contributor history to generate multi-dimensional risk scores with natural language explanations.
            </li>
            <li>
              <strong>Refactor Planning:</strong> AI generates step-by-step refactoring plans based on detected architectural issues, including test strategies and risk mitigation steps.
            </li>
            <li>
              <strong>Temporal Insights:</strong> Machine learning models identify patterns in repository velocity, contributor activity, and code churn to surface actionable insights.
            </li>
            <li>
              <strong>Sprint Intelligence:</strong> AI predicts sprint completion probability by analyzing blocker patterns, PR review velocity, and historical sprint data.
            </li>
            <li>
              <strong>Simulation Engine:</strong> Predictive models estimate risk impact of hypothetical scenarios like PR merges or contributor departures.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
