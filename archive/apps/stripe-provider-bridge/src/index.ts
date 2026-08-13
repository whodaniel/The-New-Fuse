import express, { Request, Response } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.STRIPE_PROVIDER_PORT || 19001;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_PROJECT_WEBHOOK_SECRET || 'whsec_test_secret';

app.use(express.json());

// 💳 Stripe Signature Verification Middleware (Simplified for Demo)
const verifyStripeSignature = (req: Request, res: Response, next: Function) => {
  const signature = req.headers['stripe-signature'];
  if (!signature && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Missing Stripe-Signature' });
  }
  // In a real implementation, we'd verify the HMAC here.
  next();
};

// 📂 1. Catalog Endpoint: List TNF capabilities
app.get('/provisioning/catalog', (req, res) => {
  res.json({
    name: "The New Fuse (TNF)",
    service_kinds: [
      {
        id: "tnf-agent-cluster",
        name: "TNF Agent Cluster",
        description: "Provision a new agent swarm with dedicated relay orchestration.",
        icon_url: "https://tnf.ai/icons/agents.png"
      },
      {
        id: "tnf-relay-server",
        name: "TNF Relay Node",
        description: "Stand up a secure WebSocket relay for cross-agent communication.",
        icon_url: "https://tnf.ai/icons/relay.png"
      }
    ],
    plans: [
      { id: "free", name: "Development Scan", cost: 0 },
      { id: "pro", name: "Production Swarm", cost: 1000 }
    ],
    regions: ["us-east-1", "eu-west-1", "global"]
  });
});

// 📝 2. Plan Endpoint: Preview provisioning
app.post('/provisioning/plans', verifyStripeSignature, (req, res) => {
  const { service_kind, config } = req.body;
  res.json({
    id: `plan_${crypto.randomBytes(4).toString('hex')}`,
    service_kind,
    preview: {
      message: `TNF will provision a ${service_kind} node.`,
      config_summary: config || {}
    }
  });
});

// 🚀 3. Provisioning Endpoint: Create resource
app.post('/provisioning/resources', verifyStripeSignature, (req, res) => {
  const { service_kind, name, plan } = req.body;
  const resourceId = `tnf_${service_kind}_${crypto.randomBytes(4).toString('hex')}`;
  
  console.log(`[Stripe APP] Provisioning TNF Resource: ${name} (${service_kind})`);

  res.json({
    id: resourceId,
    status: "active",
    name,
    outputs: {
      TNF_RELAY_URL: process.env.RELAY_URL || "ws://localhost:3000",
      TNF_API_ENDPOINT: process.env.API_BASE_URL || "http://localhost:3001",
      TNF_PROVISIONED_RESOURCE_ID: resourceId
    }
  });
});

// 🔑 4. Outputs Endpoint: Fetch credentials for an existing resource
app.get('/provisioning/resources/:id/outputs', verifyStripeSignature, (req, res) => {
  res.json({
    outputs: {
      TNF_RELAY_URL: process.env.RELAY_URL || "ws://localhost:3000",
      TNF_API_ENDPOINT: process.env.API_BASE_URL || "http://localhost:3001",
      TNF_PROVISIONED_ID: req.params.id
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 TNF Stripe Provider Bridge running on port ${port}`);
  console.log(`📡 Stripe CLI Add: stripe projects add local/tnf --url http://localhost:${port}`);
});
