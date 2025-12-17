import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationResult } from "@shared/schema";

interface SimulationPanelProps {
  result: SimulationResult;
  className?: string;
}

export function SimulationPanel({ result, className }: SimulationPanelProps) {
  const riskDeltaPositive = result.riskDelta > 0;
  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "text-red-500 dark:text-red-400";
    if (risk >= 60) return "text-orange-500 dark:text-orange-400";
    if (risk >= 40) return "text-yellow-500 dark:text-yellow-400";
    return "text-green-500 dark:text-green-400";
  };

  return (
    <Card className={cn("overflow-visible", className)} data-testid="simulation-result">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">{result.scenario}</CardTitle>
          <Badge 
            variant={riskDeltaPositive ? "destructive" : "secondary"}
            className="gap-1"
          >
            {riskDeltaPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {riskDeltaPositive ? "+" : ""}{result.riskDelta}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Risk</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-mono font-bold", getRiskColor(result.currentRisk))}>
                {result.currentRisk}
              </span>
              <Progress value={result.currentRisk} className="flex-1 h-2" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Projected Risk</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-mono font-bold", getRiskColor(result.projectedRisk))}>
                {result.projectedRisk}
              </span>
              <Progress value={result.projectedRisk} className="flex-1 h-2" />
            </div>
          </div>
        </div>

        {result.impactAreas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Impact Areas</p>
            <div className="flex flex-wrap gap-2">
              {result.impactAreas.map((area, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Recommendations</p>
            <ul className="space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
