import type { IStorage } from "./storage";
import type {
  InsertKnowledgeNode,
  InsertKnowledgeEdge,
  InsertRiskAnalysis,
  InsertContributor,
  InsertTemporalMetric,
  InsertArchitectureDrift,
  InsertSprintAnalysis,
  InsertPrediction,
  InsertSimulation,
  InsertRefactorPlan,
  InsertGovernanceRule,
} from "@shared/schema";

export async function generateMockData(storage: IStorage, repositoryId: string): Promise<void> {
  console.log(`[Mock Data] Starting generation for repository ${repositoryId}...`);

  let createdCounts = {
    knowledgeNodes: 0,
    knowledgeEdges: 0,
    riskAnalyses: 0,
    contributors: 0,
    temporalMetrics: 0,
    architectureDrifts: 0,
    sprintAnalyses: 0,
    predictions: 0,
    simulations: 0,
    refactorPlans: 0,
    governanceRules: 0,
  };

  // Check existing data
  try {
    const existingDrifts = await storage.getArchitectureDrifts(repositoryId);
    const existingMetrics = await storage.getTemporalMetrics(repositoryId);
    const existingNodes = await storage.getKnowledgeNodes(repositoryId);
    const existingSprints = await storage.getSprintAnalyses(repositoryId);
    
    console.log(`[Mock Data] Found existing: ${existingDrifts.length} drifts, ${existingMetrics.length} metrics, ${existingNodes.length} nodes, ${existingSprints.length} sprints`);
    console.log(`[Mock Data] Will generate new mock data (duplicates may be created if data already exists)`);
  } catch (err) {
    console.log(`[Mock Data] Could not check existing data:`, err);
  }

  // Generate Knowledge Graph Nodes and Edges
  const contributorNodes: string[] = [];
  try {
    for (let i = 0; i < 8; i++) {
      try {
        const node = await storage.createKnowledgeNode({
          repositoryId,
          nodeType: "contributor",
          nodeId: `contributor:user${i + 1}`,
          label: `contributor${i + 1}`,
          metadata: {
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
            totalCommits: Math.floor(Math.random() * 100) + 10,
            totalPRs: Math.floor(Math.random() * 20) + 2,
          },
        });
        contributorNodes.push(node.id);
        createdCounts.knowledgeNodes++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Contributor node ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating contributor node ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating contributor nodes:", err);
  }

  const prNodes: string[] = [];
  try {
    for (let i = 0; i < 15; i++) {
      try {
        const node = await storage.createKnowledgeNode({
          repositoryId,
          nodeType: "pr",
          nodeId: `pr:${i + 1}`,
          label: `PR #${i + 1}: Feature implementation ${i + 1}`,
          metadata: {
            number: i + 1,
            title: `Feature implementation ${i + 1}`,
            state: i % 3 === 0 ? "open" : "closed",
            author: `contributor${(i % 8) + 1}`,
          },
        });
        prNodes.push(node.id);
        createdCounts.knowledgeNodes++;
        
        // Create edge from contributor to PR
        if (contributorNodes[i % 8]) {
          try {
            await storage.createKnowledgeEdge({
              repositoryId,
              sourceNodeId: contributorNodes[i % 8],
              targetNodeId: node.id,
              edgeType: "owns",
              weight: 1,
            });
            createdCounts.knowledgeEdges++;
          } catch (err: any) {
            if (err?.message?.includes('duplicate') || err?.code === '23505') {
              console.log(`[Mock Data] Edge for PR ${i + 1} already exists, skipping`);
            } else {
              console.error(`[Mock Data] Error creating edge for PR ${i + 1}:`, err?.message || err);
            }
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] PR node ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating PR node ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating PR nodes:", err);
  }

  const issueNodes: string[] = [];
  try {
    for (let i = 0; i < 12; i++) {
      try {
        const node = await storage.createKnowledgeNode({
          repositoryId,
          nodeType: "issue",
          nodeId: `issue:${i + 1}`,
          label: `Issue #${i + 1}: Bug fix ${i + 1}`,
          metadata: {
            number: i + 1,
            title: `Bug fix ${i + 1}`,
            state: i % 2 === 0 ? "open" : "closed",
            author: `contributor${(i % 8) + 1}`,
          },
        });
        issueNodes.push(node.id);
        createdCounts.knowledgeNodes++;
        
        if (contributorNodes[i % 8]) {
          try {
            await storage.createKnowledgeEdge({
              repositoryId,
              sourceNodeId: contributorNodes[i % 8],
              targetNodeId: node.id,
              edgeType: "owns",
              weight: 1,
            });
            createdCounts.knowledgeEdges++;
          } catch (err: any) {
            if (err?.message?.includes('duplicate') || err?.code === '23505') {
              console.log(`[Mock Data] Edge for issue ${i + 1} already exists, skipping`);
            } else {
              console.error(`[Mock Data] Error creating edge for issue ${i + 1}:`, err?.message || err);
            }
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Issue node ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating issue node ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating issue nodes:", err);
  }

  const commitNodes: string[] = [];
  try {
    for (let i = 0; i < 25; i++) {
      try {
        const node = await storage.createKnowledgeNode({
          repositoryId,
          nodeType: "commit",
          nodeId: `commit:${i + 1}`,
          label: `feat: Add new feature ${i + 1}`,
          metadata: {
            sha: `abc${i + 1}def`,
            message: `feat: Add new feature ${i + 1}`,
            author: `contributor${(i % 8) + 1}`,
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          },
        });
        commitNodes.push(node.id);
        createdCounts.knowledgeNodes++;
        
        if (contributorNodes[i % 8]) {
          try {
            await storage.createKnowledgeEdge({
              repositoryId,
              sourceNodeId: contributorNodes[i % 8],
              targetNodeId: node.id,
              edgeType: "modified_by",
              weight: 1,
            });
            createdCounts.knowledgeEdges++;
          } catch (err: any) {
            if (err?.message?.includes('duplicate') || err?.code === '23505') {
              console.log(`[Mock Data] Edge for commit ${i + 1} already exists, skipping`);
            } else {
              console.error(`[Mock Data] Error creating edge for commit ${i + 1}:`, err?.message || err);
            }
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Commit node ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating commit node ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating commit nodes:", err);
  }

  // Generate Risk Analyses
  try {
    for (let i = 0; i < 10; i++) {
      try {
        await storage.createRiskAnalysis({
          repositoryId,
          prNumber: i + 1,
          overallRisk: Math.floor(Math.random() * 40) + 30,
          codeRisk: Math.floor(Math.random() * 40) + 30,
          processRisk: Math.floor(Math.random() * 40) + 30,
          humanRisk: Math.floor(Math.random() * 40) + 30,
          architecturalRisk: Math.floor(Math.random() * 40) + 30,
          releaseRisk: Math.floor(Math.random() * 40) + 30,
          explanation: `PR #${i + 1} introduces moderate risk due to changes in core functionality.`,
          recommendations: [
            "Add unit tests for new functionality",
            "Request review from senior team member",
            "Update documentation",
          ],
        });
        createdCounts.riskAnalyses++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Risk analysis ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating risk analysis ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating risk analyses:", err);
  }

  // Generate Contributors
  try {
    for (let i = 0; i < 8; i++) {
      try {
        await storage.createContributor({
          repositoryId,
          username: `contributor${i + 1}`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
          totalCommits: Math.floor(Math.random() * 100) + 10,
          totalPRs: Math.floor(Math.random() * 20) + 2,
          totalReviews: Math.floor(Math.random() * 30) + 5,
          qualityScore: Math.floor(Math.random() * 30) + 60,
          reviewReliability: Math.floor(Math.random() * 30) + 60,
          riskProfile: i < 2 ? "high" : i < 5 ? "normal" : "low",
          isSinglePointOfFailure: i === 0,
          lastActiveAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        });
        createdCounts.contributors++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Contributor ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating contributor ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating contributors:", err);
  }

  // Generate Temporal Metrics (last 8 weeks)
  try {
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      try {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        
        await storage.createTemporalMetric({
          repositoryId,
          metricDate: weekEnd,
          velocity: Math.floor(Math.random() * 30) + 40,
          codeChurn: (Math.random() * 0.4) - 0.2, // -0.2 to 0.2
          prReviewTime: Math.floor(Math.random() * 20) + 10,
          commitFrequency: Math.floor(Math.random() * 30) + 20,
          contributorActivity: Math.floor(Math.random() * 5) + 5,
        });
        createdCounts.temporalMetrics++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Temporal metric for week ${i} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating temporal metric for week ${i}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating temporal metrics:", err);
  }

  // Generate Architecture Drifts
  try {
    const driftTypes = ["god_file", "circular_dependency", "boundary_blur", "structure_degradation"];
    const severities = ["low", "medium", "high", "critical"] as const;
    
    for (let i = 0; i < 6; i++) {
      try {
        await storage.createArchitectureDrift({
          repositoryId,
          driftType: driftTypes[i % 4] as any,
          severity: severities[Math.floor(i / 2)] as any,
          affectedFiles: [`src/components/Component${i + 1}.tsx`, `src/utils/util${i + 1}.ts`],
          description: `Detected ${driftTypes[i % 4].replace(/_/g, ' ')} in the codebase.`,
          suggestion: `Consider refactoring to improve code organization and maintainability.`,
          isResolved: i >= 4,
        });
        createdCounts.architectureDrifts++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Architecture drift ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating architecture drift ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating architecture drifts:", err);
  }

  // Generate Sprint Analysis
  try {
    await storage.createSprintAnalysis({
      repositoryId,
      sprintName: "Sprint 42",
      riskLevel: "medium",
      blockerCount: 2,
      unreviewedPRs: 3,
      idleIssues: 1,
      predictedCompletion: 85,
      insights: [
        "Sprint velocity is 10% below target",
        "Code quality metrics are within acceptable range",
        "Team collaboration is strong",
        "Some PRs are pending review for more than 2 days",
      ],
      recommendations: [
        "Prioritize review of pending PRs to avoid bottlenecks",
        "Consider extending sprint deadline if critical features are incomplete",
        "Schedule team sync to address blockers",
      ],
    });
    createdCounts.sprintAnalyses++;
  } catch (err: any) {
    if (err?.message?.includes('duplicate') || err?.code === '23505') {
      console.log(`[Mock Data] Sprint analysis already exists, skipping`);
    } else {
      console.error(`[Mock Data] Error generating sprint analysis:`, err?.message || err);
    }
  }

  // Generate Predictions
  try {
    for (let i = 0; i < 5; i++) {
      try {
        await storage.createPrediction({
          repositoryId,
          targetType: i % 2 === 0 ? "pr" : "contributor",
          targetId: `target-${i + 1}`,
          predictionType: i % 2 === 0 ? "merge_probability" : "activity_forecast",
          confidence: Math.floor(Math.random() * 30) + 60,
          predictedValue: Math.random() * 100,
          context: {
            factors: ["Historical data", "Team patterns", "Code complexity"],
          },
        });
        createdCounts.predictions++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Prediction ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating prediction ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating predictions:", err);
  }

  // Generate Simulations
  try {
    for (let i = 0; i < 3; i++) {
      try {
        await storage.createSimulation({
          repositoryId,
          simulationType: i % 2 === 0 ? "pr_merge" : "contributor_departure",
          scenario: i % 2 === 0 ? "Merge large PR" : "Key contributor leaves",
          projectedRiskImpact: {
            currentRisk: 45,
            projectedRisk: 65,
            riskDelta: 20,
          },
          insights: {
            impactAreas: ["Code quality", "Review process", "Team velocity"],
            recommendations: ["Increase test coverage", "Improve documentation"],
          },
        });
        createdCounts.simulations++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Simulation ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating simulation ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating simulations:", err);
  }

  // Generate Refactor Plans
  try {
    for (let i = 0; i < 4; i++) {
      try {
        await storage.createRefactorPlan({
          repositoryId,
          description: `Refactor plan ${i + 1}: Improve code organization`,
          affectedFiles: [`src/components/Component${i + 1}.tsx`],
          steps: [
            `Step 1: Extract utility functions`,
            `Step 2: Split component into smaller parts`,
            `Step 3: Add unit tests`,
          ],
          estimatedEffort: Math.floor(Math.random() * 20) + 10,
          riskLevel: i % 2 === 0 ? "low" : "medium",
          status: i < 2 ? "planned" : "in_progress",
        });
        createdCounts.refactorPlans++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Refactor plan ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating refactor plan ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating refactor plans:", err);
  }

  // Generate Governance Rules
  try {
    const ruleTypes = ["code_quality", "security", "performance", "documentation"];
    for (let i = 0; i < 8; i++) {
      try {
        await storage.createGovernanceRule({
          repositoryId,
          ruleType: ruleTypes[i % 4] as any,
          name: `Rule ${i + 1}: ${ruleTypes[i % 4]} requirement`,
          description: `Enforce ${ruleTypes[i % 4]} standards`,
          severity: i < 4 ? "error" : "warning",
          pattern: `pattern-${i + 1}`,
          isActive: i < 6,
        });
        createdCounts.governanceRules++;
      } catch (err: any) {
        if (err?.message?.includes('duplicate') || err?.code === '23505') {
          console.log(`[Mock Data] Governance rule ${i + 1} already exists, skipping`);
        } else {
          console.error(`[Mock Data] Error creating governance rule ${i + 1}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error generating governance rules:", err);
  }

  console.log(`[Mock Data] Generation completed for repository ${repositoryId}`);
  console.log(`[Mock Data] Created:`, createdCounts);
  console.log(`[Mock Data] Summary: ${createdCounts.knowledgeNodes} nodes, ${createdCounts.knowledgeEdges} edges, ${createdCounts.riskAnalyses} risk analyses, ${createdCounts.contributors} contributors, ${createdCounts.temporalMetrics} temporal metrics, ${createdCounts.architectureDrifts} drifts, ${createdCounts.sprintAnalyses} sprints`);
}

