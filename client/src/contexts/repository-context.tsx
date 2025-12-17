import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface RepositoryContextType {
  selectedRepoId: string | null;
  currentRepoName: string | undefined;
  setSelectedRepo: (repoId: string | null, repoName?: string) => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

const STORAGE_KEY_REPO_ID = "selectedRepositoryId";
const STORAGE_KEY_REPO_NAME = "selectedRepositoryName";

export function RepositoryProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_REPO_ID);
      return stored || null;
    }
    return null;
  });
  
  const [currentRepoName, setCurrentRepoName] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_REPO_NAME);
      return stored || undefined;
    }
    return undefined;
  });

  // Validate stored repository on mount
  useEffect(() => {
    if (selectedRepoId && typeof window !== "undefined") {
      // Verify the repository still exists
      fetch(`/api/repositories`)
        .then((res) => {
          if (!res.ok) {
            // Can't verify, but keep selection
            return;
          }
          return res.json();
        })
        .then((repos) => {
          if (Array.isArray(repos)) {
            const repo = repos.find((r: any) => r.id === selectedRepoId);
            if (!repo) {
              // Repository doesn't exist, clear from storage
              console.warn(`Stored repository ${selectedRepoId} no longer exists, clearing selection`);
              setSelectedRepoId(null);
              setCurrentRepoName(undefined);
              localStorage.removeItem(STORAGE_KEY_REPO_ID);
              localStorage.removeItem(STORAGE_KEY_REPO_NAME);
            } else if (repo.fullName && repo.fullName !== currentRepoName) {
              // Repository exists, ensure name is set
              setCurrentRepoName(repo.fullName);
            }
          }
        })
        .catch((err) => {
          console.error("Error validating stored repository:", err);
          // On error, keep the selection but log the error
        });
    }
  }, []); // Only run on mount

  // Update localStorage whenever the repository changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedRepoId) {
        localStorage.setItem(STORAGE_KEY_REPO_ID, selectedRepoId);
      } else {
        localStorage.removeItem(STORAGE_KEY_REPO_ID);
      }
    }
  }, [selectedRepoId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentRepoName) {
        localStorage.setItem(STORAGE_KEY_REPO_NAME, currentRepoName);
      } else {
        localStorage.removeItem(STORAGE_KEY_REPO_NAME);
      }
    }
  }, [currentRepoName]);

  const setSelectedRepo = (repoId: string | null, repoName?: string) => {
    setSelectedRepoId(repoId);
    setCurrentRepoName(repoName);
  };

  return (
    <RepositoryContext.Provider value={{ selectedRepoId, currentRepoName, setSelectedRepo }}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return context;
}

