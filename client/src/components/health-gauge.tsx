import { cn } from "@/lib/utils";

interface HealthGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function HealthGauge({ score, size = "md", showLabel = true, className }: HealthGaugeProps) {
  const getColor = () => {
    if (score >= 80) return { stroke: "#22c55e", label: "Excellent" };
    if (score >= 60) return { stroke: "#84cc16", label: "Good" };
    if (score >= 40) return { stroke: "#eab308", label: "Fair" };
    if (score >= 20) return { stroke: "#f97316", label: "Poor" };
    return { stroke: "#ef4444", label: "Critical" };
  };

  const { stroke, label } = getColor();
  
  const sizes = {
    sm: { container: 80, strokeWidth: 6, fontSize: "text-lg" },
    md: { container: 120, strokeWidth: 8, fontSize: "text-2xl" },
    lg: { container: 160, strokeWidth: 10, fontSize: "text-3xl" },
  };

  const config = sizes[size];
  const radius = (config.container - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: config.container, height: config.container }}>
        <svg
          width={config.container}
          height={config.container}
          className="transform -rotate-90"
        >
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted opacity-20"
          />
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-mono font-bold", config.fontSize)} data-testid="health-score">
            {score}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            / 100
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: stroke }}>
          {label}
        </span>
      )}
    </div>
  );
}
