# Integration Guide: 4-Layer Crypto Agent Framework with The New Fuse

This guide walks you through integrating the Python-based crypto agent framework
with The New Fuse TypeScript/NestJS backend.

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    The New Fuse Backend (TypeScript/NestJS)     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Frontend   │  │   API Layer  │  │  Existing Blockchain│   │
│  │   (React)    │──│   (NestJS)   │──│  Services           │   │
│  └──────────────┘  └──────┬───────┘  └─────────────────────┘   │
│                            │                                     │
│                  ┌─────────▼────────┐                           │
│                  │ CryptoAgentModule│                           │
│                  │  (TS Bridge)     │                           │
│                  └─────────┬────────┘                           │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTP API / Child Process / Socket
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│          Python Crypto Agent Framework (4-Layer)                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ L1: Brain  │  │ L2: ENSO   │  │ L3: Compute│  │ L4: Memory│ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Integration Steps

### Step 1: Install Python Framework

```bash
cd ./packages/crypto-agent-framework

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Add to your `.env` file in the TNF root:

```bash
# ===== Crypto Agent Framework =====
CRYPTO_AGENT_MODE=http_api  # or: child_process, socket
CRYPTO_AGENT_API_URL=http://localhost:8000
CRYPTO_AGENT_API_KEY=your_api_key_here

# Python path (if using child_process mode)
PYTHON_PATH=/usr/bin/python3  # or path to venv python
```

### Step 3: Import Module in TNF Backend

**Option A: Add to main API service (apps/api)**

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { CryptoAgentModule } from '../../packages/crypto-agent-framework/bridge/crypto-agent.module';

@Module({
  imports: [
    // ... existing imports
    CryptoAgentModule,
  ],
  // ... rest of config
})
export class AppModule {}
```

**Option B: Create dedicated crypto service (apps/backend)**

```typescript
// apps/backend/src/modules/crypto-agent/crypto-agent.module.ts
import { Module } from '@nestjs/common';
import { CryptoAgentModule as BaseCryptoAgentModule } from '../../../../packages/crypto-agent-framework/bridge/crypto-agent.module';
import { EnhancedCryptoService } from './enhanced-crypto.service';

@Module({
  imports: [BaseCryptoAgentModule],
  providers: [EnhancedCryptoService],
  exports: [EnhancedCryptoService],
})
export class CryptoAgentModule {}
```

### Step 4: Start Python Service

**HTTP API Mode (Recommended for Production):**

Create a simple FastAPI wrapper:

```python
# packages/crypto-agent-framework/api_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio

from config import config
from agent import AutonomousAgent
from services import EnsoService, ComputeService, ArweaveMemoryService

app = FastAPI(title="Crypto Agent API")

# Initialize services
enso = EnsoService()
compute = ComputeService()
memory = ArweaveMemoryService()

# Initialize agent
agent = AutonomousAgent(
    agent_id=config.AGENT_ID,
    enso=enso,
    compute=compute,
    memory=memory
)

class TaskRequest(BaseModel):
    prompt: str
    priority: int = 1
    requester: str = None

@app.post("/tasks")
async def submit_task(task: TaskRequest):
    agent.add_task(task.prompt)
    return {
        "task_id": f"task_{hash(task.prompt)}",
        "status": "queued"
    }

@app.get("/status")
async def get_status():
    return agent.get_task_status()

@app.get("/health")
async def health():
    return {"status": "healthy", "agent_id": config.AGENT_ID}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Run it:

```bash
pip install fastapi uvicorn
python api_server.py
```

**Child Process Mode (Development):**

The TypeScript bridge will automatically spawn the Python process.

### Step 5: Use in Your TNF Services

```typescript
// Example: Enhanced NFT service
import { Injectable } from '@nestjs/common';
import { CryptoAgentService } from '@the-new-fuse/crypto-agent-framework';
import { ProductionBlockchainService } from './production-blockchain.service';

@Injectable()
export class EnhancedNFTService {
  constructor(
    private readonly cryptoAgent: CryptoAgentService,
    private readonly blockchain: ProductionBlockchainService
  ) {}

  /**
   * Generate AI art, mint as NFT, and list on marketplace
   */
  async createAINFT(description: string, userId: string) {
    // Use crypto agent for complex multi-step operation
    const result = await this.cryptoAgent.submitTask({
      prompt: `Generate image of '${description}', mint as NFT on Base, list for 100 USDC`,
      requester: userId,
    });

    // Store task in your database for tracking
    await this.saveTask(userId, result.task_id);

    return result;
  }

  /**
   * Stake NFT proceeds automatically
   */
  async autoStakeNFTProceeds(nftSaleAmount: number) {
    return await this.cryptoAgent.submitTask({
      prompt: `Stake ${nftSaleAmount} USDC in highest-yield pool`,
    });
  }
}
```

### Step 6: Frontend Integration

```typescript
// apps/frontend/src/services/crypto-agent.service.ts
import axios from 'axios';

export class CryptoAgentFrontendService {
  private api = axios.create({
    baseURL: '/api/crypto-agent',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async submitTask(prompt: string) {
    const response = await this.api.post('/tasks', { prompt });
    return response.data;
  }

  async getStatus() {
    const response = await this.api.get('/status');
    return response.data;
  }

  async getTaskResult(taskId: string) {
    const response = await this.api.get(`/tasks/${taskId}`);
    return response.data;
  }

  // Convenience methods
  async generateAndMintNFT(
    description: string,
    chain = 'base',
    listingPrice = '100 USDC'
  ) {
    return await this.api.post('/nft/generate-and-mint', {
      description,
      chain,
      listingPrice,
    });
  }

  async swapTokens(amount: number, fromToken: string, toToken: string) {
    return await this.api.post('/defi/swap', { amount, fromToken, toToken });
  }

  async stakeTokens(amount: number, token: string) {
    return await this.api.post('/defi/stake', { amount, token });
  }
}
```

React component example:

```typescript
// apps/frontend/src/components/CryptoAgentWidget.tsx
import React, { useState } from 'react';
import { CryptoAgentFrontendService } from '../services/crypto-agent.service';

const agent = new CryptoAgentFrontendService();

export const CryptoAgentWidget: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const taskResult = await agent.submitTask(prompt);
      setResult(taskResult);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crypto-agent-widget">
      <h3>AI Crypto Agent</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your crypto task (e.g., 'Swap 10 ETH for USDC')..."
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Execute'}
      </button>
      {result && (
        <div className="result">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

## Deployment

### Development

```bash
# Terminal 1: Start TNF backend
cd The-New-Fuse
pnpm run dev:backend

# Terminal 2: Start Python crypto agent (HTTP mode)
cd packages/crypto-agent-framework
source venv/bin/activate
python api_server.py

# Terminal 3: Start frontend
cd The-New-Fuse
pnpm run dev:frontend
```

### Production

#### Docker Compose Setup

```yaml
# docker-compose.crypto-agent.yml
version: '3.8'

services:
  crypto-agent:
    build:
      context: ./packages/crypto-agent-framework
      dockerfile: Dockerfile
    ports:
      - '8000:8000'
    environment:
      - AGENT_ID=${AGENT_ID}
      - AGENT_PRIVATE_KEY=${AGENT_PRIVATE_KEY}
      - ENSO_API_KEY=${ENSO_API_KEY}
      - ARWEAVE_KEYFILE_PATH=/app/arweave-keyfile.json
    volumes:
      - ./arweave-keyfile.json:/app/arweave-keyfile.json:ro
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  tnf-backend:
    depends_on:
      - crypto-agent
    environment:
      - CRYPTO_AGENT_API_URL=http://crypto-agent:8000
```

## Security Best Practices

1. **API Key Management**
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly
   - Never commit keys to git

2. **Network Security**
   - Run crypto agent on internal network only
   - Use VPN or private networking in production
   - Implement rate limiting

3. **Transaction Security**
   - Set transaction limits
   - Require approval for high-value operations
   - Use multi-sig for production wallets

4. **Monitoring**
   - Monitor all Arweave logs
   - Set up alerts for failed transactions
   - Track gas usage

## Troubleshooting

### Issue: TypeScript can't find module

```bash
# Make sure bridge is properly exported
cd packages/crypto-agent-framework/bridge
ls -la  # Should see .ts files

# Update tsconfig.json paths if needed
```

### Issue: Python process crashes

Check logs:

```bash
tail -f packages/crypto-agent-framework/logs/agent.log
```

Enable debug mode:

```bash
export LOG_LEVEL=DEBUG
python main.py
```

### Issue: CORS errors from frontend

Add to NestJS CORS config:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

## Next Steps

1. ✅ Framework implementation complete
2. ⏳ Add comprehensive tests
3. ⏳ Set up CI/CD pipeline
4. ⏳ Deploy to staging environment
5. ⏳ Security audit
6. ⏳ Production deployment

## Support

- Internal Documentation: `/docs/crypto-agent/`
- Team Chat: #crypto-agent-dev
- Issues: Create ticket in project board
