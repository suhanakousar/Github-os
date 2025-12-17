import { useQuery } from "@tanstack/react-query";
import { useRepository } from "@/contexts/repository-context";
import { createRepoQueryFn } from "@/lib/api-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/metric-card";
import { 
  Zap, 
  Bug, 
  RotateCcw, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain
} from "lucide-react";
import type { Prediction } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Prediction data will be fetched from API

const getPredictionIcon = (type: string) => {
  switch (type) {
    case "bug_likelihood": return Bug;
    case "revert_probability": return RotateCcw;
    case "deadline_miss": return Calendar;
    default: return AlertTriangle;
  }
};

const getPredictionColor = (probability: number) => {
  if (probability >= 0.7) return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" };
  if (probability >= 0.4) return { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" };
};

export default function PredictionsPage() {
  const { selectedRepoId } = useRepository();
  
  const { data: predictions, isLoading } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions", selectedRepoId],
    queryFn: createRepoQueryFn<Prediction[]>("/api/predictions", selectedRepoId),
    enabled: !!selectedRepoId,
  });

  const displayPredictions = predictions || [];

  const predictionAccuracyData = displayPredictions.length > 0 ? [
    { type: "Bug Detection", accuracy: 0, predictions: displayPredictions.filter(p => p.predictionType === "bug_likelihood").length },
    { type: "Revert Prediction", accuracy: 0, predictions: displayPredictions.filter(p => p.predictionType === "revert_probability").length },
    { type: "Deadline Risk", accuracy: 0, predictions: displayPredictions.filter(p => p.predictionType === "deadline_miss").length },
  ] : [];
  
  const highRiskCount = displayPredictions.filter(p => p.probability >= 0.7).length;
  const avgConfidence = Math.round(
    displayPredictions.reduce((acc, p) => acc + p.confidence, 0) / displayPredictions.length * 100
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Predictive Failure Engine</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered predictions for bugs, reverts, and deadline risks
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Predictions"
          value={displayPredictions.length}
          icon={<Brain className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="High Risk Items"
          value={highRiskCount}
          variant={highRiskCount > 0 ? "danger" : "default"}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        />
        <MetricCard
          title="Avg Confidence"
          value={`${avgConfidence}%`}
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard
          title="Model Accuracy"
          value="79%"
          trend={4}
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Prediction Accuracy by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={predictionAccuracyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {predictionAccuracyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.accuracy >= 80 ? 'hsl(var(--chart-2))' : 
                              entry.accuracy >= 70 ? 'hsl(var(--chart-4))' : 
                              'hsl(var(--chart-5))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Prediction Logic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Bug Detection</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Analyzes changeset size, complexity, test coverage, and author history
              </p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Revert Prediction</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Examines review thoroughness, CI results, and historical revert patterns
              </p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Deadline Risk</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Compares velocity trends, blocker status, and team capacity
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayPredictions.map((prediction) => {
            const Icon = getPredictionIcon(prediction.predictionType);
            const colors = getPredictionColor(prediction.probability);
            
            return (
              <Card 
                key={prediction.id} 
                className={`overflow-visible border ${colors.border}`}
                data-testid={`prediction-${prediction.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {prediction.targetId}
                        </Badge>
                        <span className="font-medium">
                          {prediction.predictionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2">
                        {prediction.reasoning}
                      </p>
                      
                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Probability</span>
                            <span className={`font-mono font-medium ${colors.color}`}>
                              {Math.round(prediction.probability * 100)}%
                            </span>
                          </div>
                          <Progress value={prediction.probability * 100} className="h-2" />
                        </div>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-mono font-medium">
                              {Math.round(prediction.confidence * 100)}%
                            </span>
                          </div>
                          <Progress value={prediction.confidence * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
