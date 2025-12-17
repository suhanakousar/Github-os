import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./risk-badge";
import { GitPullRequest, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PRRiskData {
  id: number;
  number: number;
  title: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
  overallRisk: number;
  codeRisk: number;
  processRisk: number;
  humanRisk: number;
  additions: number;
  deletions: number;
  comments: number;
  createdAt: Date;
}

interface PRRiskRowProps {
  pr: PRRiskData;
  onViewDetails?: (pr: PRRiskData) => void;
  className?: string;
}

export function PRRiskRow({ pr, onViewDetails, className }: PRRiskRowProps) {
  return (
    <Card className={cn("overflow-visible", className)} data-testid={`pr-row-${pr.number}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <GitPullRequest className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">#{pr.number}</span>
                <h3 className="font-medium truncate">{pr.title}</h3>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={pr.author.avatarUrl} />
                    <AvatarFallback className="text-[8px]">
                      {pr.author.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{pr.author.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(pr.createdAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{pr.comments}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              <span className="text-green-500 dark:text-green-400">+{pr.additions}</span>
              <span className="mx-1">/</span>
              <span className="text-red-500 dark:text-red-400">-{pr.deletions}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Code:</span>
              <span className="font-mono font-medium">{pr.codeRisk}</span>
              <span className="text-muted-foreground">Process:</span>
              <span className="font-mono font-medium">{pr.processRisk}</span>
              <span className="text-muted-foreground">Human:</span>
              <span className="font-mono font-medium">{pr.humanRisk}</span>
            </div>
            <RiskBadge score={pr.overallRisk} size="md" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewDetails?.(pr)}
              data-testid={`view-pr-${pr.number}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
