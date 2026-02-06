import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import puppeteer from '@cloudflare/puppeteer';
import { AgentObject } from './objects/AgentObject';
import { EdgeMCPHandler } from './mcp-handler';

export { AgentObject }; // Export for Cloudflare to register

type Bindings = {
  AGENT_STATE: KVNamespace;
  AI: Ai;
  MY_BROWSER?: Fetcher;
  ARTIFACTS?: R2Bucket;
  VECTOR_INDEX?: VectorizeIndex;
  AGENT_OBJECT: DurableObjectNamespace;
  DB: D1Database; // Relational DB
  JOBS_QUEUE: Queue; // Background Jobs
};

const app = new Hono<{ Bindings: Bindings }>();

// 1. Root Health Check
app.get('/', (c) => c.text('Fuse Edge Worker is Active ⚡ (v4: Relay + MCP)'));

// 2. MCP Endpoint
app.post('/mcp', async (c) => {
  return EdgeMCPHandler.handleRequest(c.req.raw, c.env);
});

// 3. Durable Object Route (Stateful Agent)
app.all('/agent/:name/*', async (c) => {
  const name = c.req.param('name');
  const id = c.env.AGENT_OBJECT.idFromName(name);
  const obj = c.env.AGENT_OBJECT.get(id);
  
  // Forward the request to the Durable Object
  return obj.fetch(c.req.raw);
});
app.get('/history/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const limit = c.req.query('limit') || '50';
  
  const results = await c.env.DB.prepare(
    'SELECT * FROM agent_logs WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?'
  )
    .bind(agentId, parseInt(limit))
    .all();
    
  return c.json(results.results);
});

// 9. Job Queue (Async Processing)
app.post('/jobs/enqueue', async (c) => {
  const body = await c.req.json();
  const jobId = crypto.randomUUID();
  
  // 1. Record job in DB
  await c.env.DB.prepare(
    'INSERT INTO jobs (id, type, status) VALUES (?, ?, ?)'
  ).bind(jobId, body.type, 'pending').run();
  
  // 2. Send to Queue
  await c.env.JOBS_QUEUE.send({
    jobId,
    ...body
  });
  
  return c.json({ success: true, jobId });
});

// Worker Main Export
export default {
  fetch: app.fetch,
  
  // Scheduled Handler (Cron)
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log(`Cron triggered at ${event.scheduledTime}`);
    // Example: Wake up a specific maintenance agent
    const id = env.AGENT_OBJECT.idFromName('system-maintenance');
    const obj = env.AGENT_OBJECT.get(id);
    await obj.fetch('http://internal/broadcast', {
      method: 'POST',
      body: JSON.stringify({ type: 'system_tick', time: event.scheduledTime })
    });
  },

  // Queue Consumer Handler
  async queue(batch: MessageBatch<any>, env: Bindings) {
    for (const msg of batch.messages) {
      const { jobId, type, payload } = msg.body;
      console.log(`Processing Job ${jobId}: ${type}`);
      
      try {
        let result = '';
        
        // Example Job Types
        if (type === 'summarize_logs') {
           // Simulate heavy AI work
           const logs = await env.DB.prepare('SELECT * FROM agent_logs LIMIT 10').all();
           const summary = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
             prompt: `Summarize these logs: ${JSON.stringify(logs.results)}`
           });
           result = JSON.stringify(summary);
        }

        // Update Job Status
        await env.DB.prepare(
          'UPDATE jobs SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind('completed', result, jobId).run();
        
        msg.ack(); // Confirm success
      } catch (e: any) {
        console.error(`Job ${jobId} Failed`, e);
        msg.retry(); // Retry later
      }
    }
  }
};

