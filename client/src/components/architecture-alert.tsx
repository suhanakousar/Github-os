import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileWarning, 
  GitMerge, 
  Layers, 
  FolderTree,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchitectureDrift } from "@shared/schema";

interface ArchitectureAlertProps {
  drift: ArchitectureDrift;
  onViewDetails?: (drift: ArchitectureDrift) => void;
  className?: string;
}

export function ArchitectureAlert({ drift, onViewDetails, className }: ArchitectureAlertProps) {
  const getDriftIcon = () => {
    switch (drift.driftType) {
      case "god_file":
        return <FileWarning className="w-4 h-4" />;
      case "circular_dependency":
        return <GitMerge className="w-4 h-4" />;
      case "boundary_blur":
        return <Layers className="w-4 h-4" />;
      case "structure_degradation":
        return <FolderTree className="w-4 h-4" />;
      default:
        return <FileWarning className="w-4 h-4" />;
    }
  };

  const getSeverityConfig = () => {
    switch (drift.severity) {
      case "critical":
        return { color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", border: "border-l-red-500" };
      case "high":
        return { color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-l-orange-500" };
      case "medium":
        return { color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-500/10", border: "border-l-yellow-500" };
      default:
        return { color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-l-blue-500" };
    }
  };

  const config = getSeverityConfig();
  const affectedFiles = (drift.affectedFiles as string[]) || [];

  return (
    <Card 
      className={cn("overflow-visible border-l-4", config.border, className)} 
      data-testid={`drift-alert-${drift.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0", config.bg, config.color)}>
            {getDriftIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">
                {drift.driftType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <Badge variant="outline" className={cn("text-xs", config.color)}>
                {drift.severity?.toUpperCase()}
              </Badge>
              {drift.isResolved && (
                <Badge variant="secondary" className="text-xs">
                  Resolved
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {drift.description}
            </p>
            
            {affectedFiles.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Affected:</span>
                {affectedFiles.slice(0, 3).map((file, i) => (
                  <code key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {file}
                  </code>
                ))}
                {affectedFiles.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{affectedFiles.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {drift.suggestion && (
              <div className="flex items-start gap-2 mt-3 p-2 rounded-md bg-muted/50">
                <Lightbulb className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{drift.suggestion}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails?.(drift)}
            data-testid={`view-drift-${drift.id}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
