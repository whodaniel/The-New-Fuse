/**
 * Real-World Scenarios End-to-End Tests
 *
 * Scenario 1: "Code Review Workflow" (3 agents + 1 human)
 * Scenario 2: "Self-Improvement Sprint" (5 agents improving The New Fuse)
 * Scenario 3: "Documentation Generation" (agents write docs for new features)
 */

import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const WS_URL = process.env.WS_URL || 'ws://localhost:3004';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test.describe('Scenario 1: Code Review Workflow (3 Agents + 1 Human)', () => {
  let authToken: string;
  let userId: string;
  let developerAgent: any;
  let reviewerAgent: any;
  let qaAgent: any;
  let workflowId: string;
  let chatRoomId: string;

  test.setTimeout(180000); // 3 minutes

  test('Setup: Create User and 3 Specialized Agents', async () => {
    // Create user
    const userResponse = await axios.post(
      `${API_BASE_URL}/auth/register`,
      {
        email: `code-review-${Date.now()}@example.com`,
        password: 'CodeReview123!',
        firstName: 'Code',
        lastName: 'Reviewer'
      }
    );

    authToken = userResponse.data.token;
    userId = userResponse.data.user.id;

    // Create Developer Agent
    const devResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      {
        name: 'Senior Developer Agent',
        type: 'developer',
        capabilities: [
          'code-generation',
          'refactoring',
          'optimization',
          'best-practices'
        ],
        metadata: {
          specialty: 'full-stack',
          experience: 'senior',
          languages: ['typescript', 'javascript', 'python', 'go']
        }
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    developerAgent = devResponse.data;

    // Create Code Reviewer Agent
    const reviewResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      {
        name: 'Code Review Specialist Agent',
        type: 'reviewer',
        capabilities: [
          'code-review',
          'security-analysis',
          'performance-analysis',
          'architecture-review'
        ],
        metadata: {
          reviewFocus: ['security', 'performance', 'maintainability'],
          strictness: 'high'
        }
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    reviewerAgent = reviewResponse.data;

    // Create QA Agent
    const qaResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      {
        name: 'QA Testing Agent',
        type: 'tester',
        capabilities: [
          'test-generation',
          'test-automation',
          'integration-testing',
          'bug-detection'
        ],
        metadata: {
          testingFrameworks: ['jest', 'playwright', 'vitest'],
          coverage: 'comprehensive'
        }
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    qaAgent = qaResponse.data;

    console.log('✅ Created 3 specialized agents for code review');
  });

  test('Step 1: Human Submits Code for Review', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Login
    await page.fill('input[name="email"]', `code-review-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'CodeReview123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');

    // Navigate to code review section
    await page.click('text=Code Review');

    // Submit new code for review
    const codeToReview = `
      function calculateTotal(items) {
        let total = 0;
        for (let i = 0; i < items.length; i++) {
          total += items[i].price * items[i].quantity;
        }
        return total;
      }
    `;

    await page.fill('textarea[name="code"]', codeToReview);
    await page.fill('input[name="title"]', 'Calculate Total Function');
    await page.fill('textarea[name="description"]', 'Please review this function for any improvements');
    await page.click('button[type="submit"]');

    // Wait for submission confirmation
    await page.waitForSelector('text=Code submitted for review');

    console.log('✅ Human submitted code for review');
  });

  test('Step 2: Developer Agent Analyzes and Improves Code', async () => {
    // Get pending code reviews
    const reviewsResponse = await axios.get(
      `${BACKEND_URL}/code-reviews/pending`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    const review = reviewsResponse.data.reviews[0];
    const reviewId = review.id;

    // Developer agent analyzes code
    const analysisResponse = await axios.post(
      `${BACKEND_URL}/agents/${developerAgent.id}/analyze`,
      {
        reviewId: reviewId,
        code: review.code
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(analysisResponse.data).toHaveProperty('suggestions');
    expect(analysisResponse.data).toHaveProperty('improvedCode');

    // Agent posts improved version
    const improvedCode = analysisResponse.data.improvedCode;

    await axios.post(
      `${BACKEND_URL}/code-reviews/${reviewId}/versions`,
      {
        code: improvedCode,
        agentId: developerAgent.id,
        changes: analysisResponse.data.suggestions
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('✅ Developer agent analyzed and improved code');
    console.log(`   Suggestions: ${analysisResponse.data.suggestions.length}`);
  });

  test('Step 3: Reviewer Agent Performs Security & Performance Review', async () => {
    const reviewsResponse = await axios.get(
      `${BACKEND_URL}/code-reviews/pending`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    const review = reviewsResponse.data.reviews[0];
    const latestVersion = review.versions[review.versions.length - 1];

    // Reviewer agent performs comprehensive review
    const reviewResponse = await axios.post(
      `${BACKEND_URL}/agents/${reviewerAgent.id}/review`,
      {
        reviewId: review.id,
        code: latestVersion.code,
        focusAreas: ['security', 'performance', 'best-practices']
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(reviewResponse.data).toHaveProperty('securityIssues');
    expect(reviewResponse.data).toHaveProperty('performanceIssues');
    expect(reviewResponse.data).toHaveProperty('rating');

    // Post review comments
    await axios.post(
      `${BACKEND_URL}/code-reviews/${review.id}/comments`,
      {
        agentId: reviewerAgent.id,
        comments: reviewResponse.data.comments,
        rating: reviewResponse.data.rating
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('✅ Reviewer agent completed security & performance review');
    console.log(`   Security issues: ${reviewResponse.data.securityIssues.length}`);
    console.log(`   Performance issues: ${reviewResponse.data.performanceIssues.length}`);
    console.log(`   Overall rating: ${reviewResponse.data.rating}/10`);
  });

  test('Step 4: QA Agent Generates Tests', async () => {
    const reviewsResponse = await axios.get(
      `${BACKEND_URL}/code-reviews/pending`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    const review = reviewsResponse.data.reviews[0];
    const latestVersion = review.versions[review.versions.length - 1];

    // QA agent generates tests
    const testsResponse = await axios.post(
      `${BACKEND_URL}/agents/${qaAgent.id}/generate-tests`,
      {
        reviewId: review.id,
        code: latestVersion.code,
        testTypes: ['unit', 'integration', 'edge-cases']
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(testsResponse.data).toHaveProperty('tests');
    expect(testsResponse.data.tests.length).toBeGreaterThan(0);

    // Post generated tests
    await axios.post(
      `${BACKEND_URL}/code-reviews/${review.id}/tests`,
      {
        agentId: qaAgent.id,
        tests: testsResponse.data.tests
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('✅ QA agent generated comprehensive tests');
    console.log(`   Test cases generated: ${testsResponse.data.tests.length}`);
  });

  test('Step 5: All Agents Collaborate in Chat Room', async () => {
    // Create collaboration chat room
    const roomResponse = await axios.post(
      `${BACKEND_URL}/chat/rooms`,
      {
        name: 'Code Review Discussion',
        participants: [userId, developerAgent.id, reviewerAgent.id, qaAgent.id],
        type: 'code-review'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    chatRoomId = roomResponse.data.id;

    // Simulate collaboration messages
    const messages = [
      {
        from: developerAgent.id,
        text: 'I\'ve refactored the function to use reduce() which is more functional and concise.'
      },
      {
        from: reviewerAgent.id,
        text: 'Good improvement! However, we should add input validation for the items array.'
      },
      {
        from: qaAgent.id,
        text: 'I\'ve generated tests covering edge cases including empty arrays and null values.'
      },
      {
        from: userId,
        text: 'Great work team! Let\'s apply these changes.'
      }
    ];

    for (const msg of messages) {
      await axios.post(
        `${BACKEND_URL}/chat/rooms/${chatRoomId}/messages`,
        {
          senderId: msg.from,
          message: msg.text
        },
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Verify all messages were saved
    const historyResponse = await axios.get(
      `${BACKEND_URL}/chat/rooms/${chatRoomId}/messages`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(historyResponse.data.messages.length).toBeGreaterThanOrEqual(4);

    console.log('✅ Agents collaborated in chat room');
    console.log(`   Messages exchanged: ${historyResponse.data.messages.length}`);
  });
});

test.describe('Scenario 2: Self-Improvement Sprint (5 Agents)', () => {
  let authToken: string;
  let agents: any[] = [];

  test.setTimeout(300000); // 5 minutes

  test('Setup: Create 5 Improvement Agents', async () => {
    const authResponse = await axios.post(
      `${API_BASE_URL}/auth/test-token`,
      { test: true }
    );
    authToken = authResponse.data.token;

    const agentSpecs = [
      {
        name: 'Architecture Analyst Agent',
        type: 'architect',
        capabilities: ['architecture-analysis', 'system-design', 'scalability-planning']
      },
      {
        name: 'Performance Optimizer Agent',
        type: 'optimizer',
        capabilities: ['performance-profiling', 'optimization', 'benchmarking']
      },
      {
        name: 'Security Auditor Agent',
        type: 'security',
        capabilities: ['security-audit', 'vulnerability-scanning', 'compliance-checking']
      },
      {
        name: 'UX Improvement Agent',
        type: 'designer',
        capabilities: ['ux-analysis', 'ui-improvement', 'accessibility-audit']
      },
      {
        name: 'Documentation Writer Agent',
        type: 'writer',
        capabilities: ['documentation', 'api-docs', 'user-guides']
      }
    ];

    for (const spec of agentSpecs) {
      const response = await axios.post(
        `${API_BASE_URL}/agents/register`,
        spec,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );
      agents.push(response.data);
    }

    console.log('✅ Created 5 improvement agents');
  });

  test('Phase 1: Analyze Current System', async () => {
    const analysisPromises = agents.map(agent =>
      axios.post(
        `${BACKEND_URL}/agents/${agent.id}/analyze-system`,
        {
          scope: 'full-system',
          depth: 'comprehensive'
        },
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )
    );

    const results = await Promise.all(analysisPromises);

    for (let i = 0; i < results.length; i++) {
      const analysis = results[i].data;
      expect(analysis).toHaveProperty('findings');
      expect(analysis).toHaveProperty('recommendations');

      console.log(`   ${agents[i].name} found ${analysis.findings.length} issues`);
    }

    console.log('✅ System analysis complete');
  });

  test('Phase 2: Create Improvement Tasks', async () => {
    const taskPromises = agents.map(agent =>
      axios.post(
        `${BACKEND_URL}/tasks/create`,
        {
          agentId: agent.id,
          type: 'improvement',
          title: `Improvements by ${agent.name}`,
          priority: 'high'
        },
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )
    );

    const tasks = await Promise.all(taskPromises);

    expect(tasks.length).toBe(5);

    console.log('✅ Created improvement tasks for all agents');
  });

  test('Phase 3: Agents Collaborate on Solutions', async () => {
    // Create sprint planning workflow
    const workflowResponse = await axios.post(
      `${BACKEND_URL}/workflows/create`,
      {
        name: 'Self-Improvement Sprint',
        nodes: [
          { id: 'start', type: 'start' },
          {
            id: 'parallel-improvements',
            type: 'parallel',
            data: {
              branches: agents.map((agent, idx) => ({
                id: `improve-${idx}`,
                type: 'agent',
                data: {
                  agentId: agent.id,
                  action: 'implement-improvements'
                }
              }))
            }
          },
          {
            id: 'review-improvements',
            type: 'agent',
            data: {
              agentId: agents[2].id, // Security auditor reviews all
              action: 'review-all-improvements'
            }
          },
          { id: 'end', type: 'end' }
        ],
        edges: [
          { source: 'start', target: 'parallel-improvements' },
          { source: 'parallel-improvements', target: 'review-improvements' },
          { source: 'review-improvements', target: 'end' }
        ]
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    const workflowId = workflowResponse.data.id;

    // Execute workflow
    const executionResponse = await axios.post(
      `${BACKEND_URL}/workflows/${workflowId}/execute`,
      {
        input: {
          sprintGoal: 'Improve The New Fuse performance and security'
        }
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('✅ Started collaborative improvement workflow');
  });

  test('Phase 4: Generate Improvement Report', async () => {
    const reportResponse = await axios.post(
      `${BACKEND_URL}/reports/generate`,
      {
        type: 'self-improvement-sprint',
        agentIds: agents.map(a => a.id),
        includeMetrics: true
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(reportResponse.data).toHaveProperty('improvements');
    expect(reportResponse.data).toHaveProperty('metrics');
    expect(reportResponse.data).toHaveProperty('recommendations');

    console.log('📊 Self-Improvement Sprint Report:');
    console.log(`   Total improvements: ${reportResponse.data.improvements.length}`);
    console.log(`   Recommendations: ${reportResponse.data.recommendations.length}`);
  });
});

test.describe('Scenario 3: Documentation Generation', () => {
  let authToken: string;
  let docAgents: any[] = [];

  test.setTimeout(240000); // 4 minutes

  test('Setup: Create Documentation Team', async () => {
    const authResponse = await axios.post(
      `${API_BASE_URL}/auth/test-token`,
      { test: true }
    );
    authToken = authResponse.data.token;

    const agentSpecs = [
      {
        name: 'API Documentation Agent',
        type: 'writer',
        capabilities: ['api-documentation', 'openapi-generation', 'examples']
      },
      {
        name: 'User Guide Agent',
        type: 'writer',
        capabilities: ['user-guides', 'tutorials', 'how-tos']
      },
      {
        name: 'Technical Writer Agent',
        type: 'writer',
        capabilities: ['technical-writing', 'architecture-docs', 'diagrams']
      }
    ];

    for (const spec of agentSpecs) {
      const response = await axios.post(
        `${API_BASE_URL}/agents/register`,
        spec,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );
      docAgents.push(response.data);
    }

    console.log('✅ Created documentation team');
  });

  test('Step 1: Scan Codebase for Undocumented Features', async () => {
    const scanResponse = await axios.post(
      `${BACKEND_URL}/documentation/scan`,
      {
        scope: 'all',
        checkCoverage: true
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(scanResponse.data).toHaveProperty('undocumentedFeatures');
    expect(scanResponse.data).toHaveProperty('coveragePercentage');

    console.log('📝 Documentation Coverage:');
    console.log(`   Current coverage: ${scanResponse.data.coveragePercentage}%`);
    console.log(`   Undocumented features: ${scanResponse.data.undocumentedFeatures.length}`);
  });

  test('Step 2: API Documentation Agent Generates API Docs', async () => {
    const apiDocsResponse = await axios.post(
      `${BACKEND_URL}/agents/${docAgents[0].id}/generate-docs`,
      {
        type: 'api',
        format: 'openapi',
        includeExamples: true
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(apiDocsResponse.data).toHaveProperty('openapi');
    expect(apiDocsResponse.data.openapi).toHaveProperty('paths');
    expect(apiDocsResponse.data.openapi).toHaveProperty('components');

    const pathCount = Object.keys(apiDocsResponse.data.openapi.paths).length;

    console.log('✅ API documentation generated');
    console.log(`   Endpoints documented: ${pathCount}`);
  });

  test('Step 3: User Guide Agent Creates Tutorials', async () => {
    const guidesResponse = await axios.post(
      `${BACKEND_URL}/agents/${docAgents[1].id}/generate-docs`,
      {
        type: 'user-guide',
        topics: [
          'Getting Started',
          'Creating Your First Agent',
          'Building Workflows',
          'Agent Collaboration',
          'Deployment Guide'
        ]
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(guidesResponse.data).toHaveProperty('guides');
    expect(guidesResponse.data.guides.length).toBeGreaterThan(0);

    console.log('✅ User guides generated');
    console.log(`   Guides created: ${guidesResponse.data.guides.length}`);
  });

  test('Step 4: Technical Writer Creates Architecture Docs', async () => {
    const archDocsResponse = await axios.post(
      `${BACKEND_URL}/agents/${docAgents[2].id}/generate-docs`,
      {
        type: 'architecture',
        includeDiagrams: true,
        includeSequenceDiagrams: true
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(archDocsResponse.data).toHaveProperty('documents');
    expect(archDocsResponse.data).toHaveProperty('diagrams');

    console.log('✅ Architecture documentation generated');
    console.log(`   Documents: ${archDocsResponse.data.documents.length}`);
    console.log(`   Diagrams: ${archDocsResponse.data.diagrams.length}`);
  });

  test('Step 5: Verify Documentation Quality', async () => {
    const qualityResponse = await axios.post(
      `${BACKEND_URL}/documentation/quality-check`,
      {
        checkGrammar: true,
        checkCompleteness: true,
        checkAccuracy: true
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    expect(qualityResponse.data).toHaveProperty('score');
    expect(qualityResponse.data).toHaveProperty('issues');

    console.log('📊 Documentation Quality Report:');
    console.log(`   Overall score: ${qualityResponse.data.score}/100`);
    console.log(`   Issues found: ${qualityResponse.data.issues.length}`);
  });
});
