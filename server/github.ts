import { Octokit } from "@octokit/rest";

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description || null,
        defaultBranch: data.default_branch || "main",
        healthScore: this.calculateHealthScore(data),
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`);
      }
      throw error;
    }
  }

  async getContributors(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      });

      const contributors = await Promise.all(
        data
          .filter((c) => c.type === "User")
          .slice(0, 50)
          .map(async (contributor) => {
            try {
              const { data: user } = await this.octokit.users.getByUsername({
                username: contributor.login,
              });

              // Get user's commits and PRs for this repo
              const { data: commits } = await this.octokit.repos.listCommits({
                owner,
                repo,
                author: contributor.login,
                per_page: 1,
              });

              const { data: prs } = await this.octokit.search.issuesAndPullRequests({
                q: `repo:${owner}/${repo} author:${contributor.login} type:pr`,
                per_page: 1,
              });

              return {
                username: contributor.login,
                avatarUrl: user.avatar_url,
                totalCommits: contributor.contributions || 0,
                totalPRs: prs.total_count || 0,
                totalReviews: 0, // Would need to fetch separately
                qualityScore: this.calculateQualityScore(contributor.contributions || 0),
                reviewReliability: 75, // Default, would need PR review data
                riskProfile: this.calculateRiskProfile(contributor.contributions || 0),
                isSinglePointOfFailure: false, // Would need analysis
                lastActiveAt: commits[0]?.commit.author?.date
                  ? new Date(commits[0].commit.author.date)
                  : null,
              };
            } catch (err) {
              return {
                username: contributor.login,
                avatarUrl: contributor.avatar_url || null,
                totalCommits: contributor.contributions || 0,
                totalPRs: 0,
                totalReviews: 0,
                qualityScore: 50,
                reviewReliability: 50,
                riskProfile: "normal" as const,
                isSinglePointOfFailure: false,
                lastActiveAt: null,
              };
            }
          })
      );

      return contributors;
    } catch (error: any) {
      console.error("Error fetching contributors:", error);
      return [];
    }
  }

  async getPullRequests(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: 100,
        sort: "updated",
      });
      return data;
    } catch (error) {
      console.error("Error fetching pull requests:", error);
      return [];
    }
  }

  async getIssues(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 100,
      });
      return data.filter((issue) => !issue.pull_request); // Exclude PRs
    } catch (error) {
      console.error("Error fetching issues:", error);
      return [];
    }
  }

  async getCommits(owner: string, repo: string, since?: Date) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        since: since?.toISOString(),
        per_page: 100,
      });
      return data;
    } catch (error) {
      console.error("Error fetching commits:", error);
      return [];
    }
  }

  async getRepositoryMetrics(owner: string, repo: string) {
    try {
      const [repoData, contributors, prs, issues, commits] = await Promise.all([
        this.getRepository(owner, repo),
        this.getContributors(owner, repo),
        this.getPullRequests(owner, repo, "open"),
        this.getIssues(owner, repo, "open"),
        this.getCommits(owner, repo, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
      ]);

      const openPRs = prs.length;
      const openIssues = issues.length;
      const recentCommits = commits.length;
      const activeContributors = new Set(commits.map((c) => c.author?.login).filter(Boolean)).size;

      // Calculate velocity (commits per day over last 30 days)
      const velocity = recentCommits / 30;

      // Calculate review time (would need PR review data, using estimate)
      const avgReviewTime = 2.3; // days (would calculate from actual PR data)

      return {
        healthScore: repoData.healthScore,
        healthTrend: 0, // Would calculate from historical data
        highRiskPRs: 0, // Would analyze PRs
        architectureWarnings: 0, // Would analyze code structure
        velocityTrend: velocity > 5 ? 12 : velocity > 2 ? 5 : -5,
        activeContributors,
        pendingReviews: openPRs,
        governanceViolations: 0, // Would check against rules
      };
    } catch (error) {
      console.error("Error fetching repository metrics:", error);
      throw error;
    }
  }

  private calculateHealthScore(repo: any): number {
    let score = 50; // Base score

    // Factors that increase health
    if (repo.stargazers_count > 100) score += 10;
    if (repo.stargazers_count > 1000) score += 10;
    if (repo.watchers_count > 50) score += 5;
    if (repo.open_issues_count < 10) score += 10;
    if (repo.archived === false) score += 5;
    if (repo.disabled === false) score += 5;
    if (repo.license) score += 5;

    // Factors that decrease health
    if (repo.open_issues_count > 100) score -= 10;
    if (repo.archived === true) score -= 20;
    if (repo.disabled === true) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private calculateQualityScore(contributions: number): number {
    if (contributions > 1000) return 90;
    if (contributions > 500) return 80;
    if (contributions > 100) return 70;
    if (contributions > 50) return 60;
    if (contributions > 10) return 50;
    return 40;
  }

  private calculateRiskProfile(contributions: number): "low" | "normal" | "high" {
    if (contributions > 500) return "high";
    if (contributions < 10) return "low";
    return "normal";
  }

  async getRepositoryTree(owner: string, repo: string, branch: string = "main", path: string = ""): Promise<any[]> {
    try {
      console.log(`Fetching repository tree for ${owner}/${repo} (branch: ${branch})`);
      
      // First get the branch reference to get the SHA
      let commitSha: string;
      try {
        const { data: refData } = await this.octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });
        commitSha = refData.object.sha;
      } catch (refError: any) {
        // If branch ref fails, try to get default branch from repo info
        console.log(`Could not get branch ref for ${branch}, trying default branch`);
        const repoInfo = await this.getRepository(owner, repo);
        const defaultBranch = repoInfo.defaultBranch || "main";
        if (defaultBranch !== branch) {
          const { data: refData } = await this.octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${defaultBranch}`,
          });
          commitSha = refData.object.sha;
        } else {
          throw refError;
        }
      }
      
      // Get the commit to get the tree SHA
      const { data: commitData } = await this.octokit.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
      });
      
      // Get the tree recursively
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: commitData.tree.sha,
        recursive: "1",
      });
      
      console.log(`Fetched tree with ${data.tree?.length || 0} items`);
      
      // Filter for code files
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php', '.swift', '.kt', '.vue', '.svelte'];
      const codeFiles = (data.tree || []).filter((item: any) => 
        item.type === 'blob' && 
        item.path &&
        codeExtensions.some(ext => item.path.endsWith(ext))
      );
      
      console.log(`Filtered to ${codeFiles.length} code files`);
      return codeFiles;
    } catch (error: any) {
      console.error(`Error fetching repository tree for ${owner}/${repo}:`, error);
      console.error(`Error details:`, {
        status: error.status,
        message: error.message,
        response: error.response?.data,
      });
      
      // If tree fetch fails, try simpler approach with getContent (recursive)
      if (error.status === 404 || error.status === 409 || error.status === 422 || error.status === 403) {
        console.log(`Trying fallback method: getContent for ${owner}/${repo}`);
        try {
          const codeFiles: any[] = [];
          const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php', '.swift', '.kt', '.vue', '.svelte'];
          
          // Try to get root directory
          const { data: rootContent } = await this.octokit.repos.getContent({
            owner,
            repo,
            path: path || "",
          });
          
          if (Array.isArray(rootContent)) {
            // Recursively get files from subdirectories (limited depth)
            const getFilesRecursive = async (items: any[], depth: number = 0): Promise<any[]> => {
              if (depth > 3) return []; // Limit recursion depth
              
              const files: any[] = [];
              for (const item of items) {
                if (item.type === 'file' && codeExtensions.some(ext => item.path.endsWith(ext))) {
                  files.push(item);
                } else if (item.type === 'dir' && depth < 3) {
                  try {
                    const { data: dirContent } = await this.octokit.repos.getContent({
                      owner,
                      repo,
                      path: item.path,
                    });
                    if (Array.isArray(dirContent)) {
                      files.push(...await getFilesRecursive(dirContent, depth + 1));
                    }
                  } catch (err) {
                    // Skip directories we can't access
                  }
                }
              }
              return files;
            };
            
            const foundFiles = await getFilesRecursive(rootContent);
            console.log(`Fallback method found ${foundFiles.length} code files`);
            return foundFiles;
          }
          return [];
        } catch (err) {
          console.error(`Error in fallback method for ${owner}/${repo}:`, err);
          return [];
        }
      }
      return [];
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      
      if ('content' in data && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      return null;
    }
  }
}

