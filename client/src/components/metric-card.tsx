import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="w-3 h-3" />;
    }
    return trend > 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    if (variant === "danger") {
      return trend > 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
    }
    return trend > 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-l-4 border-l-green-500 dark:border-l-green-400";
      case "warning":
        return "border-l-4 border-l-yellow-500 dark:border-l-yellow-400";
      case "danger":
        return "border-l-4 border-l-red-500 dark:border-l-red-400";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("overflow-visible", getVariantStyles(), className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-semibold tracking-tight font-mono" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span className="font-mono">
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>
                {trendLabel && (
                  <span className="text-muted-foreground ml-1">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
