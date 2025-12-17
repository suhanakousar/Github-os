import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemporalInsight } from "@shared/schema";

interface InsightCardProps {
  insight: TemporalInsight;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case "velocity":
        return <Activity className="w-4 h-4" />;
      case "churn":
        return <Zap className="w-4 h-4" />;
      case "burnout":
        return <AlertTriangle className="w-4 h-4" />;
      case "delay":
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityConfig = () => {
    switch (insight.severity) {
      case "critical":
        return { 
          color: "text-red-500 dark:text-red-400", 
          bg: "bg-red-500/10", 
          border: "border-red-500/30"
        };
      case "warning":
        return { 
          color: "text-yellow-500 dark:text-yellow-400", 
          bg: "bg-yellow-500/10", 
          border: "border-yellow-500/30"
        };
      default:
        return { 
          color: "text-blue-500 dark:text-blue-400", 
          bg: "bg-blue-500/10", 
          border: "border-blue-500/30"
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <Card className={cn("overflow-visible", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0", config.bg, config.color)}>
            {getInsightIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{insight.message}</p>
            <div className="flex items-center gap-2 mt-2">
              {insight.trend !== 0 && (
                <div className={cn("flex items-center gap-1 text-xs font-mono", config.color)}>
                  {insight.trend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{insight.trend > 0 ? "+" : ""}{insight.trend}%</span>
                </div>
              )}
              <span className={cn("text-xs uppercase tracking-wide", config.color)}>
                {insight.severity}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
