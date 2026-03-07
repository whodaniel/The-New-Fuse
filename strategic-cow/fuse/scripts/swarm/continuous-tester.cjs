#!/usr/bin/env node
/**
 * TNF Continuous Testing Swarm
 * 
 * Runs a perpetual loop of testing agents that test thenewfuse.com
 * Each agent has a specialty and reports issues to Redis
 * 
 * Usage: node scripts/swarm/continuous-tester.cjs
 */

const { RedisAgentClient } = require('../packages/tnf-cli/dist/RedisAgentClient.js');
const { spawn } = require('child_process');
const https = require('https');

const CONFIG = {
  baseUrl: 'https://thenewfuse.com',
  cycleIntervalMs: 5 * 60 * 1000, // 5 minutes between cycles
  issueChannel: 'tnf:issues',
  reportChannel: 'tnf:testing:reports',
};

// Agent definitions
const AGENTS = [
  {
    id: 'TNF:TESTER:FRONTEND:001',
    name: 'Frontend-Tester',
    role: 'tester',
    specialty: 'frontend',
    tests: [
      { name: 'Homepage Load', path: '/' },
      { name: 'Login Page', path: '/login' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Agent Hub', path: '/agents' },
    ],
  },
  {
    id: 'TNF:TESTER:API:001', 
    name: 'API-Tester',
    role: 'tester',
    specialty: 'api',
    tests: [
      { name: 'Health Check', path: '/api/health' },
      { name: 'API Status', path: '/api' },
      { name: 'Auth Session', path: '/api/auth/session' },
    ],
  },
  {
    id: 'TNF:TESTER:SECURITY:001',
    name: 'Security-Tester',
    role: 'tester',
    specialty: 'security',
    tests: [
      { name: 'HTTPS Check', checkHttps: true },
      { name: 'Headers Check', checkHeaders: true },
    ],
  },
];

class ContinuousTester {
  constructor() {
    this.redis = null;
    this.running = true;
    this.issueCount = 0;
    this.cycleCount = 0;
  }

  async start() {
    console.log('🚀 TNF Continuous Testing Swarm');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Target: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Interval: ${CONFIG.cycleIntervalMs / 60000} minutes`);
    console.log(`🤖 Agents: ${AGENTS.length}`);
    console.log('');

    // Try to connect to Redis
    try {
      this.redis = new RedisAgentClient({
        agentId: 'TNF:TESTER:ORCHESTRATOR:001',
        agentName: 'Test-Orchestrator',
        role: 'orchestrator',
      });
      await this.redis.connect();
      console.log('✅ Connected to Redis bus');
    } catch (err) {
      console.log('⚠️  Redis not available, running standalone');
      this.redis = null;
    }

    // Start test loop
    await this.runLoop();
  }

  async runLoop() {
    while (this.running) {
      this.cycleCount++;
      const cycleStart = Date.now();

      console.log('\n' + '━'.repeat(50));
      console.log(`🔄 CYCLE #${this.cycleCount} - ${new Date().toISOString()}`);
      console.log('━'.repeat(50));

      // Run each agent's tests
      for (const agent of AGENTS) {
        await this.runAgentTests(agent);
      }

      // Summary
      const cycleDuration = ((Date.now() - cycleStart) / 1000).toFixed(1);
      console.log('\n📊 CYCLE SUMMARY');
      console.log(`   Duration: ${cycleDuration}s`);
      console.log(`   Total Issues: ${this.issueCount}`);

      // Report to Redis
      if (this.redis) {
        await this.redis.publish(CONFIG.reportChannel, {
          cycle: this.cycleCount,
          duration: cycleDuration,
          issues: this.issueCount,
          timestamp: new Date().toISOString(),
        });
      }

      // Wait for next cycle
      console.log(`\n😴 Sleeping ${CONFIG.cycleIntervalMs / 60000} minutes...`);
      await this.sleep(CONFIG.cycleIntervalMs);
    }
  }

  async runAgentTests(agent) {
    console.log(`\n🤖 [${agent.name}] Running ${agent.specialty} tests...`);

    for (const test of agent.tests) {
      const result = await this.runTest(agent, test);
      
      if (!result.passed) {
        this.issueCount++;
        await this.reportIssue(agent, test, result);
      }
    }
  }

  async runTest(agent, test) {
    const url = test.path ? `${CONFIG.baseUrl}${test.path}` : null;
    const startTime = Date.now();

    try {
      if (test.checkHttps) {
        const isHttps = CONFIG.baseUrl.startsWith('https://');
        return { passed: isHttps, message: isHttps ? 'HTTPS OK' : 'Not using HTTPS' };
      }

      if (test.checkHeaders) {
        return await this.checkHeaders(url || CONFIG.baseUrl);
      }

      if (url) {
        return await this.httpRequest(url);
      }

      return { passed: false, message: 'Unknown test type' };
    } catch (err) {
      return { passed: false, message: err.message, error: err.toString() };
    }
  }

  async httpRequest(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      https.get(url, (res) => {
        const duration = Date.now() - startTime;
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const passed = res.statusCode >= 200 && res.statusCode < 400;
          resolve({
            passed,
            statusCode: res.statusCode,
            duration,
            size: data.length,
            message: passed ? `HTTP ${res.statusCode} (${duration}ms)` : `HTTP ${res.statusCode}`,
          });
        });
      }).on('error', (err) => {
        resolve({ passed: false, message: err.message, error: err.toString() });
      });
    });
  }

  async checkHeaders(url) {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        const headers = res.headers;
        const issues = [];

        // Check security headers
        if (!headers['x-frame-options']) issues.push('Missing X-Frame-Options');
        if (!headers['x-content-type-options']) issues.push('Missing X-Content-Type-Options');
        if (!headers['strict-transport-security']) issues.push('Missing HSTS');

        resolve({
          passed: issues.length === 0,
          message: issues.length === 0 ? 'Security headers OK' : issues.join(', '),
          issues,
        });
      }).on('error', (err) => {
        resolve({ passed: false, message: err.message });
      });
    });
  }

  async reportIssue(agent, test, result) {
    const issue = {
      timestamp: new Date().toISOString(),
      agent: agent.name,
      specialty: agent.specialty,
      test: test.name,
      path: test.path,
      passed: result.passed,
      message: result.message,
      details: result,
    };

    console.log(`   ❌ ISSUE: ${test.name} - ${result.message}`);

    if (this.redis) {
      await this.redis.publish(CONFIG.issueChannel, issue);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.running = false;
  }
}

// Main
const tester = new ContinuousTester();

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping continuous tester...');
  tester.stop();
  process.exit(0);
});

tester.start().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
