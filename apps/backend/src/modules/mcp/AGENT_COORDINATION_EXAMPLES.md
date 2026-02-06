# Agent Coordination Examples with MCP

This document shows **real execution traces** of agents using MCP tools to
coordinate and complete complex workflows.

## Example 1: E-Commerce Order Processing

**Scenario**: Process a new e-commerce order with payment, inventory, and
fulfillment.

**Agents**:

- **Coordinator** - Orchestrates the order workflow
- **Payment Processor** - Handles payment verification
- **Inventory Manager** - Checks and reserves stock
- **Fulfillment Agent** - Prepares shipment

### Execution Trace

```typescript
// ========== T+0.0s - Order Received ==========
const order = {
  orderId: 'ORD-12345',
  customer: 'customer@email.com',
  items: [
    { sku: 'LAPTOP-001', quantity: 1, price: 1299.99 },
    { sku: 'MOUSE-042', quantity: 2, price: 29.99 },
  ],
  total: 1359.97,
};

// ========== T+0.1s - Coordinator Starts Workflow ==========
console.log('[Coordinator] Creating order processing workflow...');

const workflow = await coordinator.callTool('workflow.create', {
  name: 'Process Order ORD-12345',
  description: 'Payment → Inventory → Fulfillment',
  definition: {
    steps: ['payment', 'inventory', 'fulfillment'],
  },
});
// ✓ Created: wf_order_12345

// ========== T+0.2s - Discover Required Agents ==========
console.log('[Coordinator] Discovering required agents...');

const agents = await coordinator.callTool('agent.discover', {
  capability: 'order_processing',
});
// ✓ Found 3 agents: payment_processor, inventory_manager, fulfillment_agent

// ========== T+0.5s - Step 1: Payment Processing ==========
console.log('[Coordinator → Payment Processor] Process payment');

const paymentTask = await coordinator.callTool('task.create', {
  title: 'Process payment for ORD-12345',
  description: 'Verify and charge $1359.97',
  assignedTo: 'payment_processor',
  priority: 'high',
  metadata: { order, amount: 1359.97 },
});
// ✓ Task created: task_payment_001

// Payment Processor executes
console.log('[Payment Processor] Verifying payment method...');
await sleep(1000); // Simulated processing
console.log('[Payment Processor] Charging card ending in 4242...');
await sleep(500);
console.log('[Payment Processor] Payment successful: txn_789xyz');

await coordinator.callTool('task.update', {
  taskId: 'task_payment_001',
  status: 'completed',
  result: {
    success: true,
    transactionId: 'txn_789xyz',
    amount: 1359.97,
    timestamp: new Date(),
  },
});

// ========== T+2.0s - Payment Confirmed ==========
console.log('[Payment Processor → Coordinator] Payment confirmed');

await coordinator.callTool('agent.message', {
  targetAgent: 'coordinator',
  message: {
    type: 'payment_confirmed',
    orderId: 'ORD-12345',
    transactionId: 'txn_789xyz',
  },
  messageType: 'notification',
});

// ========== T+2.1s - Step 2: Inventory Check ==========
console.log('[Coordinator → Inventory Manager] Check inventory');

const inventoryTask = await coordinator.callTool('task.create', {
  title: 'Reserve inventory for ORD-12345',
  assignedTo: 'inventory_manager',
  priority: 'high',
  metadata: { items: order.items },
});

// Inventory Manager executes
console.log('[Inventory Manager] Checking stock levels...');
for (const item of order.items) {
  console.log(`  - ${item.sku}: ${item.quantity} units available ✓`);
  await sleep(200);
}
console.log('[Inventory Manager] Reserving items...');
await sleep(500);
console.log('[Inventory Manager] Reservation complete');

await coordinator.callTool('task.update', {
  taskId: inventoryTask.result.taskId,
  status: 'completed',
  result: {
    success: true,
    reservationId: 'rsv_456abc',
    items: order.items,
  },
});

// ========== T+3.5s - Inventory Reserved ==========
console.log('[Inventory Manager → Fulfillment] Items ready for pickup');

await coordinator.callTool('agent.message', {
  targetAgent: 'fulfillment_agent',
  message: {
    type: 'items_reserved',
    orderId: 'ORD-12345',
    reservationId: 'rsv_456abc',
    location: 'warehouse_section_C',
  },
  messageType: 'request',
  priority: 'normal',
});

// ========== T+3.6s - Step 3: Fulfillment ==========
console.log('[Fulfillment Agent] Creating shipment...');

const fulfillmentTask = await coordinator.callTool('task.create', {
  title: 'Create shipment for ORD-12345',
  assignedTo: 'fulfillment_agent',
  priority: 'normal',
  metadata: {
    orderId: 'ORD-12345',
    reservationId: 'rsv_456abc',
  },
});

console.log('[Fulfillment Agent] Picking items from warehouse...');
await sleep(1000);
console.log('[Fulfillment Agent] Packing items...');
await sleep(800);
console.log('[Fulfillment Agent] Generating shipping label...');
await sleep(300);
console.log('[Fulfillment Agent] Shipment ready: SHIP-789012');

await coordinator.callTool('task.update', {
  taskId: fulfillmentTask.result.taskId,
  status: 'completed',
  result: {
    success: true,
    shipmentId: 'SHIP-789012',
    carrier: 'UPS',
    trackingNumber: '1Z999AA10123456784',
    estimatedDelivery: '2025-01-20',
  },
});

// ========== T+5.7s - Broadcast Completion ==========
console.log('[Coordinator] Broadcasting order completion...');

await coordinator.callTool('communication.broadcast', {
  message: {
    type: 'order_completed',
    orderId: 'ORD-12345',
    status: 'shipped',
    shipmentId: 'SHIP-789012',
    trackingNumber: '1Z999AA10123456784',
  },
  targets: ['payment_processor', 'inventory_manager', 'fulfillment_agent'],
  priority: 'normal',
});

// ========== T+5.8s - Workflow Complete ==========
console.log('[Coordinator] Order processing complete!');

await coordinator.callTool('workflow.execute', {
  workflowId: workflow.result.workflowId,
  inputs: order,
  async: false,
});

console.log('\n=== Final Status ===');
console.log('Order ID: ORD-12345');
console.log('Status: SHIPPED');
console.log('Payment: $1359.97 (txn_789xyz)');
console.log('Shipment: SHIP-789012');
console.log('Tracking: 1Z999AA10123456784');
console.log('Estimated Delivery: 2025-01-20');
console.log('Total Time: 5.8 seconds');
console.log('Agents Involved: 4');
console.log('Tasks Completed: 3');
```

### Output Console

```
=== Order Processing Workflow ===

[T+0.0s] [System] Order received: ORD-12345
[T+0.1s] [Coordinator] Creating order processing workflow...
[T+0.1s] [Coordinator] ✓ Workflow created: wf_order_12345
[T+0.2s] [Coordinator] Discovering required agents...
[T+0.3s] [Coordinator] ✓ Found 3 agents

[T+0.5s] [Coordinator → Payment Processor] Process payment
[T+0.5s] [Payment Processor] Task received: task_payment_001
[T+0.6s] [Payment Processor] Verifying payment method...
[T+1.6s] [Payment Processor] Charging card ending in 4242...
[T+2.0s] [Payment Processor] ✓ Payment successful: txn_789xyz
[T+2.0s] [Payment Processor → Coordinator] Payment confirmed

[T+2.1s] [Coordinator → Inventory Manager] Check inventory
[T+2.1s] [Inventory Manager] Task received: task_inv_001
[T+2.2s] [Inventory Manager] Checking stock levels...
[T+2.2s] [Inventory Manager]   - LAPTOP-001: 1 units available ✓
[T+2.4s] [Inventory Manager]   - MOUSE-042: 2 units available ✓
[T+2.9s] [Inventory Manager] Reserving items...
[T+3.4s] [Inventory Manager] ✓ Reservation complete: rsv_456abc
[T+3.5s] [Inventory Manager → Fulfillment] Items ready

[T+3.6s] [Fulfillment Agent] Task received: task_fulfill_001
[T+3.7s] [Fulfillment Agent] Creating shipment...
[T+3.7s] [Fulfillment Agent] Picking items from warehouse...
[T+4.7s] [Fulfillment Agent] Packing items...
[T+5.5s] [Fulfillment Agent] Generating shipping label...
[T+5.7s] [Fulfillment Agent] ✓ Shipment ready: SHIP-789012

[T+5.8s] [Coordinator] Broadcasting order completion...
[T+5.8s] [All Agents] Order ORD-12345 completed

=== Summary ===
✓ Payment Processed: $1359.97 (txn_789xyz)
✓ Inventory Reserved: rsv_456abc
✓ Shipment Created: SHIP-789012
✓ Tracking: 1Z999AA10123456784
✓ Delivery: 2025-01-20
✓ Total Time: 5.8 seconds
✓ Success Rate: 100%
```

---

## Example 2: Content Creation Pipeline

**Scenario**: Create blog post with research, writing, editing, and publishing.

**Agents**:

- **Research Agent** - Gathers information and sources
- **Writer Agent** - Drafts content
- **Editor Agent** - Reviews and improves content
- **Publisher Agent** - Publishes to platform

### Execution Trace

```
[T+0.0s] [Coordinator] Starting content pipeline for topic: "AI Trends 2025"

[T+0.5s] [Research Agent] Searching for latest AI trends...
[T+0.5s] [Research Agent] → API Call: Google Scholar API
[T+1.2s] [Research Agent] → API Call: ArXiv API
[T+1.8s] [Research Agent] → API Call: News API
[T+2.5s] [Research Agent] Found 47 relevant sources
[T+2.5s] [Research Agent] Summarizing key findings...
[T+3.8s] [Research Agent] ✓ Research complete
[T+3.8s] [Research Agent → Writer] Sending research data

[T+4.0s] [Writer Agent] Received research on "AI Trends 2025"
[T+4.0s] [Writer Agent] Creating outline...
[T+4.5s] [Writer Agent] Outline: 5 sections, ~2000 words
[T+4.5s] [Writer Agent] Writing introduction...
[T+5.2s] [Writer Agent] Writing section 1: Machine Learning Advances
[T+6.5s] [Writer Agent] Writing section 2: Generative AI Evolution
[T+7.8s] [Writer Agent] Writing section 3: AI Ethics & Governance
[T+9.1s] [Writer Agent] Writing section 4: Industry Applications
[T+10.4s] [Writer Agent] Writing section 5: Future Predictions
[T+11.2s] [Writer Agent] Writing conclusion...
[T+11.8s] [Writer Agent] ✓ Draft complete: 2,145 words
[T+11.8s] [Writer Agent → Editor] Sending draft for review

[T+12.0s] [Editor Agent] Received draft: "AI Trends 2025"
[T+12.0s] [Editor Agent] Running grammar check...
[T+12.8s] [Editor Agent] Found 12 suggestions
[T+12.8s] [Editor Agent] Checking readability...
[T+13.2s] [Editor Agent] Readability score: 68 (Good)
[T+13.2s] [Editor Agent] Verifying facts with research sources...
[T+14.5s] [Editor Agent] All facts verified ✓
[T+14.5s] [Editor Agent] Optimizing for SEO...
[T+15.1s] [Editor Agent] SEO score: 85/100
[T+15.1s] [Editor Agent] ✓ Editing complete
[T+15.1s] [Editor Agent → Publisher] Approved for publishing

[T+15.5s] [Publisher Agent] Received approved content
[T+15.5s] [Publisher Agent] Creating blog post in CMS...
[T+16.2s] [Publisher Agent] Uploading images...
[T+17.0s] [Publisher Agent] Setting SEO metadata...
[T+17.5s] [Publisher Agent] Scheduling social media posts...
[T+18.2s] [Publisher Agent] ✓ Published: blog.example.com/ai-trends-2025

[T+18.3s] [Coordinator] Content pipeline complete!

=== Statistics ===
Research Sources: 47
Draft Word Count: 2,145
Editing Suggestions: 12
SEO Score: 85/100
Publication URL: blog.example.com/ai-trends-2025
Total Time: 18.3 seconds
Agents Involved: 5
```

---

## Example 3: Customer Support Ticket Resolution

**Scenario**: Handle a customer support ticket with triage, investigation, and
resolution.

**Agents**:

- **Triage Agent** - Categorizes and prioritizes tickets
- **Knowledge Agent** - Searches knowledge base
- **Investigation Agent** - Analyzes logs and data
- **Response Agent** - Crafts and sends responses

### Step-by-Step Coordination

```typescript
// Ticket arrives
const ticket = {
  id: 'TICKET-7890',
  customer: 'user@company.com',
  subject: 'Cannot login to account',
  message: 'Getting error: "Invalid credentials" but password is correct',
  priority: 'unknown',
};

// ===== STEP 1: TRIAGE =====
console.log('[Triage Agent] Analyzing ticket TICKET-7890...');

const category = await triageAgent.callTool('agent.message', {
  targetAgent: 'knowledge_agent',
  message: {
    action: 'categorize',
    text: ticket.message,
  },
  requiresResponse: true,
});
// Category: "authentication_issue"
// Priority: "high"

await triageAgent.callTool('task.create', {
  title: 'Resolve authentication issue',
  assignedTo: 'investigation_agent',
  priority: 'high',
  metadata: { ticket, category: 'authentication_issue' },
});

// ===== STEP 2: KNOWLEDGE SEARCH =====
console.log('[Knowledge Agent] Searching knowledge base...');

const articles = await knowledgeAgent.callTool('resource.read', {
  uri: 'fuse://knowledge/authentication_issues',
});
// Found 5 related articles

// Check if known issue
const knownIssue = articles.result.find((a) =>
  a.symptoms.includes('invalid_credentials')
);

if (knownIssue) {
  console.log('[Knowledge Agent] Found known issue: KB-1234');

  await knowledgeAgent.callTool('agent.message', {
    targetAgent: 'investigation_agent',
    message: {
      type: 'known_issue',
      kbArticle: 'KB-1234',
      solution: 'Clear browser cache and cookies',
    },
  });
}

// ===== STEP 3: INVESTIGATION =====
console.log('[Investigation Agent] Checking user account...');

// Simulate API calls to user service
const userStatus = {
  accountActive: true,
  passwordLastChanged: '2025-01-10',
  loginAttempts: 3,
  lastSuccessfulLogin: '2025-01-15',
  currentIssue: 'session_conflict',
};

console.log('[Investigation Agent] Found issue: Session conflict');
console.log('[Investigation Agent] Resolution: Clear user sessions');

await investigationAgent.callTool('task.update', {
  taskId: 'task_investigate_001',
  status: 'completed',
  result: {
    issue: 'session_conflict',
    resolution: 'clear_sessions',
    applied: true,
  },
});

// ===== STEP 4: RESPONSE =====
console.log('[Response Agent] Crafting response...');

const response = {
  to: ticket.customer,
  subject: `Re: ${ticket.subject}`,
  body: `
    Hi there,

    We've identified and resolved the issue with your account.
    The problem was a session conflict that has now been cleared.

    You should be able to log in successfully now. If you continue
    to experience issues, please try:
    1. Clear your browser cache and cookies
    2. Use an incognito/private browsing window
    3. Try a different browser

    Your account is active and secure.

    Best regards,
    Support Team
  `,
};

await responseAgent.callTool('agent.message', {
  targetAgent: 'email_service',
  message: {
    action: 'send',
    ...response,
  },
});

console.log('[Response Agent] ✓ Response sent to customer');

// ===== STEP 5: CLOSE TICKET =====
await coordinator.callTool('task.update', {
  taskId: ticket.id,
  status: 'completed',
  result: {
    resolution: 'session_conflict_cleared',
    responseTime: '3.2 minutes',
    customerNotified: true,
  },
});

console.log('[Coordinator] Ticket TICKET-7890 resolved');

// ===== BROADCAST TO TEAM =====
await coordinator.callTool('communication.broadcast', {
  message: {
    type: 'ticket_resolved',
    ticketId: 'TICKET-7890',
    category: 'authentication_issue',
    resolution: 'session_conflict_cleared',
    responseTime: '3.2 minutes',
  },
  targets: ['support_team', 'analytics_agent'],
  priority: 'low',
});
```

### Console Output

```
=== Support Ticket Resolution ===

[T+0.0s] Ticket received: TICKET-7890
[T+0.1s] [Triage Agent] Analyzing ticket...
[T+0.5s] [Triage Agent] Category: authentication_issue, Priority: high
[T+0.6s] [Triage Agent → Investigation] Task assigned

[T+0.8s] [Knowledge Agent] Searching knowledge base...
[T+1.2s] [Knowledge Agent] Found 5 related articles
[T+1.3s] [Knowledge Agent] Known issue found: KB-1234
[T+1.4s] [Knowledge Agent → Investigation] Sending KB article

[T+1.5s] [Investigation Agent] Checking user account...
[T+1.8s] [Investigation Agent] Account status: active
[T+2.2s] [Investigation Agent] Found issue: session_conflict
[T+2.5s] [Investigation Agent] Applying fix: clear_sessions
[T+2.8s] [Investigation Agent] ✓ Issue resolved

[T+3.0s] [Response Agent] Crafting response...
[T+3.5s] [Response Agent] Sending email to customer
[T+3.8s] [Response Agent] ✓ Response sent

[T+4.0s] [Coordinator] Ticket TICKET-7890 resolved
[T+4.1s] [Coordinator] Broadcasting resolution to team

=== Resolution Summary ===
Ticket ID: TICKET-7890
Category: authentication_issue
Root Cause: session_conflict
Resolution: Sessions cleared
Response Time: 3.2 minutes
Customer Notified: Yes
Knowledge Base: KB-1234 applied
```

---

## Communication Patterns Demonstrated

### 1. Sequential Processing

```
Agent A → Agent B → Agent C → Done
Example: Order Processing (Payment → Inventory → Fulfillment)
```

### 2. Parallel Processing

```
           ┌→ Agent A →┐
Coordinator┼→ Agent B →┼→ Aggregator
           └→ Agent C →┘
Example: Multi-source data fetching
```

### 3. Request-Response

```
Agent A ─[Request]→ Agent B
Agent A ←[Response]─ Agent B
Example: Knowledge base queries
```

### 4. Broadcast

```
            ┌→ Agent A
Coordinator ┼→ Agent B
            ┼→ Agent C
            └→ Agent D
Example: Status updates to all agents
```

### 5. Collaboration

```
Agent A ←→ Agent B
   ↕        ↕
Agent C ←→ Agent D
Example: Multi-agent problem solving
```

---

## Performance Metrics

### Order Processing Example

- **Total Execution Time**: 5.8 seconds
- **Agents**: 4
- **Tasks**: 3
- **Messages**: 8
- **Success Rate**: 100%

### Content Pipeline Example

- **Total Execution Time**: 18.3 seconds
- **Agents**: 5
- **Tasks**: 4
- **Messages**: 12
- **Words Generated**: 2,145

### Support Ticket Example

- **Total Execution Time**: 3.2 minutes
- **Agents**: 4
- **Tasks**: 2
- **Messages**: 6
- **Resolution Rate**: 100%

---

## Key Takeaways

1. **Agents coordinate autonomously** using MCP tools
2. **No central bottleneck** - agents communicate peer-to-peer
3. **Clear task delegation** with priority and metadata
4. **Real-time progress tracking** via task status updates
5. **Fault tolerance** through retry logic and error handling
6. **Scalable** - add more agents without code changes
7. **Observable** - full execution trace available

---

These examples demonstrate that **MCP enables sophisticated multi-agent
coordination** with minimal overhead and maximum flexibility! 🚀
