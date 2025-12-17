import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "./risk-badge";
import { AlertTriangle, GitCommit, GitPullRequest, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contributor } from "@shared/schema";

interface ContributorCardProps {
  contributor: Contributor;
  className?: string;
}

export function ContributorCard({ contributor, className }: ContributorCardProps) {
  const getRiskProfileColor = () => {
    switch (contributor.riskProfile) {
      case "high":
        return "text-red-500 dark:text-red-400";
      case "low":
        return "text-green-500 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("overflow-visible", className)} data-testid={`contributor-card-${contributor.username}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 border-2 border-border">
            <AvatarImage src={contributor.avatarUrl || undefined} alt={contributor.username} />
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              {contributor.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{contributor.username}</h3>
              {contributor.isSinglePointOfFailure && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  SPOF
                </Badge>
              )}
            </div>
            
            <div className={cn("text-xs mt-1", getRiskProfileColor())}>
              {contributor.riskProfile?.toUpperCase()} RISK
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5" />
                <span className="font-mono">{contributor.totalCommits}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitPullRequest className="w-3.5 h-3.5" />
                <span className="font-mono">{contributor.totalPRs}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono">{contributor.totalReviews}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Quality</div>
            <RiskBadge score={contributor.qualityScore || 0} showLabel={false} size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
