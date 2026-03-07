# MasterAgentRegistry Service

## Overview
The MasterAgentRegistry serves as the **single source of truth** for all agents in The New Fuse framework. It has been upgraded to bridge off-chain agent registration with immutable on-chain identity using blockchain technology.

## Key Features

### 🔗 **Hybrid On-Chain/Off-Chain Architecture**
- **Off-chain**: Fast registration, metadata, and operational state in Drizzle database
- **On-chain**: Immutable identity, ownership, and economic primitives via AgentNFTFactory
- **Seamless Integration**: Automatic NFT minting during agent registration

### 🎯 **Universal Onboarding Protocol**
- Standardized 8-step onboarding checklist for all agents
- Workspace verification, relay connection, heartbeat setup
- Automated todo list generation like Claude CLI
- Protocol compliance tracking

### 🌳 **Merkle Tree Verification**
- SHA-256 hashing of agent core profiles
- System-wide Merkle root for state integrity
- Cryptographic verification of agent authenticity
- Periodic verification cycles (every 30 minutes)

### 📊 **Fairtable Integration**
- Automatic syncing to spreadsheet views
- Real-time agent status and metrics display
- Front-facing dashboard for stakeholders
- Error handling and sync status tracking

### 🔄 **Agent Todo System**
- Individual rolling todo lists per agent
- Integration with Drizzle Task system
- Category-based organization (onboarding, maintenance, coordination)
- Status tracking and completion metrics

## Blockchain Integration

### Configuration
```typescript
const blockchainConfig: BlockchainConfig = {
  enabled: true,
  providerUrl: 'https://rpc.ankr.com/arbitrum',
  contractAddress: '0x...', // AgentNFTFactory address
  privateKey: 'PRIVATE_KEY',
  chainId: 42161, // Arbitrum One
  gasLimit: 2000000,
  maxGasPrice: '50' // gwei
};

const registry = new MasterAgentRegistry(drizzle, logger, blockchainConfig);
```

### On-Chain Agent Data
```typescript
interface OnChainAgentData {
  tokenId?: number;           // NFT token ID
  contractAddress?: string;   // Contract address
  tbaAddress?: string;        // Token Bound Account
  isOnChain: boolean;         // On-chain status
  mintTransactionHash?: string;
  mintBlockNumber?: number;
  lastOnChainUpdate?: Date;
}
```

### Agent Registration Flow

1. **Off-Chain Registration**: Store in Drizzle database
2. **Legacy Integration**: Register with backward-compatible systems  
3. **Verification Hash**: Generate cryptographic verification
4. **Todo Initialization**: Create standardized task list
5. **Cache Storage**: Store in high-performance memory cache
6. **System Metrics**: Update global statistics and Merkle tree
7. **Spreadsheet Sync**: Update external dashboard views
8. **🆕 Blockchain Minting**: Mint Agent NFT with metadata and TBA

### Key Methods

#### Core Registration
```typescript
async registerAgent(profile: Partial<MasterAgentProfile>): Promise<{
  success: boolean;
  agentId: string;
  onboardingRequired: boolean;
  protocolChecklistId: string;
  todoListInitialized: boolean;
  verificationHash: string;
  spreadsheetRowId?: string;
}>
```

#### Blockchain Operations
```typescript
// Get on-chain data for an agent
async getOnChainAgentData(agentId: string): Promise<OnChainAgentData | null>

// Update on-chain metadata
async updateAgentOnChainMetadata(agentId: string, newMetadataURI: string): Promise<boolean>

// Get blockchain configuration
getBlockchainConfig(): BlockchainConfig
```

#### Universal Onboarding
```typescript
async startUniversalOnboarding(agentId: string): Promise<{
  success: boolean;
  onboardingSteps: OnboardingChecklistItem[];
  estimatedDuration: number;
  orientationMaterials: string[];
  workspaceAccess: string;
}>
```

## Agent Profile Structure

### Enhanced Capabilities Matrix
```typescript
capabilities: {
  // Core AI capabilities
  codeGeneration: boolean;
  fileOperations: boolean;
  webBrowsing: boolean;
  apiAccess: boolean;
  terminalAccess: boolean;
  gitOperations: boolean;
  databaseAccess: boolean;
  realTimeChat: boolean;
  imageProcessing: boolean;
  documentAnalysis: boolean;
  workflowExecution: boolean;
  agentCoordination: boolean;
  
  // The New Fuse specific capabilities
  relayIntegration: boolean;
  protocolTranslation: boolean;
  heartbeatCompliance: boolean;
  handoffTemplating: boolean;
  stagnationRecovery: boolean;
}
```

### Performance Metrics
```typescript
metrics: {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number; // minutes
  successRate: number; // percentage
  responsiveness: number; // response time in ms
  reliability: number; // uptime percentage
  collaboration: number; // successful handoffs
  stagnationCount: number;
  escalationCount: number;
}
```

## System Health Monitoring

### Real-Time Health Checks (every 2 minutes)
- Agent online/offline status
- Stagnation detection
- Performance degradation alerts
- Protocol compliance monitoring

### Full System Verification (every 30 minutes)
- Complete agent compliance verification
- Merkle tree reconstruction
- Onboarding completion rate calculation
- Protocol compliance rate assessment

### System Status Report
```typescript
const report = registry.generateSystemStatusReport();
// Returns comprehensive system health, agent summaries, 
// todo statistics, compliance metrics, and integration status
```

## Integration Points

### Database Integration
- **Drizzle Client**: Primary data persistence
- **Agent Model**: Core agent information
- **AgentMetadata Model**: Extended metadata and capabilities  
- **Task Model**: Todo list integration

### Legacy System Compatibility
- **AgentRegistry**: Backward compatibility layer
- **AgentMetadataManager**: Legacy metadata handling
- **Type Conversion**: Automatic mapping between old and new formats

### External Integrations
- **Fairtable Adapters**: Spreadsheet synchronization
- **AgentNFTFactory Contract**: Blockchain minting
- **IPFS**: Metadata and legal contract storage
- **Token Bound Accounts**: Agent asset ownership

## Security & Reliability

### Access Control
- Role-based permissions for blockchain operations
- Secure private key management
- Gas limit and price controls
- Transaction failure handling

### Error Handling
- Graceful degradation when blockchain is unavailable
- Comprehensive error logging and recovery
- Retry mechanisms for failed operations
- Rollback capabilities for partial failures

### Data Integrity
- Cryptographic verification hashes
- Merkle tree state validation
- Cross-system consistency checks
- Audit trail for all operations

## Usage Example

```typescript
import { MasterAgentRegistry } from './MasterAgentRegistry';
import { DrizzleClient } from '@drizzle/client';
import { Logger } from '../utils/Logger';

// Initialize with blockchain integration
const drizzle = new DrizzleClient();
const logger = new Logger();
const blockchainConfig = {
  enabled: true,
  providerUrl: 'https://rpc.ankr.com/arbitrum',
  contractAddress: '0x...', 
  privateKey: process.env.AGENT_MINTER_PRIVATE_KEY,
  chainId: 42161,
  gasLimit: 2000000,
  maxGasPrice: '50'
};

const registry = new MasterAgentRegistry(drizzle, logger, blockchainConfig);

// Register a new agent with automatic blockchain minting
const result = await registry.registerAgent({
  name: 'CodeGen Assistant',
  type: 'ASSISTANT',
  platform: 'vscode',
  capabilities: {
    codeGeneration: true,
    fileOperations: true,
    gitOperations: true,
    relayIntegration: true,
    heartbeatCompliance: true
  },
  description: 'Advanced code generation assistant with Git integration'
});

console.log(`Agent registered: ${result.agentId}`);
console.log(`On-chain: ${result.success}`);
console.log(`Verification hash: ${result.verificationHash}`);

// Start universal onboarding
const onboarding = await registry.startUniversalOnboarding(result.agentId);
console.log(`Onboarding steps: ${onboarding.onboardingSteps.length}`);
```

This upgraded MasterAgentRegistry now serves as the foundation for a truly decentralized, economically sustainable AI agent ecosystem while maintaining backward compatibility and operational excellence.