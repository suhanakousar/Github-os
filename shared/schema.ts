import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Repository Analysis
export const repositories = pgTable("repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  defaultBranch: text("default_branch").default("main"),
  healthScore: integer("health_score").default(0),
  lastAnalyzedAt: timestamp("last_analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({ id: true, createdAt: true });
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositories.$inferSelect;

// Knowledge Graph Nodes
export const knowledgeNodes = pgTable("knowledge_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  nodeType: text("node_type").notNull(), // file, function, commit, pr, contributor, issue
  nodeId: text("node_id").notNull(),
  label: text("label").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKnowledgeNodeSchema = createInsertSchema(knowledgeNodes).omit({ id: true, createdAt: true });
export type InsertKnowledgeNode = z.infer<typeof insertKnowledgeNodeSchema>;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;

// Knowledge Graph Edges
export const knowledgeEdges = pgTable("knowledge_edges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  sourceNodeId: varchar("source_node_id").notNull(),
  targetNodeId: varchar("target_node_id").notNull(),
  edgeType: text("edge_type").notNull(), // modified_by, belongs_to, owns, linked_to
  weight: real("weight").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKnowledgeEdgeSchema = createInsertSchema(knowledgeEdges).omit({ id: true, createdAt: true });
export type InsertKnowledgeEdge = z.infer<typeof insertKnowledgeEdgeSchema>;
export type KnowledgeEdge = typeof knowledgeEdges.$inferSelect;

// Risk Analysis
export const riskAnalyses = pgTable("risk_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  prNumber: integer("pr_number"),
  overallRisk: integer("overall_risk").notNull(),
  codeRisk: integer("code_risk").notNull(),
  processRisk: integer("process_risk").notNull(),
  humanRisk: integer("human_risk").notNull(),
  architecturalRisk: integer("architectural_risk").notNull(),
  releaseRisk: integer("release_risk").notNull(),
  explanation: text("explanation"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRiskAnalysisSchema = createInsertSchema(riskAnalyses).omit({ id: true, createdAt: true });
export type InsertRiskAnalysis = z.infer<typeof insertRiskAnalysisSchema>;
export type RiskAnalysis = typeof riskAnalyses.$inferSelect;

// Contributor Intelligence
export const contributors = pgTable("contributors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  qualityScore: integer("quality_score").default(0),
  reviewReliability: integer("review_reliability").default(0),
  riskProfile: text("risk_profile").default("normal"), // low, normal, high
  totalCommits: integer("total_commits").default(0),
  totalPRs: integer("total_prs").default(0),
  totalReviews: integer("total_reviews").default(0),
  isSinglePointOfFailure: boolean("is_single_point_of_failure").default(false),
  codeOwnership: jsonb("code_ownership"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContributorSchema = createInsertSchema(contributors).omit({ id: true, createdAt: true });
export type InsertContributor = z.infer<typeof insertContributorSchema>;
export type Contributor = typeof contributors.$inferSelect;

// Temporal Analysis
export const temporalMetrics = pgTable("temporal_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  metricDate: timestamp("metric_date").notNull(),
  velocity: real("velocity").default(0),
  codeChurn: real("code_churn").default(0),
  prReviewTime: real("pr_review_time").default(0),
  commitFrequency: integer("commit_frequency").default(0),
  contributorActivity: integer("contributor_activity").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTemporalMetricSchema = createInsertSchema(temporalMetrics).omit({ id: true, createdAt: true });
export type InsertTemporalMetric = z.infer<typeof insertTemporalMetricSchema>;
export type TemporalMetric = typeof temporalMetrics.$inferSelect;

// Architecture Drift
export const architectureDrifts = pgTable("architecture_drifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  driftType: text("drift_type").notNull(), // god_file, circular_dependency, boundary_blur, structure_degradation
  severity: text("severity").notNull(), // low, medium, high, critical
  affectedFiles: jsonb("affected_files"),
  description: text("description"),
  suggestion: text("suggestion"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArchitectureDriftSchema = createInsertSchema(architectureDrifts).omit({ id: true, createdAt: true });
export type InsertArchitectureDrift = z.infer<typeof insertArchitectureDriftSchema>;
export type ArchitectureDrift = typeof architectureDrifts.$inferSelect;

// Governance Rules
export const governanceRules = pgTable("governance_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id"),
  ruleName: text("rule_name").notNull(),
  ruleType: text("rule_type").notNull(), // pr_size, test_coverage, required_reviewers, commit_message
  config: jsonb("config").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  severity: text("severity").default("warning"), // info, warning, error, blocking
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGovernanceRuleSchema = createInsertSchema(governanceRules).omit({ id: true, createdAt: true });
export type InsertGovernanceRule = z.infer<typeof insertGovernanceRuleSchema>;
export type GovernanceRule = typeof governanceRules.$inferSelect;

// Sprint Intelligence
export const sprintAnalyses = pgTable("sprint_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  sprintName: text("sprint_name"),
  riskLevel: text("risk_level").notNull(), // low, medium, high, critical
  blockerCount: integer("blocker_count").default(0),
  unreviewedPRs: integer("unreviewed_prs").default(0),
  idleIssues: integer("idle_issues").default(0),
  predictedCompletion: real("predicted_completion").default(0),
  insights: jsonb("insights"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSprintAnalysisSchema = createInsertSchema(sprintAnalyses).omit({ id: true, createdAt: true });
export type InsertSprintAnalysis = z.infer<typeof insertSprintAnalysisSchema>;
export type SprintAnalysis = typeof sprintAnalyses.$inferSelect;

// Predictions
export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  predictionType: text("prediction_type").notNull(), // bug_likelihood, revert_probability, deadline_miss
  targetId: text("target_id"),
  probability: real("probability").notNull(),
  confidence: real("confidence").notNull(),
  reasoning: text("reasoning"),
  isVerified: boolean("is_verified"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

// Simulation Results
export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  simulationType: text("simulation_type").notNull(), // pr_merge, contributor_departure
  parameters: jsonb("parameters").notNull(),
  projectedRiskImpact: jsonb("projected_risk_impact"),
  insights: jsonb("insights"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({ id: true, createdAt: true });
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Simulation = typeof simulations.$inferSelect;

// Refactor Plans
export const refactorPlans = pgTable("refactor_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(),
  estimatedEffort: text("estimated_effort"),
  riskMitigation: text("risk_mitigation"),
  status: text("status").default("proposed"), // proposed, in_progress, completed, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRefactorPlanSchema = createInsertSchema(refactorPlans).omit({ id: true, createdAt: true });
export type InsertRefactorPlan = z.infer<typeof insertRefactorPlanSchema>;
export type RefactorPlan = typeof refactorPlans.$inferSelect;

// Users table (keeping original)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Frontend Types (not DB tables)
export interface DashboardMetrics {
  healthScore: number;
  healthTrend: number;
  highRiskPRs: number;
  architectureWarnings: number;
  velocityTrend: number;
  activeContributors: number;
  pendingReviews: number;
  governanceViolations: number;
}

export interface TemporalInsight {
  type: 'velocity' | 'churn' | 'burnout' | 'delay';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  trend: number;
}

export interface KnowledgeGraphData {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    size: number;
    color: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
  }>;
}

export interface SimulationResult {
  scenario: string;
  currentRisk: number;
  projectedRisk: number;
  riskDelta: number;
  impactAreas: string[];
  recommendations: string[];
}
