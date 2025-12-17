import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GitBranch, Search, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RepositorySelectorProps {
  currentRepo?: string;
  onSelectRepo: (owner: string, name: string) => void;
  isLoading?: boolean;
}

export function RepositorySelector({ currentRepo, onSelectRepo, isLoading }: RepositorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
    if (!match) {
      const simpleMatch = repoUrl.match(/^([^\/]+)\/([^\/\s]+)$/);
      if (simpleMatch) {
        onSelectRepo(simpleMatch[1], simpleMatch[2].replace('.git', ''));
        setOpen(false);
        setRepoUrl("");
        return;
      }
      
      toast({
        title: "Invalid repository",
        description: "Please enter a valid GitHub repository URL or owner/name format",
        variant: "destructive",
      });
      return;
    }

    onSelectRepo(match[1], match[2].replace('.git', ''));
    setOpen(false);
    setRepoUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-select-repo">
          <GitBranch className="w-4 h-4" />
          {currentRepo ? (
            <span className="font-mono text-sm">{currentRepo}</span>
          ) : (
            <span>Select Repository</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Repository</DialogTitle>
          <DialogDescription>
            Enter a GitHub repository URL or owner/name to analyze
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo or owner/repo"
              className="pl-9"
              data-testid="input-repo-url"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !repoUrl.trim()} data-testid="button-connect-repo">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
