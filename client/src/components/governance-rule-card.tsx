import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  FileCode, 
  TestTube, 
  Users, 
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  Info,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GovernanceRule } from "@shared/schema";

interface GovernanceRuleCardProps {
  rule: GovernanceRule;
  onToggle?: (ruleId: string, enabled: boolean) => void;
  className?: string;
}

export function GovernanceRuleCard({ rule, onToggle, className }: GovernanceRuleCardProps) {
  const getRuleIcon = () => {
    switch (rule.ruleType) {
      case "pr_size":
        return <FileCode className="w-4 h-4" />;
      case "test_coverage":
        return <TestTube className="w-4 h-4" />;
      case "required_reviewers":
        return <Users className="w-4 h-4" />;
      case "commit_message":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSeverityConfig = () => {
    switch (rule.severity) {
      case "blocking":
        return { icon: Ban, color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10" };
      case "error":
        return { icon: AlertTriangle, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10" };
      case "warning":
        return { icon: AlertCircle, color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-500/10" };
      default:
        return { icon: Info, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" };
    }
  };

  const severityConfig = getSeverityConfig();
  const SeverityIcon = severityConfig.icon;

  const formatConfig = (config: unknown): string => {
    if (typeof config === 'object' && config !== null) {
      return Object.entries(config as Record<string, unknown>)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    return String(config);
  };

  return (
    <Card className={cn("overflow-visible", className)} data-testid={`rule-card-${rule.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", severityConfig.bg, severityConfig.color)}>
              {getRuleIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{rule.ruleName}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {rule.ruleType.replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <Switch
            checked={rule.isEnabled || false}
            onCheckedChange={(checked) => onToggle?.(rule.id, checked)}
            data-testid={`toggle-rule-${rule.id}`}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-mono">
              {formatConfig(rule.config)}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn("gap-1", severityConfig.color)}
          >
            <SeverityIcon className="w-3 h-3" />
            {rule.severity?.toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
