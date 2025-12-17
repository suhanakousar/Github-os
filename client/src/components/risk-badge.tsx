import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RiskBadge({ score, showLabel = true, size = "md", className }: RiskBadgeProps) {
  const getRiskLevel = () => {
    if (score >= 80) return { label: "Critical", color: "bg-red-500 dark:bg-red-600 text-white" };
    if (score >= 60) return { label: "High", color: "bg-orange-500 dark:bg-orange-600 text-white" };
    if (score >= 40) return { label: "Medium", color: "bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white" };
    if (score >= 20) return { label: "Low", color: "bg-green-500 dark:bg-green-600 text-white" };
    return { label: "Minimal", color: "bg-blue-500 dark:bg-blue-600 text-white" };
  };

  const { label, color } = getRiskLevel();

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge
      className={cn(
        "font-mono font-medium rounded-full no-default-hover-elevate no-default-active-elevate",
        color,
        sizeClasses[size],
        className
      )}
      data-testid={`risk-badge-${score}`}
    >
      <span className="font-bold mr-1">{score}</span>
      {showLabel && <span className="opacity-90">/ {label}</span>}
    </Badge>
  );
}
