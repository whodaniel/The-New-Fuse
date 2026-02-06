# Pydantic Crypto Agents - Integration Guide

## Overview

This guide explains how the crypto agents integrate with The New Fuse's existing
Pydantic agent infrastructure. The implementation follows TNF's established
patterns while adding decentralized crypto capabilities.

## Architecture

### 4-Layer Structure

The crypto agents are organized into 4 architectural layers:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Agent Brain (orchestrator_agent.py)          │
│  Coordinates tasks across all layers                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Actions & Interoperability (ENSO)            │
│  enso-defi-agent: Swaps, staking, bridging             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Compute (Render Network, Akash Network)      │
│  render-network-agent: 3D/VFX GPU compute              │
│  akash-compute-agent: AI training & inference          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Memory (Arweave & AO)                        │
│  arweave-memory-agent: Permanent storage & audit logs  │
└─────────────────────────────────────────────────────────┘
```

### Component Structure

```
The-New-Fuse/
├── packages/extension-system/src/agents/pydantic/
│   ├── 7.0_crypto_operations_division/
│   │   ├── enso_defi_agent.py           # Pydantic schemas
│   │   ├── render_network_agent.py      # Pydantic schemas
│   │   ├── akash_compute_agent.py       # Pydantic schemas
│   │   └── arweave_memory_agent.py      # Pydantic schemas
│   └── orchestrator_agent.py            # Task orchestration
│
└── packages/crypto-agent-framework/
    ├── services/                         # Service implementations
    │   ├── enso_service.py
    │   ├── compute_service.py
    │   └── memory_service.py
    ├── executor/
    │   └── crypto_agent_executor.py      # Bridges Pydantic → Services
    ├── bridge/
    │   └── crypto-agent-executor.service.ts  # TypeScript integration
    ├── integration/
    │   └── agent_registry.py             # Agent discovery
    └── tests/
        └── test_crypto_agents.py         # Comprehensive tests
```

## Integration Patterns

### 1. Pydantic Schema Layer

Each agent has Pydantic models defining inputs, outputs, and metadata.

**Example: ENSO DeFi Agent**

```python
# /packages/extension-system/src/agents/pydantic/7.0_crypto_operations_division/enso_defi_agent.py

class EnsoDeFiInput(BaseModel):
    """Input for ENSO DeFi operations."""
    operation_type: Literal["swap", "stake", "bridge", "withdraw", "compound"]
    token_in: str = Field(..., description="Input token")
    amount: str = Field(..., description="Amount to operate on")
    token_out: Optional[str] = None
    # ... additional fields

class EnsoExecutionResult(BaseModel):
    """Result of ENSO operation."""
    operation_type: str
    status: Literal["success", "failed", "pending"]
    input_amount: TokenAmount
    output_amount: Optional[TokenAmount]
    route_taken: List[RouteStep]
    transaction: TransactionResult
    # ... additional fields

class EnsoDeFiAgentMetadata(BaseModel):
    """Agent metadata and capabilities."""
    agent_name: str = "enso-defi-agent"
    version: str = "1.0.0"
    description: str = "..."
    capabilities: List[str] = [...]
    llm_consumable_description: str = "..."
```

### 2. Executor Layer

The executor bridges Pydantic schemas to actual service implementations.

**Example: Executing a Token Swap**

```python
# /packages/crypto-agent-framework/executor/crypto_agent_executor.py

class CryptoAgentExecutor:
    async def execute_agent(self, agent_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for executing agents.

        Args:
            agent_name: e.g., "enso-defi-agent"
            input_data: Dictionary conforming to agent's input Pydantic model

        Returns:
            Dictionary conforming to agent's output Pydantic model
        """
        if agent_name not in self.agent_registry:
            raise ValueError(f"Unknown agent: {agent_name}")

        execution_method = self.agent_registry[agent_name]
        result = await execution_method(input_data)
        return result

    async def _execute_token_swap(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute token swap via ENSO service."""
        result = await self.enso_service.swap_tokens(
            from_token=input_data["token_in"],
            to_token=input_data["token_out"],
            amount=input_data["amount"],
            slippage_tolerance=input_data.get("slippage_tolerance", 0.5)
        )

        # Log to Arweave for audit trail
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={"operation": "swap", "result": result}
        )

        return result
```

### 3. Agent Registry

The registry makes agents discoverable within TNF.

```python
# /packages/crypto-agent-framework/integration/agent_registry.py

class CryptoAgentRegistry:
    def __init__(self):
        self.agents = self._build_agent_registry()

    def _build_agent_registry(self) -> Dict[str, Dict[str, Any]]:
        """Build registry from Pydantic metadata."""
        registry = {}

        # Register each agent
        enso_meta = EnsoDeFiAgentMetadata()
        registry["enso-defi-agent"] = {
            "name": enso_meta.agent_name,
            "capabilities": enso_meta.capabilities,
            "llm_description": enso_meta.llm_consumable_description,
            "layer": "Layer 2 - Interoperability",
            # ...
        }

        return registry
```

### 4. TypeScript Bridge

The TypeScript service allows NestJS to invoke crypto agents.

```typescript
// /packages/crypto-agent-framework/bridge/crypto-agent-executor.service.ts

@Injectable()
export class CryptoAgentExecutorService {
  async executeAgent(
    agentName: string,
    inputData: Record<string, any>
  ): Promise<CryptoAgentResult> {
    // Routes to Python executor
    const result = await this.executeViaSocket({
      agent_name: agentName,
      input_data: inputData,
    });
    return { success: true, data: result };
  }

  // Convenience methods
  async swapTokens(input: TokenSwapInput): Promise<CryptoAgentResult> {
    return this.executeAgent('enso-defi-agent', {
      operation_type: 'swap',
      token_in: input.from_token,
      token_out: input.to_token,
      amount: input.amount,
    });
  }

  async generate3DModel(description: string): Promise<CryptoAgentResult> {
    return this.executeAgent('render-network-agent', {
      job_type: '3d_generation',
      prompt: description,
      output_format: 'glb',
    });
  }
}
```

## Usage Examples

### From Python (Direct Executor Usage)

```python
from executor.crypto_agent_executor import CryptoAgentExecutor

executor = CryptoAgentExecutor()

# Swap tokens
result = await executor.execute_agent("enso-defi-agent", {
    "operation_type": "swap",
    "token_in": "ETH",
    "token_out": "USDC",
    "amount": "1.0",
    "slippage_tolerance": 0.5
})

# Generate 3D model
result = await executor.execute_agent("render-network-agent", {
    "job_type": "3d_generation",
    "prompt": "A futuristic sports car",
    "output_format": "glb",
    "quality": "high"
})

# Deploy on Akash
result = await executor.execute_agent("akash-compute-agent", {
    "deployment_type": "ai_training",
    "docker_image": "pytorch/pytorch:latest",
    "cpu_cores": 8,
    "memory_gb": 32,
    "gpu_model": "NVIDIA_A100",
    "gpu_count": 2
})

# Store on Arweave
result = await executor.execute_agent("arweave-memory-agent", {
    "data_type": "audit_log",
    "content": json.dumps({"event": "swap", "amount": "1.0"}),
    "tags": {"app": "tnf", "operation": "swap"}
})
```

### From TypeScript/NestJS

```typescript
import { CryptoAgentExecutorService } from '@tnf/crypto-agent-framework';

@Injectable()
export class MyService {
  constructor(private readonly cryptoAgents: CryptoAgentExecutorService) {}

  async performSwap() {
    const result = await this.cryptoAgents.swapTokens({
      from_token: 'ETH',
      to_token: 'USDC',
      amount: '1.0',
      slippage_tolerance: 0.5,
    });

    if (result.success) {
      console.log('Swap executed:', result.data);
    }
  }

  async createNFTAsset() {
    // Generate 3D model
    const modelResult = await this.cryptoAgents.generate3DModel(
      'A rare collectible sword'
    );

    // Store metadata on Arweave
    const storageResult = await this.cryptoAgents.storeOnArweave({
      data_type: 'nft_metadata',
      content: JSON.stringify({
        name: 'Legendary Sword',
        model_url: modelResult.data.model_url,
      }),
    });

    return storageResult.data.tx_id; // Arweave transaction ID
  }
}
```

### From Orchestrator (Task-Based)

```python
# The orchestrator can coordinate multi-step crypto operations

from pydantic import BaseModel
from orchestrator_agent import Task, ProjectPlan

# Define a project: Create an NFT with 3D model
project = ProjectPlan(
    goal="Create NFT with 3D model and permanent metadata",
    tasks=[
        Task(
            agent_name="render-network-agent",
            input_data={
                "job_type": "3d_generation",
                "prompt": "A mystical crystal",
                "output_format": "glb"
            },
            status="pending"
        ),
        Task(
            agent_name="arweave-memory-agent",
            input_data={
                "data_type": "nft_metadata",
                "content": "...",  # Will use output from render task
                "tags": {"type": "nft", "collection": "crystals"}
            },
            status="pending",
            dependencies=[...]  # Depends on render task
        )
    ]
)

# Orchestrator executes tasks in order, passing outputs between them
```

## Agent Capabilities

### ENSO DeFi Agent (Layer 2)

- **Protocol**: ENSO
- **Capabilities**:
  - Token swaps with optimal routing
  - Yield farming and staking
  - Cross-chain token bridging
  - DeFi position management
  - Gas optimization
- **Supported Chains**: Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche

### Render Network Agent (Layer 3)

- **Protocol**: Render Network
- **Capabilities**:
  - AI-powered 3D model generation
  - Text-to-image generation
  - 3D scene rendering (Blender, Houdini, Unreal)
  - VFX compositing
  - Video rendering
- **Use Cases**: NFT creation, game assets, product visualization

### Akash Compute Agent (Layer 3)

- **Protocol**: Akash Network
- **Capabilities**:
  - AI model training (LLMs, vision models)
  - Model inference API deployment
  - Containerized application hosting
  - Sovereign AI agent runtime
  - GPU compute (H100, A100, V100)
- **Cost Advantage**: 60-80% cheaper than AWS/GCP/Azure

### Arweave Memory Agent (Layer 4)

- **Protocol**: Arweave + AO
- **Capabilities**:
  - Permanent data storage (200+ year guarantee)
  - Immutable audit logging
  - State management via AO
  - Cryptographic verification
  - Query and search
- **Guarantees**: Immutable, decentralized, censorship-resistant

## Configuration

### Environment Variables

Create a `.env` file in `/packages/crypto-agent-framework/`:

```bash
# Agent Identity
AGENT_ID=crypto-agent-001
AGENT_PRIVATE_KEY=0x...

# Layer 2: ENSO
ENSO_API_KEY=your_enso_api_key
ENSO_API_URL=https://api.enso.finance

# Layer 3: Akash Network
AKASH_WALLET_ADDRESS=akash1...
AKASH_MNEMONIC=word1 word2 ...

# Layer 3: Render Network
RENDER_API_KEY=your_render_api_key

# Layer 4: Arweave
ARWEAVE_KEYFILE_PATH=./arweave-keyfile.json
ARWEAVE_GATEWAY=https://arweave.net

# Layer 4: AO
AO_PROCESS_ID=your_ao_process_id

# Network Configuration
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
BASE_RPC_URL=https://mainnet.base.org
```

### Setup Script

```bash
cd ./packages/crypto-agent-framework
./setup.sh
```

This will:

1. Create Python virtual environment
2. Install dependencies
3. Generate agent ID
4. Create necessary directories

## Testing

Run the comprehensive test suite:

```bash
# Activate virtual environment
cd packages/crypto-agent-framework
source venv/bin/activate

# Run all tests
python -m pytest tests/test_crypto_agents.py -v

# Run specific test categories
pytest tests/ -k "TestPydanticModels" -v      # Pydantic validation
pytest tests/ -k "TestAgentRegistry" -v       # Registry functionality
pytest tests/ -k "TestCryptoAgentExecutor" -v # Executor tests
```

## Registering with Orchestrator

To make crypto agents available to the orchestrator:

```python
from integration.agent_registry import register_crypto_agents_with_orchestrator

# During TNF initialization
crypto_agents = register_crypto_agents_with_orchestrator()

# Update orchestrator state
orchestrator_state.agent_registry.update(crypto_agents)
```

## Querying Available Agents

```python
from integration.agent_registry import CryptoAgentRegistry

registry = CryptoAgentRegistry()

# List all agents
print(registry.list_agents())
# ['enso-defi-agent', 'render-network-agent', 'akash-compute-agent', 'arweave-memory-agent']

# Search by capability
swap_agents = registry.search_by_capability("swap")
print(swap_agents)  # ['enso-defi-agent']

# Search by tag
gpu_agents = registry.search_by_tag("gpu")
print(gpu_agents)  # ['render-network-agent', 'akash-compute-agent']

# Get LLM-consumable description
llm_context = registry.get_llm_consumable_registry()
# Includes descriptions of all agents for AI orchestrators
```

## Error Handling

All agent operations are automatically logged to Arweave for audit trails:

```python
class CryptoAgentExecutor:
    async def execute_agent(self, agent_name: str, input_data: Dict[str, Any]):
        try:
            result = await execution_method(input_data)
            return result
        except Exception as e:
            # Automatically log errors to Arweave
            await self._log_error(agent_name, input_data, str(e))
            raise
```

## Best Practices

### 1. Always Log Critical Operations

```python
# ENSO swap - automatically logged
result = await executor.execute_agent("enso-defi-agent", {...})

# Custom operations - log manually
await executor.execute_agent("arweave-memory-agent", {
    "data_type": "audit_log",
    "content": json.dumps({"operation": "custom", "data": ...}),
    "tags": {"app": "tnf", "type": "custom"}
})
```

### 2. Use Typed Inputs

```python
# Good: Use Pydantic model for validation
from enso_defi_agent import EnsoDeFiInput

input_model = EnsoDeFiInput(
    operation_type="swap",
    token_in="ETH",
    token_out="USDC",
    amount="1.0"
)
result = await executor.execute_agent("enso-defi-agent", input_model.dict())

# Not recommended: Raw dict without validation
result = await executor.execute_agent("enso-defi-agent", {"operation_type": "swap", ...})
```

### 3. Handle Async Properly

```python
# Good: Proper async/await
async def my_function():
    result = await executor.execute_agent("enso-defi-agent", {...})
    return result

# Not good: Blocking call
result = asyncio.run(executor.execute_agent(...))  # Blocks event loop
```

### 4. Store Important Artifacts

```python
# After generating 3D model, store on Arweave
model_result = await executor.execute_agent("render-network-agent", {...})

storage_result = await executor.execute_agent("arweave-memory-agent", {
    "data_type": "nft_metadata",
    "content": json.dumps({
        "model_url": model_result["model_url"],
        "timestamp": datetime.utcnow().isoformat(),
        "generator": "render-network-agent"
    }),
    "tags": {"type": "3d_model", "permanent": "true"}
})
```

## Monitoring & Observability

### View Agent Logs

All operations are logged to Arweave. Query them:

```python
result = await executor.execute_agent("arweave-memory-agent", {
    "query_type": "by_tag",
    "filters": {"app": "tnf", "agent_id": "crypto-agent-001"},
    "limit": 100
})

for log in result["transactions"]:
    print(f"Event: {log['event_type']}, Time: {log['timestamp']}")
```

### Health Checks

```python
# Python
executor = CryptoAgentExecutor()
# Executor initialization verifies services are accessible

# TypeScript
const isHealthy = await cryptoAgentService.healthCheck();
console.log(`Crypto agents healthy: ${isHealthy}`);
```

## Troubleshooting

### "Unknown agent" Error

- Ensure agent is registered in `CryptoAgentExecutor.agent_registry`
- Check agent name matches exactly (e.g., "enso-defi-agent", not
  "enso_defi_agent")

### "Missing API key" Error

- Verify `.env` file is properly configured
- Check environment variables are loaded: `echo $ENSO_API_KEY`

### Import Errors

- Ensure virtual environment is activated: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

### TypeScript Bridge Issues

- Check Python executor is running: `ps aux | grep crypto_agent_executor`
- Verify socket path is correct: `/tmp/crypto-agent-executor.sock`

## Next Steps

1. **Deploy crypto-agent-framework**: Set up the Python executor as a service
2. **Integrate with NestJS**: Import `CryptoAgentExecutorService` in your
   modules
3. **Configure environment**: Set up all API keys and credentials
4. **Test operations**: Use the test suite to verify functionality
5. **Monitor in production**: Track agent operations via Arweave logs

## Support

For issues or questions:

- Check `/packages/crypto-agent-framework/README.md`
- View test suite for examples: `/packages/crypto-agent-framework/tests/`
- Examine agent definitions:
  `/packages/extension-system/src/agents/pydantic/7.0_crypto_operations_division/`
