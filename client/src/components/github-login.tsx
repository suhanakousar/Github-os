import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function GitHubLogin() {
  const handleLogin = () => {
    window.location.href = "/api/auth/github";
  };

  return (
    <Button onClick={handleLogin} className="gap-2">
      <Github className="w-4 h-4" />
      Sign in with GitHub
    </Button>
  );
}

