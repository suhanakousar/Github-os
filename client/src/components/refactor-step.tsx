import { cn } from "@/lib/utils";
import { Check, Circle, ArrowRight } from "lucide-react";

interface RefactorStepProps {
  step: {
    order: number;
    title: string;
    description: string;
    status?: "pending" | "in_progress" | "completed";
  };
  isLast?: boolean;
  className?: string;
}

export function RefactorStep({ step, isLast = false, className }: RefactorStepProps) {
  const getStatusIcon = () => {
    switch (step.status) {
      case "completed":
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        );
      case "in_progress":
        return (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
            <Circle className="w-3 h-3 text-muted-foreground/50" />
          </div>
        );
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          {getStatusIcon()}
          {!isLast && (
            <div className="w-0.5 flex-1 bg-border mt-2" />
          )}
        </div>
        <div className="flex-1 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Step {step.order}
            </span>
          </div>
          <h4 className="font-medium mt-1">{step.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
        </div>
      </div>
    </div>
  );
}
