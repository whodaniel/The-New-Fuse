import { execSync } from 'child_process';
import fs from 'fs';
import { ethers } from 'hardhat';
import path from 'path';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  gasUsed?: string;
  error?: string;
}

class E2ETestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🧪 NFT Agent System - Comprehensive E2E Test Suite');
    console.log('='.repeat(70));

    this.startTime = Date.now();

    try {
      // 1. Run contract compilation test
      await this.runTest('Contract Compilation', async () => {
        execSync('npx hardhat compile', { stdio: 'pipe' });
      });

      // 2. Run basic deployment test
      await this.runTest('Basic Deployment', async () => {
        await this.testBasicDeployment();
      });

      // 3. Run full workflow test
      await this.runTest('Full E2E Workflow', async () => {
        execSync('npx hardhat run scripts/test-e2e-workflow.ts', { stdio: 'pipe' });
      });

      // 4. Run gas optimization test
      await this.runTest('Gas Optimization', async () => {
        await this.testGasOptimization();
      });

      // 5. Run security test
      await this.runTest('Security Validation', async () => {
        await this.testSecurity();
      });

      // 6. Run stress test
      await this.runTest('Load/Stress Test', async () => {
        await this.testLoadStress();
      });

      this.printFinalReport();
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      this.printFinalReport();
      process.exit(1);
    }
  }

  private async runTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    console.log(`\n🔄 Running: ${testName}...`);
    const startTime = Date.now();

    try {
      await testFunction();
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        passed: true,
        duration,
      });

      console.log(`✅ ${testName} PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        passed: false,
        duration,
        error: error.message,
      });

      console.log(`❌ ${testName} FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  private async testBasicDeployment(): Promise<void> {
    const [deployer] = await ethers.getSigners();

    // Deploy Smart Account Factory
    const TNFSmartAccountFactory = await ethers.getContractFactory('TNFSmartAccountFactory');
    const factory = await TNFSmartAccountFactory.deploy();
    await factory.deployed();

    // Deploy AgentNFT
    const AgentNFT = await ethers.getContractFactory('AgentNFT');
    const agentNFT = await AgentNFT.deploy('Test NFT', 'TEST', factory.address);
    await agentNFT.deployed();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory('AgentFractionalMarketplace');
    const marketplace = await Marketplace.deploy(agentNFT.address);
    await marketplace.deployed();

    // Deploy Revenue Distributor
    const Distributor = await ethers.getContractFactory('AgentRevenueDistributor');
    const distributor = await Distributor.deploy(agentNFT.address);
    await distributor.deployed();

    // Verify deployments
    if (!factory.address || !agentNFT.address || !marketplace.address || !distributor.address) {
      throw new Error('Contract deployment failed');
    }
  }

  private async testGasOptimization(): Promise<void> {
    const [deployer, user] = await ethers.getSigners();

    // Deploy contracts
    const TNFSmartAccountFactory = await ethers.getContractFactory('TNFSmartAccountFactory');
    const factory = await TNFSmartAccountFactory.deploy();
    await factory.deployed();

    const AgentNFT = await ethers.getContractFactory('AgentNFT');
    const agentNFT = await AgentNFT.deploy('Test NFT', 'TEST', factory.address);
    await agentNFT.deployed();

    // Test gas usage for key operations
    const gasTests = [];

    // 1. Test minting gas
    const mintTx = await agentNFT.connect(user).mint(user.address, 'test-uri');
    const mintReceipt = await mintTx.wait();
    gasTests.push({ operation: 'Mint NFT', gas: mintReceipt.gasUsed.toString() });

    // 2. Test fractionalization gas
    const tokenId = 1;
    const fractionalizeTx = await agentNFT
      .connect(user)
      .fractionalizeAgent(tokenId, 'Test Agent', 'Description', 'TYPE', ['cap1'], 10000, true);
    const fractionalizeReceipt = await fractionalizeTx.wait();
    gasTests.push({ operation: 'Fractionalize', gas: fractionalizeReceipt.gasUsed.toString() });

    // Verify gas usage is within acceptable limits
    const maxGasLimits = {
      'Mint NFT': 200000,
      Fractionalize: 150000,
    };

    for (const test of gasTests) {
      const gasUsed = parseInt(test.gas);
      const limit = maxGasLimits[test.operation];

      if (gasUsed > limit) {
        throw new Error(`${test.operation} used ${gasUsed} gas, exceeds limit of ${limit}`);
      }
    }

    console.log(`   Gas usage within acceptable limits`);
    gasTests.forEach((test) => {
      console.log(`   ${test.operation}: ${parseInt(test.gas).toLocaleString()} gas`);
    });
  }

  private async testSecurity(): Promise<void> {
    const [deployer, user, attacker] = await ethers.getSigners();

    // Deploy contracts
    const TNFSmartAccountFactory = await ethers.getContractFactory('TNFSmartAccountFactory');
    const factory = await TNFSmartAccountFactory.deploy();
    await factory.deployed();

    const AgentNFT = await ethers.getContractFactory('AgentNFT');
    const agentNFT = await AgentNFT.deploy('Test NFT', 'TEST', factory.address);
    await agentNFT.deployed();

    const Marketplace = await ethers.getContractFactory('AgentFractionalMarketplace');
    const marketplace = await Marketplace.deploy(agentNFT.address);
    await marketplace.deployed();

    // Test 1: Unauthorized fractionalization
    await agentNFT.connect(user).mint(user.address, 'test-uri');
    const tokenId = 1;

    try {
      await agentNFT
        .connect(attacker)
        .fractionalizeAgent(tokenId, 'Hacked', 'Desc', 'TYPE', [], 10000, true);
      throw new Error('Unauthorized fractionalization should have failed');
    } catch (error) {
      if (!error.message.includes('revert')) {
        throw error;
      }
    }

    // Test 2: Unauthorized marketplace authorization
    try {
      await agentNFT.connect(attacker).setMarketplaceAuthorization(marketplace.address, true);
      throw new Error('Unauthorized marketplace authorization should have failed');
    } catch (error) {
      if (!error.message.includes('revert')) {
        throw error;
      }
    }

    console.log(`   ✅ Access control tests passed`);
    console.log(`   ✅ Unauthorized operations properly rejected`);
  }

  private async testLoadStress(): Promise<void> {
    const signers = await ethers.getSigners();
    const [deployer, ...users] = signers.slice(0, 10); // Use up to 10 users

    // Deploy contracts
    const TNFSmartAccountFactory = await ethers.getContractFactory('TNFSmartAccountFactory');
    const factory = await TNFSmartAccountFactory.deploy();
    await factory.deployed();

    const AgentNFT = await ethers.getContractFactory('AgentNFT');
    const agentNFT = await AgentNFT.deploy('Test NFT', 'TEST', factory.address);
    await agentNFT.deployed();

    const Marketplace = await ethers.getContractFactory('AgentFractionalMarketplace');
    const marketplace = await Marketplace.deploy(agentNFT.address);
    await marketplace.deployed();

    // Authorize marketplace
    await agentNFT.connect(deployer).setMarketplaceAuthorization(marketplace.address, true);

    // Test: Mint multiple NFTs concurrently
    const mintPromises = users.slice(0, 5).map(async (user, index) => {
      const tx = await agentNFT.connect(user).mint(user.address, `test-uri-${index}`);
      return tx.wait();
    });

    const mintResults = await Promise.all(mintPromises);

    // Test: Fractionalize multiple NFTs
    const fractionalizePromises = users.slice(0, 5).map(async (user, index) => {
      const tokenId = index + 1;
      const tx = await agentNFT
        .connect(user)
        .fractionalizeAgent(
          tokenId,
          `Agent ${index}`,
          'Description',
          'TYPE',
          ['capability'],
          10000,
          true
        );
      return tx.wait();
    });

    await Promise.all(fractionalizePromises);

    console.log(`   ✅ Concurrent operations completed successfully`);
    console.log(`   ✅ Minted ${mintResults.length} NFTs concurrently`);
    console.log(`   ✅ Fractionalized ${fractionalizePromises.length} NFTs concurrently`);
  }

  private printFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const successRate = (passed / this.results.length) * 100;

    console.log('\n' + '='.repeat(70));
    console.log('🏁 FINAL TEST REPORT');
    console.log('='.repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration.toLocaleString()}ms`);
    console.log('');

    console.log('📋 Detailed Results:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      console.log(
        `   ${index + 1}. ${status} | ${result.testName.padEnd(25)} | ${duration.padStart(8)}`
      );

      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.gasUsed) {
        console.log(`      Gas: ${result.gasUsed}`);
      }
    });

    console.log('\n' + '='.repeat(70));

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! System ready for production deployment.');
    } else {
      console.log(`⚠️ ${failed} test(s) failed. Please review and fix issues before deployment.`);
    }

    // Save report to file
    this.saveReport();
  }

  private saveReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `../test-reports/e2e-report-${timestamp}.json`);

    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      summary: {
        total: this.results.length,
        passed: this.results.filter((r) => r.passed).length,
        failed: this.results.filter((r) => !r.passed).length,
        successRate: (this.results.filter((r) => r.passed).length / this.results.length) * 100,
      },
      results: this.results,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved: ${reportPath}`);
  }
}

// Run the test suite
async function main() {
  const runner = new E2ETestRunner();
  await runner.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

export { E2ETestRunner };
