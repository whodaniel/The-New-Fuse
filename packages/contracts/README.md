# The New Fuse Smart Contracts

This package contains the core smart contracts for The New Fuse decentralized
agent ecosystem, enabling on-chain identity, economic primitives, and governance
for AI agents.

## Smart Contract Overview

### Core Infrastructure

- **AgentNFTFactory.sol**: ERC-721/6551 agent identity and Token Bound Accounts
- **AgentProvenance.sol**: Lineage tracking and multi-generational relationships
- **FractionalizationVault.sol**: Fractional ownership of agent NFTs
- **RoyaltySplitter.sol**: Multi-generational royalty distribution
- **RentalMarketplace.sol**: Agent-as-a-service rental platform

## AgentNFTFactory.sol

### Purpose

The AgentNFTFactory serves as the exclusive minting authority for all Agent NFTs
in The New Fuse ecosystem. It bridges off-chain agent registration (via
MasterAgentRegistry) with immutable on-chain identity, enabling agents to own
assets, participate in governance, and engage in economic activities.

### Key Features

#### 🔗 **ERC-721 Base Functionality**

- Unique NFT representation for each agent
- Standard transfer and ownership mechanics
- Burnable tokens for agent lifecycle management

#### 🔄 **Dynamic NFT (dNFT) Capabilities**

- `updateMetadata()` function for real-time metadata updates
- Oracle-controlled metadata evolution
- Tracks last update timestamps

#### 🏦 **ERC-6551 Token Bound Account (TBA) Compatibility**

- Every minted Agent NFT automatically gets a TBA
- Enables agents to own assets and interact with DeFi
- Direct integration with TBA deployment flow

#### 💰 **ERC-2981 Royalty Support**

- Built-in royalty mechanism for creator compensation
- Configurable royalty percentages (max 10%)
- Supports multi-generational royalty distribution

#### 🏠 **ERC-4907 Rental Standard**

- `setUser()` and `userOf()` functions for trustless rentals
- Time-based rental expiration
- Enables agent-as-a-service business models

#### 🔐 **Access Control & Security**

- Role-based permissions (MINTER_ROLE, ORACLE_ROLE, PAUSER_ROLE)
- Pausable contract for emergency situations
- ReentrancyGuard protection
- Input validation and error handling

### Public Functions

#### Core Minting

```solidity
function mintAgent(
    address owner,
    string calldata agentId,
    string calldata initialMetadata,
    string calldata legalContractURI,
    string calldata agentType
) external returns (uint256)
```

**Restricted to:** MINTER_ROLE  
**Purpose:** Mint new Agent NFTs with complete metadata and provenance links

#### Dynamic Updates

```solidity
function updateMetadata(uint256 tokenId, string calldata newMetadataURI) external
function updateAgentStatus(uint256 tokenId, bool isActive) external
function setTBAAddress(uint256 tokenId, address tbaAddress) external
```

**Restricted to:** ORACLE_ROLE  
**Purpose:** Enable real-time updates to agent state and capabilities

#### Rental Management

```solidity
function setUser(uint256 tokenId, address user, uint64 expires) external
function userOf(uint256 tokenId) external view returns (address)
function userExpires(uint256 tokenId) external view returns (uint256)
```

**Purpose:** Manage temporary usage rights for agent services

### Key Dependencies

- **@openzeppelin/contracts**: Battle-tested contract implementations
- **Hardhat**: Development, testing, and deployment framework
- **Ethers.js**: Ethereum library for interactions

### Integration Points

1. **MasterAgentRegistry.ts**: Off-chain registration triggers on-chain minting
2. **AgentProvenance.sol**: Tracks parent-child relationships for royalties
3. **TBA Factory**: Automatic account creation for minted agents
4. **Marketplace Contracts**: Trading and rental functionality

### Usage Example

```javascript
// Deploy the contract
const AgentNFTFactory = await ethers.getContractFactory('AgentNFTFactory');
const factory = await AgentNFTFactory.deploy(
  'The New Fuse Agents',
  'TNFA',
  adminAddress,
  royaltyRecipient,
  250 // 2.5% royalty
);

// Mint an agent (called by MasterAgentRegistry)
const tx = await factory.mintAgent(
  agentOwner,
  'agent_basic_12345',
  'ipfs://QmMetadataHash',
  'ipfs://QmConstitutionHash',
  'BASIC'
);
```

### Security Considerations

- All state-changing functions include proper access control
- Reentrancy protection on critical functions
- Input validation prevents invalid state
- Pausable functionality for emergency response
- Event emission for off-chain monitoring

### Gas Optimization

- Uses `Counters` library for efficient token ID management
- Struct packing for storage efficiency
- Batch operations where applicable
- View functions for gas-free data access

### Future Extensibility

The contract is designed to integrate with:

- Fractional ownership protocols
- DAO governance systems
- Cross-chain bridging solutions
- Advanced rental marketplaces
- AI training reward mechanisms

## FractionalizationVault.sol

### Purpose

Enables fractional ownership of high-value Agent NFTs through ERC-20 share
tokens, allowing multiple parties to own portions of a single agent and receive
proportional revenue.

### Key Features

- **ERC-20 Share Tokens**: 10,000 shares per NFT (0.01% precision)
- **Revenue Distribution**: Proportional ETH distribution to shareholders
- **Redemption Mechanism**: 80% threshold for reconstructing full ownership
- **Governance Rights**: Shareholders can participate in agent decisions
- **Emergency Controls**: Pausable functionality and access control

### Core Functions

```solidity
function lockNFT(address nftContract, uint256 tokenId, uint256 sharePrice) external returns (uint256)
function buyShares(uint256 vaultId, uint256 shares) external payable
function depositRevenue(uint256 vaultId) external payable
function claimRevenue(uint256 vaultId, address[] calldata shareholders) external
function redeemNFT(uint256 vaultId, uint256 shares) external
```

## RoyaltySplitter.sol

### Purpose

Handles multi-generational royalty distribution across agent lineage
hierarchies, ensuring fair compensation for all agents in a derivation chain.

### Key Features

- **Multi-Generation Support**: Up to 5 generations in lineage
- **Configurable Distribution**: Default percentages (50%, 25%, 12.5%, 6.25%,
  6.25%)
- **Gas-Efficient Processing**: Batch operations and pending withdrawals
- **Lineage Verification**: Integration with AgentProvenance contract
- **Emergency Mechanisms**: Pausable with emergency withdrawal

### Core Functions

```solidity
function setRoyaltyRecipients(uint256 tokenId, address[] calldata recipients, uint256[] calldata percentages, uint256[] calldata generations) external
function setDefaultRoyaltyRecipients(uint256 tokenId, address[] calldata lineage) external
function createRoyaltyDistribution(uint256 tokenId) external payable returns (uint256)
function executeDistribution(uint256 distributionId) external
function withdraw() external
```

## RentalMarketplace.sol

### Purpose

Decentralized marketplace for renting Agent NFTs, enabling agent-as-a-service
business models with flexible pricing and secure escrow.

### Key Features

- **ERC-4907 Compatibility**: Standard rental functionality
- **Flexible Pricing**: Hourly, daily, weekly, and fixed pricing models
- **Security Deposits**: 10% deposit system for rental protection
- **Rating System**: Bidirectional ratings for reputation building
- **Automatic Expiration**: Time-based rental management

### Core Functions

```solidity
function createListing(address nftContract, uint256 tokenId, uint256 pricePerUnit, PricingModel pricingModel, uint256 minDuration, uint256 maxDuration, string calldata metadataURI) external returns (uint256)
function rentAgent(uint256 listingId, uint256 duration) external payable returns (uint256)
function endRental(uint256 agreementId, bool returnDeposit) external
function submitRating(uint256 agreementId, uint8 rating, string calldata reviewURI) external
```

## AgentProvenance.sol

### Purpose

Tracks lineage and relationships between Agent NFTs for multi-generational
royalties, attribution, and collaboration verification.

### Key Features

- **Complete Lineage Tracking**: Parent-child relationships with contribution
  percentages
- **Relationship Types**: Parent, Collaboration, Inspiration, Fork, Merge
- **Circular Dependency Prevention**: Ensures no loops in lineage chains
- **Collaboration Groups**: Multi-agent creation tracking
- **Trusted Verifiers**: Verified provenance relationships

### Core Functions

```solidity
function recordProvenance(uint256 childTokenId, uint256 parentTokenId, RelationshipType relationship, uint256 contributionPercentage, string calldata metadataURI) external
function recordCollaboration(uint256[] calldata agentTokenIds, uint256 outputTokenId, uint256[] calldata contributions, string calldata collaborationURI) external returns (uint256)
function markAsGenesis(uint256 tokenId, string calldata creationMetadata) external
function getAgentLineage(uint256 tokenId) external view returns (uint256[] memory parents, uint256[] memory children, uint256 generation, bool isGenesis)
function getAncestors(uint256 tokenId, uint256 maxDepth) external view returns (uint256[] memory)
```

## Integration Architecture

### Contract Interactions

```
AgentNFTFactory (Core Identity)
    ↓
AgentProvenance (Lineage Tracking)
    ↓
RoyaltySplitter (Revenue Distribution)
    ↓
FractionalizationVault (Ownership Fractionalization)
    ↓
RentalMarketplace (Service Monetization)
```

### Off-Chain Integration

- **MasterAgentRegistry**: Triggers on-chain minting
- **VCIssuanceService**: Verifiable credential issuance
- **IPFS**: Metadata and legal contract storage
- **Drizzle Database**: Off-chain state management

## Deployment Guide

### Prerequisites

```bash
pnpm install
npx hardhat compile
```

### Deploy Sequence

1. Deploy AgentNFTFactory
2. Deploy AgentProvenance (with NFT factory address)
3. Deploy RoyaltySplitter (with admin and NFT factory address)
4. Deploy FractionalizationVault (with share token details)
5. Deploy RentalMarketplace (with fee configuration)

### Configuration

```javascript
// Example deployment script
const AgentNFTFactory = await ethers.getContractFactory('AgentNFTFactory');
const factory = await AgentNFTFactory.deploy(
  'The New Fuse Agents',
  'TNFA',
  adminAddress,
  royaltyRecipient,
  250 // 2.5% royalty
);

const AgentProvenance = await ethers.getContractFactory('AgentProvenance');
const provenance = await AgentProvenance.deploy(adminAddress, factory.address);
```

## Security Considerations

### Access Control

- Role-based permissions across all contracts
- Multi-signature requirements for critical operations
- Time-locked upgrades for enhanced security

### Economic Security

- Contribution percentage caps to prevent exploitation
- Minimum thresholds for redemption operations
- Platform fee limits to ensure fair economics

### Technical Security

- Reentrancy protection on all state-changing functions
- Input validation and bounds checking
- Pausable functionality for emergency response
- Comprehensive event emission for monitoring
