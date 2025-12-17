import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GitBranch, Search, Loader2, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GitHubLogin } from "./github-login";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
  language: string | null;
  stars: number;
  forks: number;
}

interface GitHubRepoSelectorProps {
  currentRepo?: string;
  onSelectRepo: (owner: string, name: string) => void;
  isLoading?: boolean;
}

export function GitHubRepoSelector({ currentRepo, onSelectRepo, isLoading }: GitHubRepoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Check authentication status
  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });

  // Fetch GitHub repositories if authenticated
  const { data: repos, isLoading: reposLoading } = useQuery<GitHubRepo[]>({
    queryKey: ["/api/github/repositories"],
    queryFn: async () => {
      const res = await fetch("/api/github/repositories", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch repositories");
      }
      return res.json();
    },
    enabled: !!authStatus?.authenticated && !!authStatus?.hasGitHubToken,
  });

  const filteredRepos = repos?.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectRepo = (repo: GitHubRepo) => {
    onSelectRepo(repo.owner, repo.name);
    setOpen(false);
    setSearchQuery("");
  };

  const isAuthenticated = authStatus?.authenticated;

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Repository</DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "Choose a repository from your GitHub account"
              : "Sign in with GitHub to see your repositories"}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Github className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Sign in with GitHub to access your repositories
            </p>
            <GitHubLogin />
          </div>
        ) : (
          <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="pl-9"
              />
            </div>

            {reposLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No repositories found" : "No repositories available"}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo)}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{repo.fullName}</span>
                          {repo.private && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded">Private</span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {repo.language && <span>{repo.language}</span>}
                          <span>⭐ {repo.stars}</span>
                          <span>🍴 {repo.forks}</span>
                          <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

