# The New Fuse Universal Wallet Platform

A secure, scalable, and compliant crypto wallet infrastructure for both humans and AI agents using Web3Auth and ERC-4337 Account Abstraction. Every user gets both an EOA (Externally Owned Account) and an optional Smart Account for enhanced functionality.

## 🏗️ Architecture Overview

### Core Components

1. **Universal Wallet System** - Every user gets both EOA and Smart Account capabilities
2. **Web3Auth Integration** - Non-custodial wallet generation using MPC
3. **ERC-4337 Smart Accounts** - Advanced account features for all users (humans and AI)
4. **Custom Paymaster** - Gas sponsorship for authorized Smart Accounts
5. **Hybrid Transaction Support** - Choose between EOA or Smart Account for each transaction
6. **Compliance Layer** - Real-time transaction monitoring and risk assessment
7. **Monitoring System** - 24/7 health checks and security alerts

### Technology Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Ethereum (viem for interaction)
- **Smart Contracts**: Solidity with Foundry
- **Authentication**: Web3Auth Node SDK
- **Account Abstraction**: ERC-4337 implementation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Web3Auth Client ID (sign up at [web3auth.io](https://web3auth.io))
- Ethereum RPC endpoint

### Installation

1. **Install Dependencies**
   ```bash
   cd apps/api
   bun install
   ```

2. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Database**
   ```bash
   bunx prisma migrate dev
   bunx prisma generate
   ```

4. **Deploy Smart Contracts** (Optional - for full setup)
   ```bash
   cd contracts
   forge install
   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
   ```

5. **Start the API Server**
   ```bash
   bun run dev
   ```

## 📋 API Endpoints

### Wallet Management

#### Create Wallet
```http
POST /wallets/create
Content-Type: application/json

{
  "userId": "user_123",
  "verifierId": "ai_agent_456",
  "chainId": 1,
  "userType": "AI"  // "HUMAN" or "AI"
}
```

#### Get User Wallets
```http
GET /wallets/user/{userId}
```

#### Get Wallet by Address
```http
GET /wallets/address/{address}
```

### Transaction Management

#### Create AI Agent Transaction
```http
POST /transactions/ai-transaction
Content-Type: application/json

{
  "agentVerifierId": "ai_agent_456",
  "to": "0x742d35Cc6634C0532925a3b8D400ff91E00A56E9",
  "value": "0.1",
  "data": "0x"
}
```

### Monitoring

#### System Health
```http
GET /monitoring/health
```

#### Recent Alerts
```http
GET /monitoring/alerts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WEB3AUTH_CLIENT_ID` | Web3Auth project client ID | ✅ |
| `WEB3AUTH_JWT_SECRET` | JWT signing secret | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | ✅ |
| `ENTRY_POINT_ADDRESS` | ERC-4337 EntryPoint contract | ✅ |
| `TNF_PAYMASTER_ADDRESS` | Custom Paymaster contract | ⚠️ |
| `BUNDLER_URL` | Account Abstraction bundler | ⚠️ |

⚠️ = Required for full ERC-4337 functionality

### Web3Auth Setup

1. Sign up at [web3auth.io](https://web3auth.io)
2. Create a new project
3. Configure verifiers for server-side usage
4. Add your client ID to environment variables

## 🔐 Security Features

### Multi-Party Computation (MPC)
- Private keys never stored or exposed
- Web3Auth handles key shares across multiple parties
- Non-custodial architecture

### Compliance Integration
- Real-time transaction risk assessment
- Configurable compliance API integration
- Automatic high-risk transaction blocking

### Monitoring & Alerts
- 24/7 system health monitoring
- Automated security alerts
- Anomaly detection for AI agent behavior

## 🏭 Smart Contracts

### TNFPaymaster
Gas sponsorship contract for authorized AI agents.

**Key Features:**
- Agent authorization management
- Gas limit enforcement per agent
- Real-time usage tracking
- Owner controls and emergency functions

### TNFSmartAccount
ERC-4337 compliant Smart Account for AI agents.

**Key Features:**
- Web3Auth signature validation
- Batch transaction support
- NFT and token compatibility
- Ownership transfer capabilities

### TNFSmartAccountFactory
Deterministic Smart Account deployment using CREATE2.

**Key Features:**
- Counterfactual address generation
- Gas-efficient deployment
- Duplicate prevention

## 📊 Monitoring Dashboard

Access the monitoring dashboard at `/monitoring/health` for:

- Real-time system health metrics
- Active agent statistics
- Transaction volume analytics
- Security alert history
- Paymaster balance tracking

## 🧪 Testing

```bash
# Run unit tests
bun test

# Run integration tests  
bun test:integration

# Smart contract tests
cd contracts && forge test
```

## 🚀 Deployment

### Development
```bash
bun run dev
```

### Production
```bash
bun run build
bun run start:prod
```

### Docker
```bash
docker build -t tnf-wallet-api .
docker run -p 3001:3001 tnf-wallet-api
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Stateless API design allows multiple instances
- Database connection pooling configured
- Web3Auth handles distributed key management

### Performance Optimization
- Redis caching for frequent queries
- Database indexing on wallet addresses
- Batch transaction processing

### Security Hardening
- Rate limiting on sensitive endpoints
- IP whitelisting for admin functions
- Encrypted sensitive configuration

## 🔍 Troubleshooting

### Common Issues

**Web3Auth Connection Failed**
- Verify client ID and network configuration
- Check JWT secret and verifier setup
- Ensure proper domain configuration

**Transaction Stuck in Pending**
- Check bundler service health
- Verify EntryPoint contract address
- Monitor gas price configuration

**Paymaster Out of Funds**
- Monitor paymaster balance alerts
- Configure auto-funding if available
- Check deposit transaction confirmations

### Debug Mode
```bash
DEBUG=tnf:* bun run dev
```

## 📚 Documentation

- [Web3Auth Documentation](https://web3auth.io/docs/)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Viem Documentation](https://viem.sh/)
- [NestJS Documentation](https://nestjs.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Security Notice

This is a production-ready implementation but should undergo security audits before handling significant value. The smart contracts include standard security patterns but require thorough testing in your specific environment.

**Audit Recommendations:**
- Engage professional smart contract auditors
- Conduct penetration testing of API endpoints  
- Review Web3Auth integration security
- Validate compliance integration robustness

---

**The New Fuse Team** - Building the future of AI-powered blockchain interactions