import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { 
  insertRepositorySchema, 
  insertGovernanceRuleSchema 
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      
      let repo = await storage.getRepositoryByFullName(fullName);
      if (!repo) {
        repo = await storage.createRepository({
          owner,
          name,
          fullName,
          description: null,
          defaultBranch: "main",
          healthScore: 0,
        });
      }
      
      res.json(repo);
    } catch (error) {
      console.error("Error creating repository:", error);
      res.status(500).json({ error: "Failed to create repository" });
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
      const drifts = await storage.getArchitectureDrifts(repoId);
      res.json(drifts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch architecture drifts" });
    }
  });

  app.post("/api/architecture/analyze", async (req, res) => {
    try {
      const { repositoryId, files } = req.body;
      
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
      const nodes = await storage.getKnowledgeNodes(repoId);
      const edges = await storage.getKnowledgeEdges(repoId);
      res.json({ nodes, edges });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge graph" });
    }
  });

  // Temporal Metrics endpoints
  app.get("/api/temporal/metrics", async (req, res) => {
    try {
      const repoId = req.query.repositoryId as string || "default";
      const metrics = await storage.getTemporalMetrics(repoId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch temporal metrics" });
    }
  });
}
