# NFT Agent System - End-to-End Testing Guide

## Overview

This guide provides comprehensive instructions for running the complete E2E test suite that validates the entire NFT Agent workflow from smart contract deployment to revenue distribution.

## 🧪 Test Coverage

### Primary E2E Workflow Test (`test-e2e-workflow.ts`)
The main E2E test covers the complete agent lifecycle:

1. **Smart Contract Deployment** - Deploy all contracts with proper linking
2. **Agent NFT Minting** - Create agent NFTs with metadata
3. **Smart Account Creation** - Deploy ERC-4337 Smart Accounts for agents
4. **Fractionalization** - Split NFT ownership into tradable shares
5. **Revenue Stream Setup** - Create and configure revenue tracking
6. **Marketplace Operations** - List, buy, sell, and offer on shares
7. **Revenue Distribution** - Automated proportional payments to shareholders
8. **Ownership Verification** - Validate share distributions and balances
9. **Analytics & Reporting** - System state and performance metrics

### Comprehensive Test Suite (`run-e2e-tests.ts`)
Additional validation tests include:

- **Contract Compilation** - Verify all contracts compile successfully
- **Basic Deployment** - Test individual contract deployments
- **Gas Optimization** - Ensure operations stay within gas limits
- **Security Validation** - Test access controls and attack vectors
- **Load/Stress Testing** - Concurrent operations and performance

## 🚀 Prerequisites

### 1. Environment Setup
```bash
# Install dependencies
cd contracts
npm install

# Install Hardhat if not already installed
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers chai
```

### 2. Network Configuration
Ensure your `hardhat.config.ts` includes test network configuration:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 10,
        accountsBalance: "10000000000000000000000" // 10000 ETH
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};

export default config;
```

### 3. Contract Compilation
```bash
# Compile all contracts
npx hardhat compile

# Verify compilation success
npx hardhat check
```

## 🏃‍♂️ Running Tests

### Quick E2E Workflow Test
```bash
# Run the main E2E workflow test
npx hardhat run scripts/test-e2e-workflow.ts

# Or using the test network
npx hardhat run scripts/test-e2e-workflow.ts --network hardhat
```

### Comprehensive Test Suite
```bash
# Run the full test suite including security and performance tests
npx hardhat run scripts/run-e2e-tests.ts

# Run with verbose output
npx hardhat run scripts/run-e2e-tests.ts --network hardhat --verbose
```

### Individual Test Components
```bash
# Test contract deployment only
npx hardhat run scripts/deploy.ts

# Test deployed contracts
npx hardhat run scripts/test-deployment.ts
```

## 📊 Expected Test Output

### Successful E2E Workflow Output
```
🚀 Starting E2E Workflow Test for NFT Agent System...
============================================================

📝 Test Accounts:
   Deployer:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Agent Owner:  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   Buyer 1:      0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
   Buyer 2:      0x90F79bf6EB2c4f870365E785982E1f101E93b906
   Buyer 3:      0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
------------------------------------------------------------

📦 Step 1: Deploying Contracts...
✅ TNFSmartAccountFactory deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ AgentNFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ AgentFractionalMarketplace deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ AgentRevenueDistributor deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
------------------------------------------------------------

🔐 Step 2: Authorizing Contract Interactions...
✅ Marketplace authorized for fractional share transfers
✅ Revenue distributor authorized for revenue management
------------------------------------------------------------

🎨 Step 3: Minting Agent NFT...
✅ Agent NFT minted with Token ID: 1
   Owner: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   Metadata: https://metadata.thenewfuse.com/agents/test-agent-1
✅ Ownership verification passed
------------------------------------------------------------

[... continues through all steps ...]

🎉 E2E Workflow Test Completed Successfully! 🎉
============================================================
```

### Test Results Summary
```
📋 TEST SUMMARY:
✅ Agent NFT minted and fractionalized
✅ Smart Account deployed and linked  
✅ Revenue stream created and funded
✅ Marketplace listing and trading functional
✅ Revenue distribution to shareholders working
✅ All contract integrations validated
🚀 System ready for production deployment!
```

## 🔍 Test Validation Points

### 1. Contract Deployment Validation
- All contracts deploy successfully
- Contract addresses are valid
- Authorization between contracts works

### 2. NFT Functionality Validation  
- NFT minting with proper ownership
- Metadata URI storage and retrieval
- Transfer functionality

### 3. Fractionalization Validation
- Proper share allocation (10,000 basis points = 100%)
- Ownership tracking accuracy
- Share transfer mechanics

### 4. Marketplace Validation
- Listing creation and management
- Share buying with ETH payments
- Offer creation and acceptance
- Proper fee collection

### 5. Revenue Distribution Validation
- Revenue stream creation
- Revenue accumulation tracking
- Proportional distribution calculation
- Shareholder claiming mechanism

### 6. Smart Account Validation
- Account deployment via factory
- Proper ownership assignment
- Balance and transaction capability

### 7. Security Validation
- Access control enforcement
- Unauthorized operation rejection
- Reentrancy protection
- Input validation

### 8. Performance Validation
- Gas usage within limits
- Concurrent operation handling
- Scalability under load

## 🐛 Troubleshooting

### Common Issues

#### 1. Contract Compilation Errors
```bash
# Clear cache and recompile
npx hardhat clean
npx hardhat compile
```

#### 2. Network Connection Issues
```bash
# Start local Hardhat network
npx hardhat node

# Run tests against local network
npx hardhat run scripts/test-e2e-workflow.ts --network localhost
```

#### 3. Gas Limit Errors
- Increase gas limit in hardhat.config.ts
- Optimize contract operations
- Check for infinite loops

#### 4. Balance Issues
```bash
# Check account balances
npx hardhat console
> const [deployer] = await ethers.getSigners()
> await deployer.getBalance()
```

### Error Codes

| Error | Description | Solution |
|-------|-------------|----------|
| `ContractDeploymentFailed` | Contract deployment reverted | Check constructor parameters |
| `UnauthorizedAccess` | Access control failure | Verify caller permissions |
| `InsufficientBalance` | Not enough ETH for operation | Fund test accounts |
| `GasLimitExceeded` | Transaction out of gas | Increase gas limit |
| `InvalidTokenId` | NFT doesn't exist | Verify token was minted |

## 📈 Performance Benchmarks

### Expected Gas Usage
- **NFT Minting**: ~150,000 gas
- **Fractionalization**: ~100,000 gas  
- **Share Transfer**: ~75,000 gas
- **Revenue Distribution**: ~50,000 + (recipients × 21,000) gas
- **Marketplace Listing**: ~80,000 gas

### Performance Targets
- **Test Execution Time**: < 2 minutes
- **Contract Deployment**: < 30 seconds
- **Transaction Confirmation**: < 5 seconds
- **Concurrent Operations**: 10+ simultaneous

## 📝 Test Reports

### Automated Reporting
Test results are automatically saved to:
```
contracts/test-reports/e2e-report-YYYY-MM-DDTHH-mm-ss.json
```

### Report Contents
- Test execution summary
- Individual test results
- Gas usage analytics
- Performance metrics
- Error details

### Custom Reporting
```typescript
// Access test results programmatically
import { E2ETestRunner } from './scripts/run-e2e-tests';

const runner = new E2ETestRunner();
await runner.runAllTests();
// Results automatically saved and printed
```

## 🚢 Pre-Deployment Checklist

Before production deployment, ensure:

- [ ] All E2E tests pass successfully
- [ ] Gas usage within acceptable limits
- [ ] Security validations pass
- [ ] Load testing completed
- [ ] Contract verification on block explorer
- [ ] Environment variables configured
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting setup

## 🔗 Related Documentation

- [Smart Contract Documentation](./SMART_CONTRACTS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Audit](./SECURITY.md)
- [API Integration](../NFT_AGENT_SYSTEM_DOCUMENTATION.md)

## 🆘 Support

For test-related issues:
1. Check the troubleshooting section above
2. Review test output logs for specific errors
3. Verify environment setup and prerequisites
4. Submit GitHub issue with test output and environment details

---

## Summary

This comprehensive E2E testing suite validates every aspect of the NFT Agent system, from basic contract functionality to complex multi-user revenue distribution scenarios. The tests serve as both validation tools and documentation of expected system behavior, ensuring confidence in the production deployment.