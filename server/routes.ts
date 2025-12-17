import type { Express, Request, Response } from "express";
import type { Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { DbStorage } from "./db-storage";
import OpenAI from "openai";
import { z } from "zod";
import { 
  insertRepositorySchema, 
  insertGovernanceRuleSchema 
} from "@shared/schema";

// Initialize OpenAI client only if API key is provided
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Request validation schemas for AI-powered endpoints
const riskAnalyzeRequestSchema = z.object({
  repositoryId: z.string().min(1),
  prNumber: z.number().int().positive(),
  prTitle: z.string().optional(),
  additions: z.number().int().nonnegative().optional(),
  deletions: z.number().int().nonnegative().optional(),
  files: z.array(z.string()).optional(),
  author: z.string().optional(),
});

const sprintAnalyzeRequestSchema = z.object({
  repositoryId: z.string().min(1),
  sprintName: z.string().optional(),
  issues: z.array(z.unknown()).optional(),
  pullRequests: z.array(z.unknown()).optional(),
});

const predictionGenerateRequestSchema = z.object({
  repositoryId: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  context: z.unknown().optional(),
});

const refactorGenerateRequestSchema = z.object({
  repositoryId: z.string().min(1),
  description: z.string().min(1),
  affectedFiles: z.array(z.string()).optional(),
});

const simulationRunRequestSchema = z.object({
  repositoryId: z.string().min(1),
  simulationType: z.string().min(1),
  parameters: z.record(z.unknown()).optional(),
});

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // Auth endpoints
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email", "repo"] }));
  
  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/?error=auth_failed" }),
    (req: Request, res: Response) => {
      // Store GitHub token in session
      const user = req.user as any;
      const session = req.session as any;
      if (user && session && user.githubToken) {
        session.githubToken = user.githubToken;
      }
      res.redirect("/");
    }
  );

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({
        id: user.id,
        username: user.username,
        authenticated: true,
        hasGitHubToken: !!(req.session as any)?.githubToken || !!(user as any)?.githubToken,
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response, next: any) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session?.destroy((err) => {
        if (err) return next(err);
        res.json({ success: true });
      });
    });
  });

  // GitHub repositories endpoint (requires auth)
  app.get("/api/github/repositories", async (req: Request, res: Response) => {
    try {
      const session = req.session as any;
      const githubToken = session?.githubToken || (req.user as any)?.githubToken || process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        return res.status(401).json({ error: "GitHub authentication required. Please sign in with GitHub." });
      }

      const { Octokit } = await import("@octokit/rest");
      const octokit = new Octokit({ auth: githubToken });

      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: "updated",
      });

      const formattedRepos = repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        description: repo.description,
        private: repo.private,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      }));

      res.json(formattedRepos);
    } catch (error: any) {
      console.error("Error fetching GitHub repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // Dashboard endpoints
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const metrics = await storage.getDashboardMetrics(repoId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/dashboard/insights", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const insights = await storage.getDashboardInsights(repoId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // Repository endpoints
  app.get("/api/repositories", async (req, res) => {
    try {
      const repos = await storage.listRepositories();
      res.json(repos);
    } catch (error) {
      res.status(500).json({ error: "Failed to list repositories" });
    }
  });

  app.post("/api/repositories", async (req, res) => {
    try {
      const createRepoSchema = z.object({
        owner: z.string().min(1, "Owner is required"),
        name: z.string().min(1, "Name is required"),
      });
      
      const validation = createRepoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { owner, name } = validation.data;
      const fullName = `${owner}/${name}`;
      
      console.log(`Creating/fetching repository: ${fullName}`);
      console.log(`Using storage type: ${storage.constructor.name}`);
      
      try {
        let repo = await storage.getRepositoryByFullName(fullName);
        if (!repo) {
          console.log(`Repository ${fullName} not found in database, creating...`);
          repo = await storage.createRepository({
            owner,
            name,
            fullName,
            description: null,
            defaultBranch: "main",
            healthScore: 0,
          });
          console.log(`Repository ${fullName} created successfully with ID: ${repo.id}`);
        } else {
          console.log(`Repository ${fullName} already exists with ID: ${repo.id}`);
        }
        
        res.json(repo);
      } catch (createError: any) {
        console.error("Error in createRepository call:", createError);
        throw createError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error("Error creating repository:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        code: error?.code,
        errno: error?.errno,
        syscall: error?.syscall,
      });
      
      // Return more specific error messages
      let errorMessage = "Failed to create repository";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      }
      
      const statusCode = error?.status === 404 ? 404 : 500;
      res.status(statusCode).json({ 
        error: errorMessage,
        details: error?.response?.data || error?.code || undefined
      });
    }
  });

  // Risk Analysis endpoints
  app.get("/api/risk", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const analyses = await storage.getRiskAnalyses(repoId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk analyses" });
    }
  });

  app.get("/api/risk/high", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const analyses = await storage.getHighRiskAnalyses(repoId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch high risk analyses" });
    }
  });

  app.post("/api/risk/analyze", async (req, res) => {
    try {
      const validation = riskAnalyzeRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { repositoryId, prNumber, prTitle, additions, deletions, files, author } = validation.data;
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." });
      }
      
      // Use OpenAI to analyze risk
      const prompt = `Analyze the risk of this pull request:
        PR #${prNumber}: ${prTitle}
        Author: ${author}
        Changes: +${additions} / -${deletions} lines
        Files modified: ${files?.length || 0}
        
        Provide a risk assessment with scores (0-100) for:
        1. Code Risk (complexity, size, test coverage impact)
        2. Process Risk (review thoroughness, documentation)
        3. Human Risk (author experience, reviewer availability)
        4. Architectural Risk (module boundaries, dependencies)
        5. Release Risk (timing, deployment considerations)
        
        Return JSON with: overallRisk, codeRisk, processRisk, humanRisk, architecturalRisk, releaseRisk, explanation, recommendations[]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      
      const riskAnalysis = await storage.createRiskAnalysis({
        repositoryId,
        prNumber,
        overallRisk: analysis.overallRisk || 50,
        codeRisk: analysis.codeRisk || 50,
        processRisk: analysis.processRisk || 50,
        humanRisk: analysis.humanRisk || 50,
        architecturalRisk: analysis.architecturalRisk || 50,
        releaseRisk: analysis.releaseRisk || 50,
        explanation: analysis.explanation,
        recommendations: analysis.recommendations,
      });

      res.json(riskAnalysis);
    } catch (error) {
      console.error("Error analyzing risk:", error);
      res.status(500).json({ error: "Failed to analyze risk" });
    }
  });

  // Contributors endpoints
  app.get("/api/contributors", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const contributors = await storage.getContributors(repoId);
      res.json(contributors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contributors" });
    }
  });

  // Architecture Drift endpoints
  app.get("/api/architecture/drifts", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      console.log(`Fetching architecture drifts for repository: ${repoId}`);
      const drifts = await storage.getArchitectureDrifts(repoId);
      console.log(`Found ${drifts.length} architecture drifts for repository ${repoId}`);
      res.json(drifts);
    } catch (error) {
      console.error("Error fetching architecture drifts:", error);
      res.status(500).json({ error: "Failed to fetch architecture drifts" });
    }
  });

  app.post("/api/architecture/populate", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string;
      if (!repoId) {
        return res.status(400).json({ error: "repositoryId is required" });
      }

      const repo = await storage.getRepository(repoId);
      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // Extract owner and name from fullName
      const [owner, name] = repo.fullName.split('/');
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid repository format" });
      }

      // Populate architecture drifts asynchronously (force refresh when manually triggered)
      const storageAny = storage as any;
      if (storageAny.delegate && typeof storageAny.delegate.populateArchitectureDrifts === 'function') {
        storageAny.delegate.populateArchitectureDrifts(repoId, owner, name, true).catch((err: any) => {
          console.error("Error populating architecture drifts:", err);
        });
      } else if (typeof storageAny.populateArchitectureDrifts === 'function') {
        storageAny.populateArchitectureDrifts(repoId, owner, name, true).catch((err: any) => {
          console.error("Error populating architecture drifts:", err);
        });
      } else {
        console.warn("Cannot populate architecture drifts - method not available");
      }

      res.json({ message: "Architecture drift detection started" });
    } catch (error) {
      console.error("Error triggering architecture drift detection:", error);
      res.status(500).json({ error: "Failed to trigger detection" });
    }
  });

  app.post("/api/architecture/analyze", async (req, res) => {
    try {
      const { repositoryId, files } = req.body;
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." });
      }
      
      const prompt = `Analyze these files for architectural issues:
        ${JSON.stringify(files?.slice(0, 20) || [])}
        
        Identify any:
        1. God files (too many responsibilities)
        2. Circular dependencies
        3. Boundary blur (mixing concerns)
        4. Structure degradation
        
        Return JSON array with: driftType, severity (low/medium/high/critical), affectedFiles[], description, suggestion`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      const drifts = [];
      
      for (const drift of analysis.drifts || []) {
        const created = await storage.createArchitectureDrift({
          repositoryId,
          driftType: drift.driftType,
          severity: drift.severity,
          affectedFiles: drift.affectedFiles,
          description: drift.description,
          suggestion: drift.suggestion,
        });
        drifts.push(created);
      }

      res.json(drifts);
    } catch (error) {
      console.error("Error analyzing architecture:", error);
      res.status(500).json({ error: "Failed to analyze architecture" });
    }
  });

  // Governance Rules endpoints
  app.get("/api/governance/rules", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string;
      const rules = await storage.getGovernanceRules(repoId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch governance rules" });
    }
  });

  app.post("/api/governance/rules", async (req, res) => {
    try {
      const validation = insertGovernanceRuleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const rule = await storage.createGovernanceRule(validation.data);
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create governance rule" });
    }
  });

  app.patch("/api/governance/rules/:id", async (req, res) => {
    try {
      const rule = await storage.updateGovernanceRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update governance rule" });
    }
  });

  app.delete("/api/governance/rules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGovernanceRule(req.params.id);
      res.json({ deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete governance rule" });
    }
  });

  // Sprint Analysis endpoints
  app.get("/api/sprint/current", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const sprint = await storage.getCurrentSprintAnalysis(repoId);
      res.json(sprint || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sprint analysis" });
    }
  });

  app.post("/api/sprint/analyze", async (req, res) => {
    try {
      const validation = sprintAnalyzeRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { repositoryId, sprintName, issues, pullRequests } = validation.data;
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." });
      }
      
      const prompt = `Analyze this sprint data:
        Sprint: ${sprintName}
        Open Issues: ${issues?.length || 0}
        Open PRs: ${pullRequests?.length || 0}
        
        Provide sprint intelligence including:
        1. Risk level (low/medium/high/critical)
        2. Blocker count
        3. Predicted completion percentage
        4. Key insights (array of strings)
        5. Recommendations (array of strings)
        
        Return JSON with: riskLevel, blockerCount, unreviewedPRs, idleIssues, predictedCompletion, insights[], recommendations[]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      
      const sprint = await storage.createSprintAnalysis({
        repositoryId,
        sprintName,
        riskLevel: analysis.riskLevel || "medium",
        blockerCount: analysis.blockerCount || 0,
        unreviewedPRs: analysis.unreviewedPRs || 0,
        idleIssues: analysis.idleIssues || 0,
        predictedCompletion: analysis.predictedCompletion || 50,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
      });

      res.json(sprint);
    } catch (error) {
      console.error("Error analyzing sprint:", error);
      res.status(500).json({ error: "Failed to analyze sprint" });
    }
  });

  // Predictions endpoints
  app.get("/api/predictions", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const predictions = await storage.getPredictions(repoId);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  app.post("/api/predictions/generate", async (req, res) => {
    try {
      const validation = predictionGenerateRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { repositoryId, targetType, targetId, context } = validation.data;
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." });
      }
      
      const prompt = `Generate a prediction for ${targetType} "${targetId}":
        Context: ${JSON.stringify(context)}
        
        Predict the likelihood of issues (bug, revert, deadline miss).
        Return JSON with: predictionType, probability (0-1), confidence (0-1), reasoning`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const prediction = await storage.createPrediction({
        repositoryId,
        predictionType: result.predictionType || "bug_likelihood",
        targetId,
        probability: result.probability || 0.5,
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning,
      });

      res.json(prediction);
    } catch (error) {
      console.error("Error generating prediction:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // Refactor Plans endpoints
  app.get("/api/refactor/plans", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const plans = await storage.getRefactorPlans(repoId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch refactor plans" });
    }
  });

  app.post("/api/refactor/generate", async (req, res) => {
    try {
      const validation = refactorGenerateRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { repositoryId, description, affectedFiles } = validation.data;
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." });
      }
      
      const prompt = `Generate a step-by-step refactoring plan for:
        ${description}
        
        Affected files: ${JSON.stringify(affectedFiles || [])}
        
        Provide a detailed plan with:
        1. Title for the refactor
        2. Description
        3. Steps (array with order, title, description, status)
        4. Estimated effort
        5. Risk mitigation strategy
        
        Return JSON with: title, description, steps[], estimatedEffort, riskMitigation`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const plan = await storage.createRefactorPlan({
        repositoryId,
        title: result.title || "Refactoring Plan",
        description: result.description,
        steps: result.steps?.map((s: Record<string, unknown>, i: number) => ({
          order: i + 1,
          title: s.title,
          description: s.description,
          status: "pending",
        })) || [],
        estimatedEffort: result.estimatedEffort,
        riskMitigation: result.riskMitigation,
      });

      res.json(plan);
    } catch (error) {
      console.error("Error generating refactor plan:", error);
      res.status(500).json({ error: "Failed to generate refactor plan" });
    }
  });

  app.patch("/api/refactor/plans/:id", async (req, res) => {
    try {
      const plan = await storage.updateRefactorPlan(req.params.id, req.body);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to update refactor plan" });
    }
  });

  // Simulation endpoints
  app.get("/api/simulations", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const simulations = await storage.getSimulations(repoId);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch simulations" });
    }
  });

  app.post("/api/simulations/run", async (req, res) => {
    try {
      const validation = simulationRunRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { repositoryId, simulationType, parameters } = validation.data;
      
      if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." });
      }
      
      const prompt = `Simulate ${simulationType} scenario:
        Parameters: ${JSON.stringify(parameters)}
        
        Calculate projected risk impact and provide recommendations.
        Return JSON with: 
        - projectedRiskImpact: { currentRisk, projectedRisk, riskDelta }
        - insights: { scenario, impactAreas[], recommendations[] }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const simulation = await storage.createSimulation({
        repositoryId,
        simulationType,
        parameters,
        projectedRiskImpact: result.projectedRiskImpact,
        insights: result.insights,
      });

      res.json({
        ...simulation,
        scenario: result.insights?.scenario || `${simulationType} simulation`,
        currentRisk: result.projectedRiskImpact?.currentRisk || 45,
        projectedRisk: result.projectedRiskImpact?.projectedRisk || 65,
        riskDelta: result.projectedRiskImpact?.riskDelta || 20,
        impactAreas: result.insights?.impactAreas || [],
        recommendations: result.insights?.recommendations || [],
      });
    } catch (error) {
      console.error("Error running simulation:", error);
      res.status(500).json({ error: "Failed to run simulation" });
    }
  });

  // Knowledge Graph endpoints
  app.get("/api/knowledge-graph", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      console.log(`Fetching knowledge graph for repository: ${repoId}`);
      
      const dbNodes = await storage.getKnowledgeNodes(repoId);
      const dbEdges = await storage.getKnowledgeEdges(repoId);
      
      console.log(`Found ${dbNodes.length} nodes and ${dbEdges.length} edges for repository ${repoId}`);
      
      // Transform database nodes to frontend format
      const nodeTypeColors: Record<string, string> = {
        file: "#3b82f6", // blue
        commit: "#10b981", // green
        pr: "#a855f7", // purple
        contributor: "#f97316", // orange
        issue: "#ef4444", // red
      };
      
      const nodes = dbNodes.map(node => ({
        id: node.id,
        type: node.nodeType,
        label: node.label,
        size: 10,
        color: nodeTypeColors[node.nodeType] || "#6b7280",
        metadata: node.metadata,
      }));
      
      // Transform database edges to frontend format
      const edges = dbEdges.map(edge => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        type: edge.edgeType,
        weight: edge.weight || 1,
      }));
      
      res.json({ nodes, edges });
    } catch (error) {
      console.error("Error fetching knowledge graph:", error);
      res.status(500).json({ error: "Failed to fetch knowledge graph" });
    }
  });

  app.post("/api/knowledge-graph/populate", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string;
      if (!repoId) {
        return res.status(400).json({ error: "repositoryId is required" });
      }

      const repo = await storage.getRepository(repoId);
      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // Extract owner and name from fullName
      const [owner, name] = repo.fullName.split('/');
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid repository format" });
      }

      // Populate knowledge graph asynchronously
      // Storage is a wrapper, need to access the delegate
      const storageAny = storage as any;
      if (storageAny.delegate && typeof storageAny.delegate.populateKnowledgeGraph === 'function') {
        storageAny.delegate.populateKnowledgeGraph(repoId, owner, name).catch((err: any) => {
          console.error("Error populating knowledge graph:", err);
        });
      } else if (typeof storageAny.populateKnowledgeGraph === 'function') {
        storageAny.populateKnowledgeGraph(repoId, owner, name).catch((err: any) => {
          console.error("Error populating knowledge graph:", err);
        });
      } else {
        console.warn("Cannot populate knowledge graph - method not available");
      }

      res.json({ message: "Knowledge graph population started" });
    } catch (error) {
      console.error("Error triggering knowledge graph population:", error);
      res.status(500).json({ error: "Failed to trigger population" });
    }
  });

  app.post("/api/temporal/populate", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string;
      if (!repoId) {
        return res.status(400).json({ error: "repositoryId is required" });
      }

      const repo = await storage.getRepository(repoId);
      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // Extract owner and name from fullName
      const [owner, name] = repo.fullName.split('/');
      if (!owner || !name) {
        return res.status(400).json({ error: "Invalid repository format" });
      }

      // Populate temporal metrics asynchronously (force refresh when manually triggered)
      const storageAny = storage as any;
      if (storageAny.delegate && typeof storageAny.delegate.populateTemporalMetrics === 'function') {
        storageAny.delegate.populateTemporalMetrics(repoId, owner, name, true).catch((err: any) => {
          console.error("Error populating temporal metrics:", err);
        });
      } else if (typeof storageAny.populateTemporalMetrics === 'function') {
        storageAny.populateTemporalMetrics(repoId, owner, name, true).catch((err: any) => {
          console.error("Error populating temporal metrics:", err);
        });
      } else {
        console.warn("Cannot populate temporal metrics - method not available");
      }

      res.json({ message: "Temporal metrics population started" });
    } catch (error) {
      console.error("Error triggering temporal metrics population:", error);
      res.status(500).json({ error: "Failed to trigger population" });
    }
  });

  // Temporal Metrics endpoints
  app.get("/api/temporal/metrics", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      console.log(`Fetching temporal metrics for repository: ${repoId}`);
      const metrics = await storage.getTemporalMetrics(repoId);
      console.log(`Found ${metrics.length} temporal metrics for repository ${repoId}`);
      
      if (metrics.length === 0) {
        return res.json({
          metrics: [],
          velocityData: [],
          churnData: [],
          reviewTimeData: [],
          contributorActivityData: [],
          insights: [],
          summary: null,
        });
      }
      
      // Transform to frontend format
      const velocityData = metrics.map((m, i) => ({
        week: `W${i + 1}`,
        velocity: m.velocity || 0,
        commits: m.commitFrequency || 0,
        prs: Math.round((m.velocity || 0) * 0.3), // Estimate PRs from velocity
      }));

      const churnData = metrics.slice(-7).map((m, i) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const churn = m.codeChurn || 0;
        const baseAdditions = 500;
        const additions = Math.round(baseAdditions * (1 + churn));
        const deletions = Math.round(baseAdditions * (1 - churn));
        return {
          day: days[i % 7],
          additions: Math.max(0, additions),
          deletions: Math.max(0, deletions),
        };
      });

      const reviewTimeData = metrics.map((m, i) => ({
        week: `W${i + 1}`,
        avgTime: m.prReviewTime || 0,
        p90Time: (m.prReviewTime || 0) * 2.4, // Estimate P90
      }));

      const contributorActivityData = metrics.map((m, i) => ({
        week: `W${i + 1}`,
        active: m.contributorActivity || 0,
        new: i > 0 ? Math.max(0, (m.contributorActivity || 0) - (metrics[i - 1]?.contributorActivity || 0)) : 0,
        churned: i > 0 ? Math.max(0, (metrics[i - 1]?.contributorActivity || 0) - (m.contributorActivity || 0)) : 0,
      }));

      // Generate insights from metrics
      const insights: Array<{ type: string; message: string; severity: string; trend: number }> = [];
      if (metrics.length >= 2) {
        const latest = metrics[metrics.length - 1];
        const previous = metrics[metrics.length - 2];
        
        const velocityTrend = latest.velocity && previous.velocity 
          ? ((latest.velocity - previous.velocity) / previous.velocity) * 100 
          : 0;
        if (Math.abs(velocityTrend) > 5) {
          insights.push({
            type: 'velocity',
            message: `Repository velocity ${velocityTrend > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(velocityTrend))}% this week`,
            severity: velocityTrend > 0 ? 'info' : 'warning',
            trend: Math.round(velocityTrend),
          });
        }

        const reviewTimeTrend = latest.prReviewTime && previous.prReviewTime
          ? ((latest.prReviewTime - previous.prReviewTime) / previous.prReviewTime) * 100
          : 0;
        if (reviewTimeTrend > 50) {
          insights.push({
            type: 'delay',
            message: `PR review time increased ${Math.round(reviewTimeTrend)}% - may need attention`,
            severity: 'warning',
            trend: Math.round(reviewTimeTrend),
          });
        }

        const activityTrend = latest.contributorActivity && previous.contributorActivity
          ? ((latest.contributorActivity - previous.contributorActivity) / previous.contributorActivity) * 100
          : 0;
        if (activityTrend < -30) {
          insights.push({
            type: 'burnout',
            message: `Contributor activity dropped ${Math.abs(Math.round(activityTrend))}% - potential burnout signal`,
            severity: 'critical',
            trend: Math.round(activityTrend),
          });
        }

        const churnTrend = latest.codeChurn && previous.codeChurn
          ? ((latest.codeChurn - previous.codeChurn) / Math.abs(previous.codeChurn || 1)) * 100
          : 0;
        if (Math.abs(churnTrend) > 20) {
          insights.push({
            type: 'churn',
            message: `Code churn ratio ${churnTrend > 0 ? 'increased' : 'improved'} ${Math.abs(Math.round(churnTrend))}%`,
            severity: churnTrend < 0 ? 'info' : 'warning',
            trend: Math.round(churnTrend),
          });
        }
      }

      res.json({
        metrics,
        velocityData,
        churnData,
        reviewTimeData,
        contributorActivityData,
        insights,
        summary: metrics.length > 0 ? {
          weeklyVelocity: metrics[metrics.length - 1]?.velocity || 0,
          avgReviewTime: metrics.reduce((sum, m) => sum + (m.prReviewTime || 0), 0) / metrics.length,
          commitFrequency: metrics[metrics.length - 1]?.commitFrequency || 0,
          activeContributors: metrics[metrics.length - 1]?.contributorActivity || 0,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching temporal metrics:", error);
      res.status(500).json({ error: "Failed to fetch temporal metrics" });
    }
  });

  // Mock Data Generation endpoint (for demonstration)
  app.post("/api/mock-data/generate", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string;
      if (!repoId) {
        return res.status(400).json({ error: "repositoryId is required" });
      }

      console.log(`[API] Mock data generation requested for repository: ${repoId}`);

      const repo = await storage.getRepository(repoId);
      if (!repo) {
        console.error(`[API] Repository ${repoId} not found`);
        return res.status(404).json({ error: "Repository not found" });
      }

      console.log(`[API] Repository found: ${repo.fullName} (${repo.id})`);

      // Import and generate mock data
      const { generateMockData } = await import("./mock-data");
      await generateMockData(storage, repoId);

      console.log(`[API] Mock data generation completed for ${repo.fullName}`);

      res.json({ 
        message: "Mock data generated successfully",
        repositoryId: repoId,
        repositoryName: repo.fullName,
      });
    } catch (error: any) {
      console.error("[API] Error generating mock data:", error);
      console.error("[API] Error stack:", error?.stack);
      res.status(500).json({ 
        error: "Failed to generate mock data",
        details: error?.message || String(error),
      });
    }
  });
}
