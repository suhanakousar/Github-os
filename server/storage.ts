import type {
  Repository, InsertRepository,
  KnowledgeNode, InsertKnowledgeNode,
  KnowledgeEdge, InsertKnowledgeEdge,
  RiskAnalysis, InsertRiskAnalysis,
  Contributor, InsertContributor,
  TemporalMetric, InsertTemporalMetric,
  ArchitectureDrift, InsertArchitectureDrift,
  GovernanceRule, InsertGovernanceRule,
  SprintAnalysis, InsertSprintAnalysis,
  Prediction, InsertPrediction,
  Simulation, InsertSimulation,
  RefactorPlan, InsertRefactorPlan,
  User, InsertUser,
  DashboardMetrics,
  TemporalInsight,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Repositories
  getRepository(id: string): Promise<Repository | undefined>;
  getRepositoryByFullName(fullName: string): Promise<Repository | undefined>;
  createRepository(repo: InsertRepository): Promise<Repository>;
  updateRepository(id: string, data: Partial<InsertRepository>): Promise<Repository | undefined>;
  listRepositories(): Promise<Repository[]>;
  
  // Knowledge Graph
  getKnowledgeNodes(repositoryId: string): Promise<KnowledgeNode[]>;
  createKnowledgeNode(node: InsertKnowledgeNode): Promise<KnowledgeNode>;
  getKnowledgeEdges(repositoryId: string): Promise<KnowledgeEdge[]>;
  createKnowledgeEdge(edge: InsertKnowledgeEdge): Promise<KnowledgeEdge>;
  
  // Risk Analysis
  getRiskAnalyses(repositoryId: string): Promise<RiskAnalysis[]>;
  getRiskAnalysisByPR(repositoryId: string, prNumber: number): Promise<RiskAnalysis | undefined>;
  createRiskAnalysis(analysis: InsertRiskAnalysis): Promise<RiskAnalysis>;
  getHighRiskAnalyses(repositoryId: string): Promise<RiskAnalysis[]>;
  
  // Contributors
  getContributors(repositoryId: string): Promise<Contributor[]>;
  getContributorByUsername(repositoryId: string, username: string): Promise<Contributor | undefined>;
  createContributor(contributor: InsertContributor): Promise<Contributor>;
  updateContributor(id: string, data: Partial<InsertContributor>): Promise<Contributor | undefined>;
  
  // Temporal Metrics
  getTemporalMetrics(repositoryId: string): Promise<TemporalMetric[]>;
  createTemporalMetric(metric: InsertTemporalMetric): Promise<TemporalMetric>;
  
  // Architecture Drifts
  getArchitectureDrifts(repositoryId: string): Promise<ArchitectureDrift[]>;
  createArchitectureDrift(drift: InsertArchitectureDrift): Promise<ArchitectureDrift>;
  updateArchitectureDrift(id: string, data: Partial<InsertArchitectureDrift>): Promise<ArchitectureDrift | undefined>;
  
  // Governance Rules
  getGovernanceRules(repositoryId?: string): Promise<GovernanceRule[]>;
  getGovernanceRule(id: string): Promise<GovernanceRule | undefined>;
  createGovernanceRule(rule: InsertGovernanceRule): Promise<GovernanceRule>;
  updateGovernanceRule(id: string, data: Partial<InsertGovernanceRule>): Promise<GovernanceRule | undefined>;
  deleteGovernanceRule(id: string): Promise<boolean>;
  
  // Sprint Analysis
  getSprintAnalyses(repositoryId: string): Promise<SprintAnalysis[]>;
  getCurrentSprintAnalysis(repositoryId: string): Promise<SprintAnalysis | undefined>;
  createSprintAnalysis(analysis: InsertSprintAnalysis): Promise<SprintAnalysis>;
  
  // Predictions
  getPredictions(repositoryId: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  updatePrediction(id: string, data: Partial<InsertPrediction>): Promise<Prediction | undefined>;
  
  // Simulations
  getSimulations(repositoryId: string): Promise<Simulation[]>;
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  
  // Refactor Plans
  getRefactorPlans(repositoryId: string): Promise<RefactorPlan[]>;
  getRefactorPlan(id: string): Promise<RefactorPlan | undefined>;
  createRefactorPlan(plan: InsertRefactorPlan): Promise<RefactorPlan>;
  updateRefactorPlan(id: string, data: Partial<InsertRefactorPlan>): Promise<RefactorPlan | undefined>;
  
  // Dashboard
  getDashboardMetrics(repositoryId: string): Promise<DashboardMetrics>;
  getDashboardInsights(repositoryId: string): Promise<TemporalInsight[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private repositories: Map<string, Repository> = new Map();
  private knowledgeNodes: Map<string, KnowledgeNode> = new Map();
  private knowledgeEdges: Map<string, KnowledgeEdge> = new Map();
  private riskAnalyses: Map<string, RiskAnalysis> = new Map();
  private contributors: Map<string, Contributor> = new Map();
  private temporalMetrics: Map<string, TemporalMetric> = new Map();
  private architectureDrifts: Map<string, ArchitectureDrift> = new Map();
  private governanceRules: Map<string, GovernanceRule> = new Map();
  private sprintAnalyses: Map<string, SprintAnalysis> = new Map();
  private predictions: Map<string, Prediction> = new Map();
  private simulations: Map<string, Simulation> = new Map();
  private refactorPlans: Map<string, RefactorPlan> = new Map();
  
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { id: this.generateId(), ...insertUser };
    this.users.set(user.id, user);
    return user;
  }

  // Repositories
  async getRepository(id: string): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByFullName(fullName: string): Promise<Repository | undefined> {
    return Array.from(this.repositories.values()).find(r => r.fullName === fullName);
  }

  async createRepository(insert: InsertRepository): Promise<Repository> {
    const repo: Repository = {
      id: this.generateId(),
      ...insert,
      healthScore: insert.healthScore ?? 0,
      defaultBranch: insert.defaultBranch ?? "main",
      lastAnalyzedAt: null,
      createdAt: new Date(),
    };
    this.repositories.set(repo.id, repo);
    return repo;
  }

  async updateRepository(id: string, data: Partial<InsertRepository>): Promise<Repository | undefined> {
    const existing = this.repositories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.repositories.set(id, updated);
    return updated;
  }

  async listRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values());
  }

  // Knowledge Graph
  async getKnowledgeNodes(repositoryId: string): Promise<KnowledgeNode[]> {
    return Array.from(this.knowledgeNodes.values()).filter(n => n.repositoryId === repositoryId);
  }

  async createKnowledgeNode(insert: InsertKnowledgeNode): Promise<KnowledgeNode> {
    const node: KnowledgeNode = { id: this.generateId(), ...insert, createdAt: new Date() };
    this.knowledgeNodes.set(node.id, node);
    return node;
  }

  async getKnowledgeEdges(repositoryId: string): Promise<KnowledgeEdge[]> {
    return Array.from(this.knowledgeEdges.values()).filter(e => e.repositoryId === repositoryId);
  }

  async createKnowledgeEdge(insert: InsertKnowledgeEdge): Promise<KnowledgeEdge> {
    const edge: KnowledgeEdge = { id: this.generateId(), ...insert, weight: insert.weight ?? 1, createdAt: new Date() };
    this.knowledgeEdges.set(edge.id, edge);
    return edge;
  }

  // Risk Analysis
  async getRiskAnalyses(repositoryId: string): Promise<RiskAnalysis[]> {
    return Array.from(this.riskAnalyses.values()).filter(r => r.repositoryId === repositoryId);
  }

  async getRiskAnalysisByPR(repositoryId: string, prNumber: number): Promise<RiskAnalysis | undefined> {
    return Array.from(this.riskAnalyses.values()).find(
      r => r.repositoryId === repositoryId && r.prNumber === prNumber
    );
  }

  async createRiskAnalysis(insert: InsertRiskAnalysis): Promise<RiskAnalysis> {
    const analysis: RiskAnalysis = { id: this.generateId(), ...insert, createdAt: new Date() };
    this.riskAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  async getHighRiskAnalyses(repositoryId: string): Promise<RiskAnalysis[]> {
    return Array.from(this.riskAnalyses.values())
      .filter(r => r.repositoryId === repositoryId && r.overallRisk >= 60);
  }

  // Contributors
  async getContributors(repositoryId: string): Promise<Contributor[]> {
    return Array.from(this.contributors.values()).filter(c => c.repositoryId === repositoryId);
  }

  async getContributorByUsername(repositoryId: string, username: string): Promise<Contributor | undefined> {
    return Array.from(this.contributors.values()).find(
      c => c.repositoryId === repositoryId && c.username === username
    );
  }

  async createContributor(insert: InsertContributor): Promise<Contributor> {
    const contributor: Contributor = {
      id: this.generateId(),
      ...insert,
      qualityScore: insert.qualityScore ?? 0,
      reviewReliability: insert.reviewReliability ?? 0,
      riskProfile: insert.riskProfile ?? "normal",
      totalCommits: insert.totalCommits ?? 0,
      totalPRs: insert.totalPRs ?? 0,
      totalReviews: insert.totalReviews ?? 0,
      isSinglePointOfFailure: insert.isSinglePointOfFailure ?? false,
      lastActiveAt: insert.lastActiveAt ?? null,
      createdAt: new Date(),
    };
    this.contributors.set(contributor.id, contributor);
    return contributor;
  }

  async updateContributor(id: string, data: Partial<InsertContributor>): Promise<Contributor | undefined> {
    const existing = this.contributors.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.contributors.set(id, updated);
    return updated;
  }

  // Temporal Metrics
  async getTemporalMetrics(repositoryId: string): Promise<TemporalMetric[]> {
    return Array.from(this.temporalMetrics.values()).filter(t => t.repositoryId === repositoryId);
  }

  async createTemporalMetric(insert: InsertTemporalMetric): Promise<TemporalMetric> {
    const metric: TemporalMetric = { id: this.generateId(), ...insert, createdAt: new Date() };
    this.temporalMetrics.set(metric.id, metric);
    return metric;
  }

  // Architecture Drifts
  async getArchitectureDrifts(repositoryId: string): Promise<ArchitectureDrift[]> {
    return Array.from(this.architectureDrifts.values()).filter(d => d.repositoryId === repositoryId);
  }

  async createArchitectureDrift(insert: InsertArchitectureDrift): Promise<ArchitectureDrift> {
    const drift: ArchitectureDrift = {
      id: this.generateId(),
      ...insert,
      isResolved: insert.isResolved ?? false,
      createdAt: new Date(),
    };
    this.architectureDrifts.set(drift.id, drift);
    return drift;
  }

  async updateArchitectureDrift(id: string, data: Partial<InsertArchitectureDrift>): Promise<ArchitectureDrift | undefined> {
    const existing = this.architectureDrifts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.architectureDrifts.set(id, updated);
    return updated;
  }

  // Governance Rules
  async getGovernanceRules(repositoryId?: string): Promise<GovernanceRule[]> {
    const rules = Array.from(this.governanceRules.values());
    if (repositoryId) {
      return rules.filter(r => r.repositoryId === repositoryId || !r.repositoryId);
    }
    return rules;
  }

  async getGovernanceRule(id: string): Promise<GovernanceRule | undefined> {
    return this.governanceRules.get(id);
  }

  async createGovernanceRule(insert: InsertGovernanceRule): Promise<GovernanceRule> {
    const rule: GovernanceRule = {
      id: this.generateId(),
      ...insert,
      isEnabled: insert.isEnabled ?? true,
      severity: insert.severity ?? "warning",
      createdAt: new Date(),
    };
    this.governanceRules.set(rule.id, rule);
    return rule;
  }

  async updateGovernanceRule(id: string, data: Partial<InsertGovernanceRule>): Promise<GovernanceRule | undefined> {
    const existing = this.governanceRules.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.governanceRules.set(id, updated);
    return updated;
  }

  async deleteGovernanceRule(id: string): Promise<boolean> {
    return this.governanceRules.delete(id);
  }

  // Sprint Analysis
  async getSprintAnalyses(repositoryId: string): Promise<SprintAnalysis[]> {
    return Array.from(this.sprintAnalyses.values()).filter(s => s.repositoryId === repositoryId);
  }

  async getCurrentSprintAnalysis(repositoryId: string): Promise<SprintAnalysis | undefined> {
    const analyses = await this.getSprintAnalyses(repositoryId);
    return analyses.sort((a, b) => 
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    )[0];
  }

  async createSprintAnalysis(insert: InsertSprintAnalysis): Promise<SprintAnalysis> {
    const analysis: SprintAnalysis = {
      id: this.generateId(),
      ...insert,
      blockerCount: insert.blockerCount ?? 0,
      unreviewedPRs: insert.unreviewedPRs ?? 0,
      idleIssues: insert.idleIssues ?? 0,
      predictedCompletion: insert.predictedCompletion ?? 0,
      createdAt: new Date(),
    };
    this.sprintAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  // Predictions
  async getPredictions(repositoryId: string): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(p => p.repositoryId === repositoryId);
  }

  async createPrediction(insert: InsertPrediction): Promise<Prediction> {
    const prediction: Prediction = {
      id: this.generateId(),
      ...insert,
      isVerified: insert.isVerified ?? null,
      createdAt: new Date(),
    };
    this.predictions.set(prediction.id, prediction);
    return prediction;
  }

  async updatePrediction(id: string, data: Partial<InsertPrediction>): Promise<Prediction | undefined> {
    const existing = this.predictions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.predictions.set(id, updated);
    return updated;
  }

  // Simulations
  async getSimulations(repositoryId: string): Promise<Simulation[]> {
    return Array.from(this.simulations.values()).filter(s => s.repositoryId === repositoryId);
  }

  async createSimulation(insert: InsertSimulation): Promise<Simulation> {
    const simulation: Simulation = { id: this.generateId(), ...insert, createdAt: new Date() };
    this.simulations.set(simulation.id, simulation);
    return simulation;
  }

  // Refactor Plans
  async getRefactorPlans(repositoryId: string): Promise<RefactorPlan[]> {
    return Array.from(this.refactorPlans.values()).filter(p => p.repositoryId === repositoryId);
  }

  async getRefactorPlan(id: string): Promise<RefactorPlan | undefined> {
    return this.refactorPlans.get(id);
  }

  async createRefactorPlan(insert: InsertRefactorPlan): Promise<RefactorPlan> {
    const plan: RefactorPlan = {
      id: this.generateId(),
      ...insert,
      status: insert.status ?? "proposed",
      createdAt: new Date(),
    };
    this.refactorPlans.set(plan.id, plan);
    return plan;
  }

  async updateRefactorPlan(id: string, data: Partial<InsertRefactorPlan>): Promise<RefactorPlan | undefined> {
    const existing = this.refactorPlans.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.refactorPlans.set(id, updated);
    return updated;
  }

  // Dashboard
  async getDashboardMetrics(repositoryId: string): Promise<DashboardMetrics> {
    const riskAnalyses = await this.getHighRiskAnalyses(repositoryId);
    const contributors = await this.getContributors(repositoryId);
    const drifts = await this.getArchitectureDrifts(repositoryId);
    const rules = await this.getGovernanceRules(repositoryId);

    return {
      healthScore: 71,
      healthTrend: 5,
      highRiskPRs: riskAnalyses.length,
      architectureWarnings: drifts.filter(d => !d.isResolved).length,
      velocityTrend: 12,
      activeContributors: contributors.length || 8,
      pendingReviews: 4,
      governanceViolations: 1,
    };
  }

  async getDashboardInsights(repositoryId: string): Promise<TemporalInsight[]> {
    return [
      { type: "velocity", message: "Repository velocity increased 12% this week", severity: "info", trend: 12 },
      { type: "delay", message: "Average PR review time: 2.3 days (increased from 1.8 days)", severity: "warning", trend: 28 },
      { type: "burnout", message: "Core contributor activity dropped 38% in 2 weeks", severity: "critical", trend: -38 },
    ];
  }
}

export const storage = new MemStorage();
