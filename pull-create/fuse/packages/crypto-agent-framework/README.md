# 4-Layer Decentralized AI Agent Framework 🚀

A comprehensive, modular autonomous AI agent orchestration system for crypto operations, designed for The New Fuse ecosystem.

This framework separates an agent's "brain" from its "actions," "work," and "memory" using a 4-layer architecture with best-in-class decentralized protocols.

## ✨ Integration Status

**✅ Fully Integrated with The New Fuse Pydantic Agent System**

This framework is now **natively integrated** with TNF's existing Pydantic agent infrastructure. All crypto agents follow TNF's established patterns and work seamlessly with the orchestrator.

📘 **See [PYDANTIC_INTEGRATION_GUIDE.md](./PYDANTIC_INTEGRATION_GUIDE.md) for complete integration documentation.**

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Agent Framework (The "Brain")                      │
│  ├─ Decision Engine: Parse & Plan                            │
│  └─ Agent Core: Orchestrate Execution                        │
└───────────────────────────────┬─────────────────────────────┘
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
        ▼                       ▼                        ▼
┌───────────────┐     ┌─────────────────┐      ┌──────────────┐
│ Layer 2:      │     │ Layer 3:        │      │ Layer 4:     │
│ Actions       │     │ Compute         │      │ Memory       │
│ (ENSO)        │     │ (Akash/Render)  │      │ (Arweave/AO) │
│               │     │                 │      │              │
│ • DeFi        │     │ • AI Training   │      │ • Audit Logs │
│ • Swaps       │     │ • 3D Rendering  │      │ • State Mgmt │
│ • Staking     │     │ • Gen AI        │      │ • Permanent  │
│ • Bridging    │     │ • GPU Compute   │      │   Storage    │
│ • NFT Ops     │     │                 │      │              │
└───────────────┘     └─────────────────┘      └──────────────┘
```

## 🎯 Key Features

- **Intent-Based Execution**: Submit natural language prompts, not code
- **Cross-Chain Operations**: Seamless bridging and multi-chain execution
- **Decentralized Compute**: Leverage Akash for AI, Render for 3D/GenAI
- **Permanent Memory**: Immutable audit logs on Arweave, state on AO
- **Gas Optimization**: ENSO finds optimal routes automatically
- **Autonomous**: Runs independently or integrates with existing systems
- **Extensible**: Plugin architecture for new protocols and capabilities

## 📦 Installation

### Quick Setup

For rapid setup with automated configuration:

```bash
cd packages/crypto-agent-framework
./setup.sh
```

### Manual Installation

### Prerequisites

- Python 3.9+
- Node.js 18+ (for TypeScript bridge)
- PostgreSQL (for TNF integration)
- Redis (for TNF integration)

### Step 1: Install Python Dependencies

```bash
cd packages/crypto-agent-framework

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Configuration:**

```bash
# Agent Identity
AGENT_ID=crypto-agent-001
AGENT_PRIVATE_KEY=your_ethereum_private_key

# L2: ENSO API
ENSO_API_KEY=your_enso_api_key

# L3: Compute
AKASH_API_KEY=your_akash_key
RENDER_API_KEY=your_render_key

# L4: Memory
ARWEAVE_KEYFILE_PATH=./arweave-keyfile.json
AGENT_AO_PROCESS_ID=your_ao_process_id

# Blockchain RPC URLs
ETH_RPC_URL=your_ethereum_rpc_url
BASE_RPC_URL=https://mainnet.base.org
```

### Step 3: Generate Arweave Wallet (Optional)

```bash
# Install Arweave tools
npm install -g arweave-deploy

# Generate new wallet
arweave key-create arweave-keyfile.json

# Fund wallet (testnet): https://faucet.arweave.net/
```

## 🚀 Quick Start

### Standalone Mode

```bash
# Interactive mode
python main.py

# Single task execution
python main.py --task "Swap 10 ETH for USDC"

# Loop mode (continuous)
python main.py --loop --interval 30
```

### Fetch.ai Network Mode

```bash
# Start as Fetch.ai uAgent
python agent_host_fetch.py
```

### Integration with The New Fuse Backend (Pydantic Agents)

The crypto agents are integrated with TNF's Pydantic agent system. Here's how to use them:

#### From TypeScript/NestJS

```typescript
import { CryptoAgentExecutorService } from '@tnf/crypto-agent-framework';

@Injectable()
export class YourService {
  constructor(private readonly cryptoAgents: CryptoAgentExecutorService) {}

  async swapTokens() {
    // Execute token swap via ENSO
    const result = await this.cryptoAgents.swapTokens({
      from_token: 'ETH',
      to_token: 'USDC',
      amount: '1.0',
      slippage_tolerance: 0.5,
    });

    if (result.success) {
      console.log('Swap completed:', result.data);
    }
  }

  async createNFT() {
    // Generate 3D model via Render Network
    const model = await this.cryptoAgents.generate3DModel(
      'A futuristic sports car',
      'glb'
    );

    // Store metadata permanently on Arweave
    const storage = await this.cryptoAgents.storeOnArweave({
      data_type: 'nft_metadata',
      content: JSON.stringify({ model_url: model.data.model_url }),
    });

    return storage.data.tx_id;
  }
}
```

#### From Python (Direct Executor)

```python
from executor.crypto_agent_executor import CryptoAgentExecutor

executor = CryptoAgentExecutor()

# Swap tokens
result = await executor.execute_agent("enso-defi-agent", {
    "operation_type": "swap",
    "token_in": "ETH",
    "token_out": "USDC",
    "amount": "1.0"
})

# Generate 3D model
result = await executor.execute_agent("render-network-agent", {
    "job_type": "3d_generation",
    "prompt": "A mystical crystal",
    "output_format": "glb"
})
```

#### From Orchestrator (Multi-Agent Coordination)

```python
from orchestrator_agent import Task, ProjectPlan

# The orchestrator automatically routes to crypto agents
project = ProjectPlan(
    goal="Create NFT with 3D asset",
    tasks=[
        Task(
            agent_name="render-network-agent",
            input_data={"job_type": "3d_generation", "prompt": "..."}
        ),
        Task(
            agent_name="arweave-memory-agent",
            input_data={"data_type": "nft_metadata", "content": "..."},
            dependencies=[...]
        )
    ]
)
```

📘 **For complete integration examples, see [PYDANTIC_INTEGRATION_GUIDE.md](./PYDANTIC_INTEGRATION_GUIDE.md)**

## 📝 Usage Examples

### Example 1: Generate & Mint NFT

```python
# Python
agent.add_task(
    "Generate a 3D model of a red sports car, "
    "mint it as an NFT on Base, and "
    "list it for 100 USDC on OpenSea"
)
```

```typescript
// TypeScript
await cryptoAgent.generateAndMintNFT(
  "red sports car",
  "base",
  "100 USDC"
);
```

### Example 2: DeFi Operations

```python
# Python
agent.add_task("Stake 100 USDC in the highest-yield pool on any chain")
```

```typescript
// TypeScript
await cryptoAgent.stakeForYield(100, 'USDC');
```

### Example 3: Cross-Chain Bridge

```python
# Python
agent.add_task("Bridge 50 USDC from Ethereum to Arbitrum")
```

```typescript
// TypeScript
await cryptoAgent.bridgeTokens(50, 'USDC', 'ethereum', 'arbitrum');
```

### Example 4: Complex Multi-Step Task

```python
# Python
agent.add_task(
    "Train an AI model on Akash using my-training-data.csv, "
    "then use the model to generate 10 images, "
    "mint each as an NFT collection on Base, "
    "and stake all proceeds in the highest USDC yield pool"
)
```

## 🔧 Configuration

### Layer-Specific Configuration

#### L2: ENSO (Actions)
```bash
ENSO_API_KEY=your_key
ENSO_API_URL=https://api.enso.finance/api/v1
```

#### L3: Compute
```bash
# Akash Network
AKASH_API_KEY=your_key
AKASH_API_URL=https://api.akash.network/v1

# Render Network
RENDER_API_KEY=your_key
RENDER_API_URL=https://api.rendernetwork.com/v1
```

#### L4: Memory
```bash
# Arweave
ARWEAVE_KEYFILE_PATH=./arweave-keyfile.json
ARWEAVE_NODE_URL=https://arweave.net

# AO
AGENT_AO_PROCESS_ID=your_process_id
AO_MU_URL=https://mu.ao-testnet.xyz
AO_CU_URL=https://cu.ao-testnet.xyz
```

### Feature Flags

```bash
ENABLE_ARWEAVE_LOGGING=true   # Enable immutable audit logs
ENABLE_AO_STATE=true           # Enable persistent state management
ENABLE_UAGENTS=false          # Enable Fetch.ai network integration
ENABLE_ENSO=true              # Enable ENSO for DeFi operations
```

## 📚 API Documentation

### REST API Endpoints

When integrated with The New Fuse backend:

#### Submit Task
```http
POST /api/crypto-agent/tasks
Content-Type: application/json

{
  "prompt": "Your task description",
  "priority": 1,
  "requester": "optional_user_id"
}
```

#### Get Status
```http
GET /api/crypto-agent/status
```

#### Get Task Result
```http
GET /api/crypto-agent/tasks/{taskId}
```

#### NFT Operations
```http
POST /api/crypto-agent/nft/generate-and-mint
Content-Type: application/json

{
  "description": "red sports car",
  "chain": "base",
  "listingPrice": "100 USDC"
}
```

#### DeFi Operations
```http
POST /api/crypto-agent/defi/swap
POST /api/crypto-agent/defi/stake
POST /api/crypto-agent/bridge
```

## 🔒 Security Considerations

1. **Private Key Management**
   - Never commit private keys to git
   - Use environment variables or secure key management systems
   - Consider using hardware wallets for production

2. **API Key Security**
   - Rotate API keys regularly
   - Use separate keys for development and production
   - Implement rate limiting

3. **Transaction Limits**
   - Set maximum transaction amounts
   - Require approval for large operations
   - Implement multi-sig for high-value wallets

4. **Audit Logging**
   - All operations logged to Arweave
   - Cryptographically signed
   - Permanent and tamper-proof

## 🧪 Testing

```bash
# Activate virtual environment
source venv/bin/activate

# Run all tests
python -m pytest tests/test_crypto_agents.py -v

# Run specific test categories
pytest tests/ -k "TestPydanticModels" -v      # Pydantic validation tests
pytest tests/ -k "TestAgentRegistry" -v       # Registry functionality
pytest tests/ -k "TestCryptoAgentExecutor" -v # Executor tests
pytest tests/ -k "TestIntegration" -v         # Integration tests

# With coverage
pytest --cov=. tests/

# Specific test
pytest tests/test_enso_service.py
```

## 🛠️ Development

### Project Structure

```
crypto-agent-framework/
├── agent/                    # L1: Brain (standalone mode)
│   ├── decision_engine.py   # Intent parsing & planning
│   └── agent_core.py         # Core orchestrator
├── services/                 # L2, L3, L4 implementations
│   ├── enso_service.py      # L2: ENSO (actions)
│   ├── compute_service.py   # L3: Akash + Render (compute)
│   └── memory_service.py    # L4: Arweave + AO (memory)
├── executor/                 # Pydantic → Service bridge
│   └── crypto_agent_executor.py  # Main executor
├── integration/              # TNF integration
│   └── agent_registry.py    # Agent discovery & metadata
├── bridge/                   # TypeScript integration
│   ├── crypto-agent-executor.service.ts
│   └── crypto-agent.service.ts (legacy)
├── tests/                    # Test suite
│   └── test_crypto_agents.py     # Comprehensive tests
├── config.py                 # Configuration management
├── main.py                   # Standalone runner
├── agent_host_fetch.py      # Fetch.ai integration
├── setup.sh                  # Automated setup
├── PYDANTIC_INTEGRATION_GUIDE.md  # Integration docs
└── requirements.txt          # Python dependencies
```

### Pydantic Agent Definitions

The Pydantic agent schemas are located in the extension-system:

```
extension-system/src/agents/pydantic/
└── 7.0_crypto_operations_division/
    ├── enso_defi_agent.py       # DeFi operations schema
    ├── render_network_agent.py  # 3D/render schema
    ├── akash_compute_agent.py   # Compute deployment schema
    └── arweave_memory_agent.py  # Storage & audit schema
```

### Adding New Capabilities

1. **Add new task types** in `decision_engine.py`
2. **Implement execution** in `agent_core.py`
3. **Add tests** in `tests/`
4. **Update documentation**

## 🤝 Integration Examples

### With Existing TNF Blockchain Services

```typescript
// Combine with existing blockchain services
import { CryptoAgentService } from '@the-new-fuse/crypto-agent-framework';
import { ProductionBlockchainService } from '../services/production-blockchain.service';

@Injectable()
export class HybridCryptoService {
  constructor(
    private cryptoAgent: CryptoAgentService,
    private blockchain: ProductionBlockchainService
  ) {}

  async complexOperation() {
    // Use TNF for direct blockchain interactions
    const nft = await this.blockchain.mintNFT(...);

    // Use crypto agent for complex multi-step operations
    await this.cryptoAgent.submitTask({
      prompt: `Take NFT at ${nft.address} and stake proceeds in yield pool`
    });
  }
}
```

## 📊 Monitoring & Observability

- **Structured Logging**: All operations logged with context
- **Arweave Audit Trail**: Immutable operation history
- **Prometheus Metrics**: Built-in metrics export
- **Status API**: Real-time agent status monitoring

## 🐛 Troubleshooting

### Common Issues

**Issue: "Could not connect to Crypto Agent API"**
- Ensure Python service is running
- Check `CRYPTO_AGENT_API_URL` environment variable
- Verify firewall/network settings

**Issue: "Arweave transaction failed"**
- Check wallet balance
- Verify keyfile path
- Ensure network connectivity

**Issue: "ENSO route not found"**
- Verify API key
- Check token liquidity
- Try with different slippage tolerance

## 📄 License

[Your License Here]

## 🙋 Support

- GitHub Issues: [link]
- Documentation: [link]
- Discord: [link]

---

Built with ❤️ for The New Fuse ecosystem
