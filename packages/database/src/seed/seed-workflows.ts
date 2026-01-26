import * as dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// Load environment variables from root BEFORE importing database client
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function seedWorkflows() {
  // Dynamic import to ensure process.env.DATABASE_URL is set
  const { db } = await import('../drizzle/client');
  const { agents, pipelines, workflows, workflowSteps, workflowExecutions, users } = await import('../drizzle/schema');

  console.log('🌱 Seeding workflows, agents, and historical data...');


  // 1. Get or Create a User (Creator)
  let creatorId = uuidv4();
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    creatorId = existingUsers[0].id;
    console.log(`Using existing user: ${creatorId}`);
  } else {
    // Determine the strategy. The users table might be managed by Clerk/Auth0 externally,
    // but typically strict FKs require a record.
    // For now we assume a user exists or we insert a placeholder if strict mode off.
    console.warn('No users found. Creating placeholder user.');
    const [newUser] = await db.insert(users).values({
      id: creatorId,
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
  }

  // 2. Create Agents for the Workflow
  const agentDefinitions = [
    {
      name: 'Code Critic',
      type: 'CODE_REVIEWER',
      description: 'Senior engineer persona for high-level architecture review.',
      capabilities: ['code-analysis', 'architecture-review'],
      model: 'gpt-4-turbo',
      status: 'ACTIVE'
    },
    {
      name: 'Lint Bot',
      type: 'CODE_TESTER',
      description: 'Strict linter and style enforcer.',
      capabilities: ['linting', 'formatting'],
      model: 'gpt-3.5-turbo',
      status: 'ACTIVE'
    },
    {
      name: 'Security Guardian',
      type: 'CODE_SECURITY',
      description: 'Vulnerability scanner.',
      capabilities: ['security-audit', 'dependency-check'],
      model: 'claude-3-opus',
      status: 'ACTIVE'
    }
  ];

  const agentMap = new Map<string, string>(); // Name -> ID

  for (const def of agentDefinitions) {
    const existing = await db.select().from(agents).where(eq(agents.name, def.name));
    if (existing.length > 0) {
      agentMap.set(def.name, existing[0].id);
    } else {
      const [newAgent] = await db.insert(agents).values({
        name: def.name,
        type: def.type as any,
        description: def.description,
        capabilities: def.capabilities,
        status: def.status as any,
        config: { model: def.model },
        userId: creatorId,
      }).returning();
      agentMap.set(def.name, newAgent.id);
    }
  }

  // 3. Construct the "AI Generated" Workflow JSON
  // "Code Review Pipeline"
  const workflowId = uuidv4();

  const reactFlowNodes = [
    {
      id: 'node-start',
      type: 'input',
      position: { x: 50, y: 50 },
      data: { label: 'GitHub PR Open', type: 'input' }
    },
    {
      id: 'node-lint',
      type: 'agent',
      position: { x: 50, y: 150 },
      data: {
        label: 'Lint Check',
        agentId: agentMap.get('Lint Bot'),
        agentName: 'Lint Bot',
        type: 'agent'
      }
    },
    {
      id: 'node-condition',
      type: 'condition',
      position: { x: 50, y: 280 },
      data: { label: 'Is Clean?', type: 'condition' }
    },
    {
      id: 'node-review',
      type: 'agent',
      position: { x: -100, y: 400 },
      data: {
        label: 'Deep Review',
        agentId: agentMap.get('Code Critic'),
        agentName: 'Code Critic',
        type: 'agent'
      }
    },
    {
      id: 'node-security',
      type: 'agent',
      position: { x: 200, y: 400 },
      data: {
        label: 'Security Scan',
        agentId: agentMap.get('Security Guardian'),
        agentName: 'Security Guardian',
        type: 'agent'
      }
    },
    {
      id: 'node-end',
      type: 'output',
      position: { x: 50, y: 550 },
      data: { label: 'Merge Report', type: 'output' }
    }
  ];

  const reactFlowEdges = [
    { id: 'e1', source: 'node-start', target: 'node-lint' },
    { id: 'e2', source: 'node-lint', target: 'node-condition' },
    { id: 'e3', source: 'node-condition', target: 'node-review', label: 'Yes' },
    { id: 'e4', source: 'node-condition', target: 'node-security', label: 'No' },
    { id: 'e5', source: 'node-review', target: 'node-end' },
    { id: 'e6', source: 'node-security', target: 'node-end' }
  ];

  const workflowDefinition = {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    viewport: { x: 0, y: 0, zoom: 1 }
  };

  // Insert Workflow
  console.log(`Creating workflow: Code Review Pipeline`);
  await db.insert(workflows).values({
    id: workflowId,
    name: 'Code Review Pipeline',
    description: 'Automated CI/CD pipeline for auditing pull requests.',
    definition: workflowDefinition,
    status: 'ACTIVE',
    creatorId: creatorId,
    executionCount: 2542,
    isActive: true,
    metadata: {
        aiGenerated: true,
        complexity: 'High',
        tags: ['ci-cd', 'security', 'quality']
    }
  }).onConflictDoNothing(); // Basic idempotency

  // 4. Generate Historical Executions (Trace Data)
  console.log('Generating execution history...');

  const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'FAILED', 'COMPLETED'];
  const now = Date.now();

  // Create 50 executions over last 7 days
  for(let i=0; i<50; i++) {
    const status = statuses[i % 5];
    const duration = Math.floor(Math.random() * 5000) + 1000; // 1-6s
    const timeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
    const date = new Date(now - timeOffset);

    await db.insert(workflowExecutions).values({
      workflowId: workflowId,
      status: status as any,
      input: { pr_id: 1000 + i },
      output: status === 'COMPLETED' ? { approved: true } : { error: 'Lint failed' },
      startedAt: date,
      completedAt: new Date(date.getTime() + duration),
      projectId: null // Optional
    });
  }

  console.log('✅ Seed completed successfully!');
  process.exit(0);
}

seedWorkflows().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
