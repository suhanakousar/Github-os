import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GovernanceRuleCard } from "@/components/governance-rule-card";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Shield, 
  Plus, 
  FileCode, 
  TestTube, 
  Users, 
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react";
import type { GovernanceRule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const mockRules: GovernanceRule[] = [
  {
    id: "1",
    repositoryId: "repo1",
    ruleName: "Maximum PR Size",
    ruleType: "pr_size",
    config: { maxLines: 500, maxFiles: 20 },
    isEnabled: true,
    severity: "warning",
    createdAt: new Date(),
  },
  {
    id: "2",
    repositoryId: "repo1",
    ruleName: "Required Test Coverage",
    ruleType: "test_coverage",
    config: { minCoverage: 80, enforceDelta: true },
    isEnabled: true,
    severity: "blocking",
    createdAt: new Date(),
  },
  {
    id: "3",
    repositoryId: "repo1",
    ruleName: "Minimum Reviewers",
    ruleType: "required_reviewers",
    config: { minReviewers: 2, requireCodeOwner: true },
    isEnabled: true,
    severity: "blocking",
    createdAt: new Date(),
  },
  {
    id: "4",
    repositoryId: "repo1",
    ruleName: "Commit Message Format",
    ruleType: "commit_message",
    config: { pattern: "^(feat|fix|chore|docs|refactor|test):", requireScope: false },
    isEnabled: false,
    severity: "info",
    createdAt: new Date(),
  },
];

const ruleTemplates = [
  { type: "pr_size", name: "PR Size Limit", icon: FileCode, description: "Limit maximum lines and files per PR" },
  { type: "test_coverage", name: "Test Coverage", icon: TestTube, description: "Enforce minimum test coverage" },
  { type: "required_reviewers", name: "Required Reviewers", icon: Users, description: "Set minimum reviewer requirements" },
  { type: "commit_message", name: "Commit Messages", icon: MessageSquare, description: "Enforce commit message format" },
];

export default function GovernancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: rules, isLoading } = useQuery<GovernanceRule[]>({
    queryKey: ["/api/governance/rules"],
  });

  const displayRules = rules || mockRules;
  const enabledCount = displayRules.filter(r => r.isEnabled).length;
  const blockingCount = displayRules.filter(r => r.severity === "blocking" && r.isEnabled).length;

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    toast({
      title: enabled ? "Rule Enabled" : "Rule Disabled",
      description: `The governance rule has been ${enabled ? "enabled" : "disabled"}.`,
    });
  };

  const handleCreateRule = () => {
    toast({
      title: "Rule Created",
      description: "The new governance rule has been created successfully.",
    });
    setDialogOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Governance Rules</h1>
          <p className="text-muted-foreground mt-1">
            Policy-as-code enforcement for repository standards
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-rule">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Governance Rule</DialogTitle>
              <DialogDescription>
                {selectedTemplate 
                  ? "Configure your new governance rule"
                  : "Select a rule template to get started"
                }
              </DialogDescription>
            </DialogHeader>
            
            {!selectedTemplate ? (
              <div className="grid grid-cols-2 gap-3 pt-4">
                {ruleTemplates.map((template) => (
                  <div
                    key={template.type}
                    className="p-4 rounded-md border border-border cursor-pointer hover-elevate"
                    onClick={() => setSelectedTemplate(template.type)}
                    data-testid={`template-${template.type}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <template.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{template.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input placeholder="e.g., Maximum PR Size" data-testid="input-rule-name" />
                </div>
                
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select defaultValue="warning">
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="blocking">Blocking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate === "pr_size" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Lines</Label>
                      <Input type="number" defaultValue={500} data-testid="input-max-lines" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Files</Label>
                      <Input type="number" defaultValue={20} data-testid="input-max-files" />
                    </div>
                  </div>
                )}

                {selectedTemplate === "test_coverage" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Minimum Coverage (%)</Label>
                      <Input type="number" defaultValue={80} data-testid="input-min-coverage" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="enforce-delta" />
                      <Label htmlFor="enforce-delta">Enforce coverage delta</Label>
                    </div>
                  </div>
                )}

                {selectedTemplate === "required_reviewers" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Minimum Reviewers</Label>
                      <Input type="number" defaultValue={2} data-testid="input-min-reviewers" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="require-codeowner" />
                      <Label htmlFor="require-codeowner">Require code owner approval</Label>
                    </div>
                  </div>
                )}

                {selectedTemplate === "commit_message" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pattern (Regex)</Label>
                      <Input 
                        defaultValue="^(feat|fix|chore|docs|refactor|test):" 
                        className="font-mono text-sm"
                        data-testid="input-pattern"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="require-scope" />
                      <Label htmlFor="require-scope">Require scope in message</Label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Back
                  </Button>
                  <Button onClick={handleCreateRule} data-testid="button-save-rule">
                    Create Rule
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Rules"
          value={displayRules.length}
          icon={<Shield className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard
          title="Active Rules"
          value={enabledCount}
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        />
        <MetricCard
          title="Blocking Rules"
          value={blockingCount}
          variant={blockingCount > 0 ? "warning" : "default"}
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
        />
        <MetricCard
          title="Compliance Rate"
          value="94%"
          trend={3}
          icon={<Settings className="w-5 h-5 text-purple-500" />}
        />
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configured Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayRules.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No governance rules"
              description="Create your first governance rule to start enforcing repository standards."
              actionLabel="Create Rule"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayRules.map((rule) => (
                <GovernanceRuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggleRule}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="text-sm font-medium">YAML Configuration Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-md bg-muted/50 font-mono text-xs overflow-x-auto">
{`# .gitmind/governance.yaml
version: "1.0"

rules:
  - name: "Maximum PR Size"
    type: pr_size
    enabled: true
    severity: warning
    config:
      maxLines: 500
      maxFiles: 20

  - name: "Required Test Coverage"
    type: test_coverage
    enabled: true
    severity: blocking
    config:
      minCoverage: 80
      enforceDelta: true

  - name: "Minimum Reviewers"
    type: required_reviewers
    enabled: true
    severity: blocking
    config:
      minReviewers: 2
      requireCodeOwner: true

  - name: "Commit Message Format"
    type: commit_message
    enabled: false
    severity: info
    config:
      pattern: "^(feat|fix|chore|docs|refactor|test):"
      requireScope: false`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
