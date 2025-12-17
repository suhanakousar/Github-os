import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import type { IStorage } from "./storage";
import type {
  Repository,
  InsertRepository,
  KnowledgeNode,
  InsertKnowledgeNode,
  KnowledgeEdge,
  InsertKnowledgeEdge,
  RiskAnalysis,
  InsertRiskAnalysis,
  Contributor,
  InsertContributor,
  TemporalMetric,
  InsertTemporalMetric,
  ArchitectureDrift,
  InsertArchitectureDrift,
  GovernanceRule,
  InsertGovernanceRule,
  SprintAnalysis,
  InsertSprintAnalysis,
  Prediction,
  InsertPrediction,
  Simulation,
  InsertSimulation,
  RefactorPlan,
  InsertRefactorPlan,
  User,
  InsertUser,
  DashboardMetrics,
  TemporalInsight,
} from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { GitHubService } from "./github";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class DbStorage implements IStorage {
  private github: GitHubService;

  constructor() {
    this.github = new GitHubService();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(schema.users).values(user).returning();
    return result;
  }

  // Repositories
  async getRepository(id: string): Promise<Repository | undefined> {
    const result = await db.select().from(schema.repositories).where(eq(schema.repositories.id, id)).limit(1);
    return result[0];
  }

  async getRepositoryByFullName(fullName: string): Promise<Repository | undefined> {
    try {
      const result = await db
        .select()
        .from(schema.repositories)
        .where(eq(schema.repositories.fullName, fullName))
        .limit(1);
      return result[0];
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        throw new Error(`Database tables not found. Please run 'npm run db:push' to create the required tables.`);
      }
      throw error;
    }
  }

  async createRepository(repo: InsertRepository): Promise<Repository> {
    try {
      // If repository exists, fetch from GitHub to update data
      const existing = await this.getRepositoryByFullName(repo.fullName);
      if (existing) {
        try {
          const githubData = await this.github.getRepository(repo.owner, repo.name);
          const updated = await db
            .update(schema.repositories)
            .set({
              description: githubData.description,
              defaultBranch: githubData.defaultBranch,
              healthScore: githubData.healthScore,
              lastAnalyzedAt: new Date(),
            })
            .where(eq(schema.repositories.id, existing.id))
            .returning();
          
          // Check if knowledge graph and temporal metrics need to be populated
          const existingNodes = await this.getKnowledgeNodes(existing.id);
          const existingMetrics = await this.getTemporalMetrics(existing.id);
          if (existingNodes.length === 0) {
            // Populate knowledge graph asynchronously if empty
            this.populateKnowledgeGraph(existing.id, repo.owner, repo.name).catch(err => {
              console.error("Error populating knowledge graph:", err);
            });
          }
          if (existingMetrics.length === 0) {
            // Populate temporal metrics asynchronously if empty
            this.populateTemporalMetrics(existing.id, repo.owner, repo.name).catch(err => {
              console.error("Error populating temporal metrics:", err);
            });
          }
          
          const existingDrifts = await this.getArchitectureDrifts(existing.id);
          if (existingDrifts.length === 0) {
            // Populate architecture drifts asynchronously if empty
            this.populateArchitectureDrifts(existing.id, repo.owner, repo.name).catch(err => {
              console.error("Error populating architecture drifts:", err);
            });
          }
          
          return updated[0];
        } catch (error: any) {
          console.error("Error updating repository from GitHub:", error);
          return existing;
        }
      }

      // Fetch from GitHub if not exists
      try {
        const githubData = await this.github.getRepository(repo.owner, repo.name);
        const [result] = await db
          .insert(schema.repositories)
          .values({
            ...repo,
            description: githubData.description,
            defaultBranch: githubData.defaultBranch,
            healthScore: githubData.healthScore,
            lastAnalyzedAt: new Date(),
          })
          .returning();
        
        // Populate knowledge graph, temporal metrics, and architecture drifts asynchronously
        this.populateKnowledgeGraph(result.id, repo.owner, repo.name).catch(err => {
          console.error("Error populating knowledge graph:", err);
        });
        this.populateTemporalMetrics(result.id, repo.owner, repo.name).catch(err => {
          console.error("Error populating temporal metrics:", err);
        });
        this.populateArchitectureDrifts(result.id, repo.owner, repo.name).catch(err => {
          console.error("Error populating architecture drifts:", err);
        });
        
        return result;
      } catch (error: any) {
        // If GitHub fetch fails, check if it's a 404 (repo not found)
        if (error?.status === 404 || error?.message?.includes("not found")) {
          throw new Error(`Repository ${repo.owner}/${repo.name} not found on GitHub. Please check the repository name and ensure it exists.`);
        }
        // For other errors (rate limits, network issues), still create with provided data
        console.error("Error fetching repository from GitHub:", error);
        console.error("GitHub error details:", {
          message: error?.message,
          status: error?.status,
          response: error?.response?.data,
        });
        try {
          const [result] = await db.insert(schema.repositories).values(repo).returning();
          return result;
        } catch (dbError: any) {
          console.error("Error inserting repository into database:", dbError);
          console.error("Database error details:", {
            message: dbError?.message,
            code: dbError?.code,
            detail: dbError?.detail,
            constraint: dbError?.constraint,
            table: dbError?.table,
          });
          
          let dbErrorMessage = dbError?.message || dbError?.detail || "Database error";
          
          // Check if it's a "relation does not exist" error (table missing)
          if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
            dbErrorMessage = `Database tables not found. Please run 'npm run db:push' to create the required tables. Original error: ${dbError?.message || dbError?.detail}`;
          } else if (dbError?.code === '23505') {
            dbErrorMessage = `Repository already exists: ${dbError?.detail || dbError?.message}`;
          } else if (dbError?.code === '23503') {
            dbErrorMessage = `Foreign key constraint violation: ${dbError?.detail || dbError?.message}`;
          }
          
          throw new Error(`Failed to create repository: ${dbErrorMessage}`);
        }
      }
    } catch (error: any) {
      // Re-throw if it's already a formatted error
      if (error?.message && error.message.includes("not found") || error.message.includes("Failed to create repository")) {
        throw error;
      }
      // Otherwise, wrap it
      console.error("Unexpected error in createRepository:", error);
      throw new Error(`Failed to create repository: ${error?.message || error?.toString() || "Unknown error"}`);
    }
  }

  async updateRepository(id: string, data: Partial<InsertRepository>): Promise<Repository | undefined> {
    const [result] = await db
      .update(schema.repositories)
      .set({ ...data, lastAnalyzedAt: new Date() })
      .where(eq(schema.repositories.id, id))
      .returning();
    return result;
  }

  async listRepositories(): Promise<Repository[]> {
    return await db.select().from(schema.repositories);
  }

  // Knowledge Graph
  async populateKnowledgeGraph(repositoryId: string, owner: string, name: string): Promise<void> {
    try {
      console.log(`Populating knowledge graph for ${owner}/${name}...`);
      
      // Fetch data from GitHub
      const [contributors, prs, issues, commits] = await Promise.all([
        this.github.getContributors(owner, name).catch(() => []),
        this.github.getPullRequests(owner, name, "all").catch(() => []),
        this.github.getIssues(owner, name, "all").catch(() => []),
        this.github.getCommits(owner, name).catch(() => []),
      ]);

      const nodeMap = new Map<string, string>(); // nodeId -> database node id

      // Create contributor nodes
      for (const contributor of contributors.slice(0, 20)) {
        const nodeId = `contributor:${contributor.username}`;
        const node = await this.createKnowledgeNode({
          repositoryId,
          nodeType: "contributor",
          nodeId,
          label: contributor.username,
          metadata: {
            avatarUrl: contributor.avatarUrl,
            totalCommits: contributor.totalCommits,
            totalPRs: contributor.totalPRs,
          },
        });
        nodeMap.set(nodeId, node.id);
      }

      // Create PR nodes
      for (const pr of prs.slice(0, 30)) {
        const nodeId = `pr:${pr.number}`;
        const node = await this.createKnowledgeNode({
          repositoryId,
          nodeType: "pr",
          nodeId,
          label: `PR #${pr.number}: ${pr.title || 'Untitled'}`,
          metadata: {
            number: pr.number,
            title: pr.title,
            state: pr.state,
            author: pr.user?.login,
          },
        });
        nodeMap.set(nodeId, node.id);

        // Create edge from PR to contributor
        if (pr.user?.login) {
          const contributorNodeId = `contributor:${pr.user.login}`;
          const contributorDbId = nodeMap.get(contributorNodeId);
          if (contributorDbId) {
            await this.createKnowledgeEdge({
              repositoryId,
              sourceNodeId: contributorDbId,
              targetNodeId: node.id,
              edgeType: "owns",
              weight: 1,
            });
          }
        }
      }

      // Create issue nodes
      for (const issue of issues.slice(0, 30)) {
        const nodeId = `issue:${issue.number}`;
        const node = await this.createKnowledgeNode({
          repositoryId,
          nodeType: "issue",
          nodeId,
          label: `Issue #${issue.number}: ${issue.title || 'Untitled'}`,
          metadata: {
            number: issue.number,
            title: issue.title,
            state: issue.state,
            author: issue.user?.login,
          },
        });
        nodeMap.set(nodeId, node.id);

        // Create edge from issue to contributor
        if (issue.user?.login) {
          const contributorNodeId = `contributor:${issue.user.login}`;
          const contributorDbId = nodeMap.get(contributorNodeId);
          if (contributorDbId) {
            await this.createKnowledgeEdge({
              repositoryId,
              sourceNodeId: contributorDbId,
              targetNodeId: node.id,
              edgeType: "owns",
              weight: 1,
            });
          }
        }
      }

      // Create commit nodes
      for (const commit of commits.slice(0, 50)) {
        const nodeId = `commit:${commit.sha}`;
        const node = await this.createKnowledgeNode({
          repositoryId,
          nodeType: "commit",
          nodeId,
          label: commit.commit?.message?.split('\n')[0] || commit.sha.substring(0, 7),
          metadata: {
            sha: commit.sha,
            message: commit.commit?.message,
            author: commit.author?.login || commit.commit?.author?.name,
          },
        });
        nodeMap.set(nodeId, node.id);

        // Create edge from commit to contributor
        if (commit.author?.login) {
          const contributorNodeId = `contributor:${commit.author.login}`;
          const contributorDbId = nodeMap.get(contributorNodeId);
          if (contributorDbId) {
            await this.createKnowledgeEdge({
              repositoryId,
              sourceNodeId: contributorDbId,
              targetNodeId: node.id,
              edgeType: "modified_by",
              weight: 1,
            });
          }
        }
      }

      console.log(`Knowledge graph populated: ${nodeMap.size} nodes created`);
    } catch (error) {
      console.error("Error populating knowledge graph:", error);
      // Don't throw - allow repository creation to succeed even if graph population fails
    }
  }

  async populateTemporalMetrics(repositoryId: string, owner: string, name: string, forceRefresh: boolean = false): Promise<void> {
    try {
      console.log(`Populating temporal metrics for ${owner}/${name}...`);

      // Check if metrics already exist (unless forcing refresh)
      if (!forceRefresh) {
        const existingMetrics = await this.getTemporalMetrics(repositoryId);
        if (existingMetrics.length > 0) {
          console.log(`Temporal metrics already exist for ${owner}/${name} (${existingMetrics.length} records), skipping population`);
          return;
        }
      } else {
        // If forcing refresh, delete existing metrics first
        console.log(`Force refresh requested, clearing existing temporal metrics for ${owner}/${name}`);
        const existingMetrics = await this.getTemporalMetrics(repositoryId);
        if (existingMetrics.length > 0) {
          // Delete existing metrics
          await db.delete(schema.temporalMetrics)
            .where(eq(schema.temporalMetrics.repositoryId, repositoryId));
          console.log(`Deleted ${existingMetrics.length} existing temporal metrics`);
        }
      }

      // Fetch data from GitHub for the last 8 weeks
      const now = new Date();
      const weeks: Array<{ start: Date; end: Date }> = [];
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 7);
        weeks.push({ start, end });
      }

      const metrics = [];

      // Fetch all commits and PRs once (more efficient)
      const [allCommits, allPRs] = await Promise.all([
        this.github.getCommits(owner, name).catch((err) => {
          console.error(`Error fetching commits for ${owner}/${name}:`, err);
          return [];
        }),
        this.github.getPullRequests(owner, name, "all").catch((err) => {
          console.error(`Error fetching PRs for ${owner}/${name}:`, err);
          return [];
        }),
      ]);

      console.log(`Fetched ${allCommits.length} commits and ${allPRs.length} PRs for temporal metrics`);

      for (const week of weeks) {
        // Filter commits and PRs for this week
        const weekCommits = allCommits.filter(c => {
          const commitDate = new Date(c.commit?.author?.date || c.commit?.committer?.date || 0);
          return commitDate >= week.start && commitDate < week.end;
        });

        const weekPRs = allPRs.filter(pr => {
          const prDate = new Date(pr.created_at);
          return prDate >= week.start && prDate < week.end;
        });

        // Calculate metrics
        const commitFrequency = weekCommits.length;
        const uniqueContributors = new Set(weekCommits.map(c => c.author?.login || c.commit?.author?.name).filter(Boolean));
        const contributorActivity = uniqueContributors.size;

        // Calculate velocity (commits + PRs weighted)
        const velocity = commitFrequency * 0.7 + weekPRs.length * 0.3;

        // Calculate code churn (additions - deletions) / (additions + deletions)
        let totalAdditions = 0;
        let totalDeletions = 0;
        for (const pr of weekPRs.slice(0, 10)) {
          totalAdditions += pr.additions || 0;
          totalDeletions += pr.deletions || 0;
        }
        const codeChurn = totalAdditions + totalDeletions > 0 
          ? (totalAdditions - totalDeletions) / (totalAdditions + totalDeletions)
          : 0;

        // Calculate average PR review time (simplified - using PR age)
        let totalReviewTime = 0;
        let reviewedPRs = 0;
        for (const pr of weekPRs) {
          if (pr.merged_at || pr.closed_at) {
            const created = new Date(pr.created_at);
            const closed = new Date(pr.merged_at || pr.closed_at);
            const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
            totalReviewTime += hours;
            reviewedPRs++;
          }
        }
        const prReviewTime = reviewedPRs > 0 ? totalReviewTime / reviewedPRs : 0;

        // Create temporal metric
        await this.createTemporalMetric({
          repositoryId,
          metricDate: week.end,
          velocity: Math.round(velocity * 10) / 10,
          codeChurn: Math.round(codeChurn * 100) / 100,
          prReviewTime: Math.round(prReviewTime * 10) / 10,
          commitFrequency,
          contributorActivity,
        });

        metrics.push({ week: week.end, velocity, commitFrequency, contributorActivity });
      }

      console.log(`Temporal metrics populated: ${metrics.length} weeks of data for ${owner}/${name}`);
    } catch (error) {
      console.error(`Error populating temporal metrics for ${owner}/${name}:`, error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async getKnowledgeNodes(repositoryId: string): Promise<KnowledgeNode[]> {
    return await db
      .select()
      .from(schema.knowledgeNodes)
      .where(eq(schema.knowledgeNodes.repositoryId, repositoryId));
  }

  async createKnowledgeNode(node: InsertKnowledgeNode): Promise<KnowledgeNode> {
    const [result] = await db.insert(schema.knowledgeNodes).values(node).returning();
    return result;
  }

  async getKnowledgeEdges(repositoryId: string): Promise<KnowledgeEdge[]> {
    return await db
      .select()
      .from(schema.knowledgeEdges)
      .where(eq(schema.knowledgeEdges.repositoryId, repositoryId));
  }

  async createKnowledgeEdge(edge: InsertKnowledgeEdge): Promise<KnowledgeEdge> {
    const [result] = await db.insert(schema.knowledgeEdges).values(edge).returning();
    return result;
  }

  // Risk Analysis
  async getRiskAnalyses(repositoryId: string): Promise<RiskAnalysis[]> {
    return await db
      .select()
      .from(schema.riskAnalyses)
      .where(eq(schema.riskAnalyses.repositoryId, repositoryId));
  }

  async getRiskAnalysisByPR(repositoryId: string, prNumber: number): Promise<RiskAnalysis | undefined> {
    const result = await db
      .select()
      .from(schema.riskAnalyses)
      .where(
        and(
          eq(schema.riskAnalyses.repositoryId, repositoryId),
          eq(schema.riskAnalyses.prNumber, prNumber)
        )
      )
      .limit(1);
    return result[0];
  }

  async createRiskAnalysis(analysis: InsertRiskAnalysis): Promise<RiskAnalysis> {
    const [result] = await db.insert(schema.riskAnalyses).values(analysis).returning();
    return result;
  }

  async getHighRiskAnalyses(repositoryId: string): Promise<RiskAnalysis[]> {
    return await db
      .select()
      .from(schema.riskAnalyses)
      .where(
        and(
          eq(schema.riskAnalyses.repositoryId, repositoryId),
          gte(schema.riskAnalyses.overallRisk, 60)
        )
      );
  }

  // Contributors - Fetch from GitHub
  async getContributors(repositoryId: string): Promise<Contributor[]> {
    // First check database
    const dbContributors = await db
      .select()
      .from(schema.contributors)
      .where(eq(schema.contributors.repositoryId, repositoryId));

    // If we have contributors in DB, return them
    if (dbContributors.length > 0) {
      return dbContributors;
    }

    // Otherwise, fetch from GitHub
    const repo = await this.getRepository(repositoryId);
    if (!repo) {
      return [];
    }

    try {
      const githubContributors = await this.github.getContributors(repo.owner, repo.name);
      
      // Save to database
      const contributorsList = await Promise.all(
        githubContributors.map(async (contrib) => {
          const [result] = await db
            .insert(schema.contributors)
            .values({
              repositoryId,
              ...contrib,
            })
            .returning();
          return result;
        })
      );

      return contributorsList;
    } catch (error) {
      console.error("Error fetching contributors from GitHub:", error);
      return [];
    }
  }

  async getContributorByUsername(repositoryId: string, username: string): Promise<Contributor | undefined> {
    const result = await db
      .select()
      .from(schema.contributors)
      .where(
        and(
          eq(schema.contributors.repositoryId, repositoryId),
          eq(schema.contributors.username, username)
        )
      )
      .limit(1);
    return result[0];
  }

  async createContributor(contributor: InsertContributor): Promise<Contributor> {
    const [result] = await db.insert(schema.contributors).values(contributor).returning();
    return result;
  }

  async updateContributor(id: string, data: Partial<InsertContributor>): Promise<Contributor | undefined> {
    const [result] = await db
      .update(schema.contributors)
      .set(data)
      .where(eq(schema.contributors.id, id))
      .returning();
    return result;
  }

  // Temporal Metrics
  async getTemporalMetrics(repositoryId: string): Promise<TemporalMetric[]> {
    return await db
      .select()
      .from(schema.temporalMetrics)
      .where(eq(schema.temporalMetrics.repositoryId, repositoryId));
  }

  async createTemporalMetric(metric: InsertTemporalMetric): Promise<TemporalMetric> {
    const [result] = await db.insert(schema.temporalMetrics).values(metric).returning();
    return result;
  }

  // Architecture Drifts
  async getArchitectureDrifts(repositoryId: string): Promise<ArchitectureDrift[]> {
    return await db
      .select()
      .from(schema.architectureDrifts)
      .where(eq(schema.architectureDrifts.repositoryId, repositoryId));
  }

  async createArchitectureDrift(drift: InsertArchitectureDrift): Promise<ArchitectureDrift> {
    const [result] = await db.insert(schema.architectureDrifts).values(drift).returning();
    return result;
  }

  async updateArchitectureDrift(
    id: string,
    data: Partial<InsertArchitectureDrift>
  ): Promise<ArchitectureDrift | undefined> {
    const [result] = await db
      .update(schema.architectureDrifts)
      .set(data)
      .where(eq(schema.architectureDrifts.id, id))
      .returning();
    return result;
  }

  async populateArchitectureDrifts(repositoryId: string, owner: string, name: string, forceRefresh: boolean = false): Promise<void> {
    try {
      console.log(`Populating architecture drifts for ${owner}/${name}...`);

      // Check if drifts already exist (unless forcing refresh)
      if (!forceRefresh) {
        const existingDrifts = await this.getArchitectureDrifts(repositoryId);
        if (existingDrifts.length > 0) {
          console.log(`Architecture drifts already exist for ${owner}/${name} (${existingDrifts.length} records), skipping population`);
          return;
        }
      } else {
        // If forcing refresh, delete existing drifts first
        console.log(`Force refresh requested, clearing existing architecture drifts for ${owner}/${name}`);
        const existingDrifts = await this.getArchitectureDrifts(repositoryId);
        if (existingDrifts.length > 0) {
          await db.delete(schema.architectureDrifts)
            .where(eq(schema.architectureDrifts.repositoryId, repositoryId));
          console.log(`Deleted ${existingDrifts.length} existing architecture drifts`);
        }
      }

      // Get repository info to find default branch
      const repoInfo = await this.github.getRepository(owner, name);
      const defaultBranch = repoInfo.defaultBranch || "main";

      // Get repository tree
      const tree = await this.github.getRepositoryTree(owner, name, defaultBranch);
      console.log(`Found ${tree.length} code files in repository`);

      if (tree.length === 0) {
        console.log(`No code files found for ${owner}/${name}, skipping architecture drift detection`);
        return;
      }

      // Analyze files for architectural issues
      const drifts: Array<{
        driftType: string;
        severity: "low" | "medium" | "high" | "critical";
        affectedFiles: string[];
        description: string;
        suggestion: string;
      }> = [];

      // Group files by directory
      const filesByDir = new Map<string, string[]>();
      const fileSizes = new Map<string, number>();

      for (const file of tree.slice(0, 100)) { // Limit to first 100 files for performance
        const path = file.path || (file as any).name || "";
        if (!path) continue;
        
        const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '/';
        
        if (!filesByDir.has(dir)) {
          filesByDir.set(dir, []);
        }
        filesByDir.get(dir)!.push(path);
        
        // Get actual file size from tree item
        const size = (file as any).size || 0;
        fileSizes.set(path, size);
      }

      console.log(`Analyzing ${fileSizes.size} files across ${filesByDir.size} directories`);

      // Detect God Files (very large files) - lower threshold for detection
      for (const [path, size] of fileSizes.entries()) {
        if (size > 10000) { // Lower threshold: 10KB (more realistic for code files)
          drifts.push({
            driftType: "god_file",
            severity: size > 50000 ? "critical" : size > 30000 ? "high" : size > 20000 ? "medium" : "low",
            affectedFiles: [path],
            description: `File ${path} is large (${Math.round(size / 1024)}KB), indicating it may have too many responsibilities.`,
            suggestion: "Consider breaking this file into smaller, focused modules with single responsibilities.",
          });
        }
      }

      // Detect Structure Degradation (too many files in one directory) - lower threshold
      for (const [dir, files] of filesByDir.entries()) {
        if (files.length > 15) { // Lower threshold: 15 files
          drifts.push({
            driftType: "structure_degradation",
            severity: files.length > 40 ? "high" : files.length > 25 ? "medium" : "low",
            affectedFiles: files.slice(0, 10), // Show first 10 files
            description: `Directory ${dir || 'root'} contains ${files.length} files, indicating potential structure degradation.`,
            suggestion: "Consider organizing files into subdirectories based on functionality or feature.",
          });
        }
      }

      // Detect Boundary Blur (files in wrong locations - simple heuristic)
      const allFiles = Array.from(fileSizes.keys());
      const srcFiles = allFiles.filter(p => p.includes('/src/') || p.includes('/lib/') || p.includes('/app/'));
      const testFiles = allFiles.filter(p => 
        p.includes('/test/') || 
        p.includes('/__tests__/') || 
        p.includes('/tests/') ||
        p.includes('.test.') ||
        p.includes('.spec.')
      );
      
      if (srcFiles.length > 5 && testFiles.length === 0 && allFiles.length > 10) {
        drifts.push({
          driftType: "boundary_blur",
          severity: "low",
          affectedFiles: srcFiles.slice(0, 5),
          description: "No test files detected in the repository structure despite having source files.",
          suggestion: "Consider adding a test directory and test files to improve code quality and maintainability.",
        });
      }

      // If no drifts detected but we have files, create a general health check
      if (drifts.length === 0 && tree.length > 0) {
        console.log(`No architectural issues detected for ${owner}/${name} - repository appears healthy`);
        // Optionally create a positive drift indicating good health
        drifts.push({
          driftType: "structure_degradation",
          severity: "low",
          affectedFiles: [],
          description: `Repository structure analysis completed. Analyzed ${tree.length} code files across ${filesByDir.size} directories.`,
          suggestion: "Continue maintaining good architectural practices. Monitor for future degradation.",
        });
      }

      // Create drifts in database
      let createdCount = 0;
      for (const drift of drifts) {
        try {
          await this.createArchitectureDrift({
            repositoryId,
            driftType: drift.driftType as any,
            severity: drift.severity,
            affectedFiles: drift.affectedFiles,
            description: drift.description,
            suggestion: drift.suggestion,
            isResolved: false,
          });
          createdCount++;
        } catch (err) {
          console.error(`Error creating architecture drift:`, err);
        }
      }

      console.log(`Architecture drifts populated: ${createdCount} drifts created for ${owner}/${name} (${drifts.length} detected)`);
    } catch (error) {
      console.error(`Error populating architecture drifts for ${owner}/${name}:`, error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  // Governance Rules
  async getGovernanceRules(repositoryId?: string): Promise<GovernanceRule[]> {
    if (repositoryId) {
      return await db
        .select()
        .from(schema.governanceRules)
        .where(
          and(
            eq(schema.governanceRules.repositoryId, repositoryId),
            eq(schema.governanceRules.isEnabled, true)
          )
        );
    }
    return await db
      .select()
      .from(schema.governanceRules)
      .where(eq(schema.governanceRules.isEnabled, true));
  }

  async getGovernanceRule(id: string): Promise<GovernanceRule | undefined> {
    const result = await db
      .select()
      .from(schema.governanceRules)
      .where(eq(schema.governanceRules.id, id))
      .limit(1);
    return result[0];
  }

  async createGovernanceRule(rule: InsertGovernanceRule): Promise<GovernanceRule> {
    const [result] = await db.insert(schema.governanceRules).values(rule).returning();
    return result;
  }

  async updateGovernanceRule(id: string, data: Partial<InsertGovernanceRule>): Promise<GovernanceRule | undefined> {
    const [result] = await db
      .update(schema.governanceRules)
      .set(data)
      .where(eq(schema.governanceRules.id, id))
      .returning();
    return result;
  }

  async deleteGovernanceRule(id: string): Promise<boolean> {
    const result = await db
      .delete(schema.governanceRules)
      .where(eq(schema.governanceRules.id, id))
      .returning();
    return result.length > 0;
  }

  // Sprint Analysis
  async getSprintAnalyses(repositoryId: string): Promise<SprintAnalysis[]> {
    return await db
      .select()
      .from(schema.sprintAnalyses)
      .where(eq(schema.sprintAnalyses.repositoryId, repositoryId));
  }

  async getCurrentSprintAnalysis(repositoryId: string): Promise<SprintAnalysis | undefined> {
    const result = await db
      .select()
      .from(schema.sprintAnalyses)
      .where(eq(schema.sprintAnalyses.repositoryId, repositoryId))
      .orderBy(desc(schema.sprintAnalyses.createdAt))
      .limit(1);
    return result[0];
  }

  async createSprintAnalysis(analysis: InsertSprintAnalysis): Promise<SprintAnalysis> {
    const [result] = await db.insert(schema.sprintAnalyses).values(analysis).returning();
    return result;
  }

  // Predictions
  async getPredictions(repositoryId: string): Promise<Prediction[]> {
    return await db
      .select()
      .from(schema.predictions)
      .where(eq(schema.predictions.repositoryId, repositoryId));
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [result] = await db.insert(schema.predictions).values(prediction).returning();
    return result;
  }

  async updatePrediction(id: string, data: Partial<InsertPrediction>): Promise<Prediction | undefined> {
    const [result] = await db
      .update(schema.predictions)
      .set(data)
      .where(eq(schema.predictions.id, id))
      .returning();
    return result;
  }

  // Simulations
  async getSimulations(repositoryId: string): Promise<Simulation[]> {
    return await db
      .select()
      .from(schema.simulations)
      .where(eq(schema.simulations.repositoryId, repositoryId));
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [result] = await db.insert(schema.simulations).values(simulation).returning();
    return result;
  }

  // Refactor Plans
  async getRefactorPlans(repositoryId: string): Promise<RefactorPlan[]> {
    return await db
      .select()
      .from(schema.refactorPlans)
      .where(eq(schema.refactorPlans.repositoryId, repositoryId));
  }

  async getRefactorPlan(id: string): Promise<RefactorPlan | undefined> {
    const result = await db
      .select()
      .from(schema.refactorPlans)
      .where(eq(schema.refactorPlans.id, id))
      .limit(1);
    return result[0];
  }

  async createRefactorPlan(plan: InsertRefactorPlan): Promise<RefactorPlan> {
    const [result] = await db.insert(schema.refactorPlans).values(plan).returning();
    return result;
  }

  async updateRefactorPlan(id: string, data: Partial<InsertRefactorPlan>): Promise<RefactorPlan | undefined> {
    const [result] = await db
      .update(schema.refactorPlans)
      .set(data)
      .where(eq(schema.refactorPlans.id, id))
      .returning();
    return result;
  }

  // Dashboard - Fetch real data from GitHub
  async getDashboardMetrics(repositoryId: string): Promise<DashboardMetrics> {
    const repo = await this.getRepository(repositoryId);
    if (!repo) {
      // Return fallback metrics if repository doesn't exist
      return {
        healthScore: 50,
        healthTrend: 0,
        highRiskPRs: 0,
        architectureWarnings: 0,
        velocityTrend: 0,
        activeContributors: 0,
        pendingReviews: 0,
        governanceViolations: 0,
      };
    }

    try {
      const metrics = await this.github.getRepositoryMetrics(repo.owner, repo.name);
      
      // Get additional data from database
      const riskAnalyses = await this.getHighRiskAnalyses(repositoryId);
      const drifts = await this.getArchitectureDrifts(repositoryId);
      const rules = await this.getGovernanceRules(repositoryId);
      const contributors = await this.getContributors(repositoryId);

      return {
        ...metrics,
        highRiskPRs: riskAnalyses.length,
        architectureWarnings: drifts.filter((d) => !d.isResolved).length,
        activeContributors: contributors.length || metrics.activeContributors,
        governanceViolations: rules.filter((r) => r.severity === "error" || r.severity === "blocking").length,
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Return fallback metrics
      return {
        healthScore: 50,
        healthTrend: 0,
        highRiskPRs: 0,
        architectureWarnings: 0,
        velocityTrend: 0,
        activeContributors: 0,
        pendingReviews: 0,
        governanceViolations: 0,
      };
    }
  }

  async getDashboardInsights(repositoryId: string): Promise<TemporalInsight[]> {
    const repo = await this.getRepository(repositoryId);
    if (!repo) {
      return [];
    }

    try {
      const metrics = await this.github.getRepositoryMetrics(repo.owner, repo.name);
      const temporalMetrics = await this.getTemporalMetrics(repositoryId);
      
      const insights: TemporalInsight[] = [];

      // Velocity insight
      if (metrics.velocityTrend > 10) {
        insights.push({
          type: "velocity",
          message: `Repository velocity increased ${metrics.velocityTrend}% this week`,
          severity: "info",
          trend: metrics.velocityTrend,
        });
      } else if (metrics.velocityTrend < -10) {
        insights.push({
          type: "velocity",
          message: `Repository velocity decreased ${Math.abs(metrics.velocityTrend)}% this week`,
          severity: "warning",
          trend: metrics.velocityTrend,
        });
      }

      // Review delay insight
      if (metrics.pendingReviews > 5) {
        insights.push({
          type: "delay",
          message: `${metrics.pendingReviews} pull requests pending review`,
          severity: "warning",
          trend: metrics.pendingReviews * 5,
        });
      }

      // Contributor activity insight
      if (metrics.activeContributors < 3) {
        insights.push({
          type: "burnout",
          message: "Low contributor activity - only a few active contributors",
          severity: "critical",
          trend: -50,
        });
      }

      return insights;
    } catch (error) {
      console.error("Error fetching dashboard insights:", error);
      return [];
    }
  }
}

