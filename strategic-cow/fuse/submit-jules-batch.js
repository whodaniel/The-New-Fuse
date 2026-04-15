#!/usr/bin/env node
/**
 * Batch Jules Task Submission
 *
 * Submits 15 strategic improvement tasks to Jules CLI for parallel execution.
 * Using Super Admin quota (100 tasks/day).
 *
 * Tasks are prioritized by impact on TNF framework security, stability, and DACC-v1 compliance.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// JULES TASK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const tasks = [
  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL SECURITY FIXES (Priority 1)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'SEC-01',
    priority: 'CRITICAL',
    title: 'Fix Encryption Key Validation',
    prompt: `## Task: Fix Critical Encryption Key Validation

**File:** packages/security/src/SecurityService.ts

**Current Issue (Line 18):**
\`\`\`typescript
Buffer.from(process.env.ENCRYPTION_KEY || '')
\`\`\`
Falls back to empty string if env var is missing, causing silent security failure.

**Required Fix:**
1. Add a private method to validate the encryption key:
\`\`\`typescript
private getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}
\`\`\`

2. Replace all occurrences of \`Buffer.from(process.env.ENCRYPTION_KEY || '')\` with \`this.getEncryptionKey()\`

3. Add JSDoc documentation explaining the key requirements

**Testing:**
- Verify build passes: \`cd packages/security && pnpm build\`
- Add unit test for key validation error cases
`,
  },
  {
    id: 'SEC-02',
    priority: 'CRITICAL',
    title: 'Fix Stub Credential Validation',
    prompt: `## Task: Fix Authentication Stub That Accepts All Credentials

**File:** packages/security/src/auth/index.ts

**Current Issue (Lines 19-22):**
\`\`\`typescript
async validateCredentials(_credentials: UserCredentialsType): Promise<boolean> {
  return true; // SECURITY VULNERABILITY - accepts everything!
}
\`\`\`

**Required Fix:**
Replace with proper implementation that throws until configured:
\`\`\`typescript
/**
 * Validates user credentials against the configured user store.
 *
 * @throws Error if no user repository is configured
 * @param credentials - The credentials to validate
 * @returns Promise resolving to true if valid, false otherwise
 */
async validateCredentials(credentials: UserCredentialsType): Promise<boolean> {
  // TODO: Inject UserRepository for production use
  // For now, throw to prevent silent security bypass
  if (!this.userRepository) {
    throw new Error(
      'AuthService.validateCredentials: No user repository configured. ' +
      'Inject a UserRepository implementation or use a different auth method.'
    );
  }

  const user = await this.userRepository.findByUsername(credentials.username);
  if (!user) return false;

  // Use bcrypt or similar for password comparison
  return this.comparePassword(credentials.password, user.passwordHash);
}
\`\`\`

**Also add:**
- UserRepository interface definition
- Optional constructor injection for userRepository
- JSDoc explaining the security implications

**Testing:** \`cd packages/security && pnpm build && pnpm test\`
`,
  },
  {
    id: 'SEC-03',
    priority: 'CRITICAL',
    title: 'Fix Dynamic JWT Require',
    prompt: `## Task: Replace Dynamic require() with ES Import for JWT

**File:** packages/security/src/auth/index.ts

**Current Issue (Lines 26, 32):**
\`\`\`typescript
const jwt = require('jsonwebtoken'); // Dynamic require inside methods
\`\`\`

**Problems:**
1. No TypeScript type safety
2. Bundle issues with modern bundlers
3. Performance overhead on each call

**Required Fix:**
1. Add import at top of file:
\`\`\`typescript
import * as jwt from 'jsonwebtoken';
// or: import jwt from 'jsonwebtoken';
\`\`\`

2. Remove all dynamic \`require('jsonwebtoken')\` calls

3. Ensure jsonwebtoken is in dependencies (not devDependencies)

4. Add proper typing for JWT payload:
\`\`\`typescript
interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}
\`\`\`

**Verification:**
\`\`\`bash
cd packages/security
pnpm build
pnpm test
\`\`\`
`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HIGH PRIORITY - DACC-v1 PROTOCOL COMPLIANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'DACC-01',
    priority: 'HIGH',
    title: 'Implement Message Signature Verification',
    prompt: `## Task: Add HMAC-SHA256 Message Signature Verification

**Location:** Create new file packages/security/src/signature/SignatureVerifier.ts

**Purpose:** Implement DACC-v1 protocol message signing and verification.

**Implementation:**
\`\`\`typescript
import { hmacSha256, timingSafeEqual } from '../utils/cryptoUtils';

export interface SignedMessage {
  header: {
    agent_id: string;
    alg: 'HS256';
    nonce: string;
    timestamp: number;
  };
  payload: Record<string, unknown>;
  signature: string;
}

export class SignatureVerifier {
  constructor(private readonly secret: string) {}

  /**
   * Signs a message using HMAC-SHA256
   */
  sign(header: SignedMessage['header'], payload: Record<string, unknown>): string {
    const message = JSON.stringify({ header, payload });
    return hmacSha256(message, this.secret);
  }

  /**
   * Verifies a signed message
   */
  verify(message: SignedMessage): boolean {
    const expectedSig = this.sign(message.header, message.payload);
    return timingSafeEqual(message.signature, expectedSig);
  }

  /**
   * Validates timestamp is within acceptable window (5 minutes)
   */
  isTimestampValid(timestamp: number, windowMs: number = 300000): boolean {
    const now = Date.now();
    return Math.abs(now - timestamp) <= windowMs;
  }
}
\`\`\`

**Also:**
1. Export from packages/security/src/index.ts
2. Add unit tests in packages/security/src/signature/SignatureVerifier.test.ts
3. Add JSDoc documentation

**Testing:** \`cd packages/security && pnpm build && pnpm test\`
`,
  },
  {
    id: 'DACC-02',
    priority: 'HIGH',
    title: 'Add Nonce Tracking for Replay Prevention',
    prompt: `## Task: Implement Nonce Tracker for Replay Attack Prevention

**Location:** Create new file packages/security/src/nonce/NonceTracker.ts

**Purpose:** Prevent replay attacks by tracking and rejecting duplicate nonces.

**Implementation:**
\`\`\`typescript
export interface NonceTrackerConfig {
  maxAgeMs: number;        // Max age of nonces to track (default: 5 minutes)
  cleanupIntervalMs: number; // Cleanup interval (default: 1 minute)
}

export class NonceTracker {
  private nonces = new Map<string, number>(); // nonce -> timestamp
  private cleanupInterval?: NodeJS.Timer;

  constructor(private config: NonceTrackerConfig = { maxAgeMs: 300000, cleanupIntervalMs: 60000 }) {
    this.startCleanup();
  }

  /**
   * Check if nonce is valid (not seen before within the time window)
   * @returns true if nonce is valid and has been recorded
   */
  isValid(nonce: string): boolean {
    const now = Date.now();

    if (this.nonces.has(nonce)) {
      return false; // Replay detected
    }

    this.nonces.set(nonce, now);
    return true;
  }

  /**
   * Generate a cryptographically secure nonce
   */
  static generate(): string {
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('hex');
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - this.config.maxAgeMs;
      for (const [nonce, timestamp] of this.nonces) {
        if (timestamp < cutoff) {
          this.nonces.delete(nonce);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.nonces.clear();
  }
}
\`\`\`

**Also:**
1. Export from packages/security/src/index.ts
2. Add unit tests
3. Consider Redis-backed implementation for distributed systems

**Testing:** \`cd packages/security && pnpm build && pnpm test\`
`,
  },
  {
    id: 'DACC-03',
    priority: 'HIGH',
    title: 'Add A2A Protocol Signature Wrapper',
    prompt: `## Task: Add DACC-v1 Signature Wrapper to A2A Core

**File:** packages/a2a-core/src/signature-wrapper.ts (new file)

**Purpose:** Wrap A2A messages with DACC-v1 compliant signatures.

**Implementation:**
\`\`\`typescript
import { hmacSha256 } from '@the-new-fuse/security';

export interface A2ASignedPacket {
  header: {
    agent_id: string;
    alg: 'HS256';
    nonce: string;
    timestamp: number;
  };
  payload: {
    type: string;
    channel?: string;
    data: unknown;
    conatus_weight?: number;
  };
  signature: string;
}

export class A2ASignatureWrapper {
  constructor(private readonly agentId: string, private readonly secret: string) {}

  wrap(type: string, data: unknown, options?: { channel?: string; conatusWeight?: number }): A2ASignedPacket {
    const header = {
      agent_id: this.agentId,
      alg: 'HS256' as const,
      nonce: this.generateNonce(),
      timestamp: Date.now()
    };

    const payload = {
      type,
      channel: options?.channel,
      data,
      conatus_weight: options?.conatusWeight
    };

    const message = JSON.stringify({ header, payload });
    const signature = hmacSha256(message, this.secret);

    return { header, payload, signature };
  }

  private generateNonce(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }
}
\`\`\`

**Also:**
1. Add to exports in packages/a2a-core/src/index.ts
2. Add integration tests
3. Document usage in README

**Testing:** \`cd packages/a2a-core && pnpm build\`
`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIUM PRIORITY - MCP CORE IMPROVEMENTS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'MCP-01',
    priority: 'MEDIUM',
    title: 'Fix AuthenticationManager Interval Leak',
    prompt: `## Task: Fix Memory Leak in AuthenticationManager

**File:** packages/mcp-core/src/auth/AuthenticationManager.ts

**Current Issue (Line 170):**
\`\`\`typescript
setInterval(() => this.cleanupExpiredTokens(), 60000); // Never cleaned up!
\`\`\`

The interval is created but never stored or cleared, causing a memory leak on shutdown.

**Required Fix:**
1. Store the interval reference:
\`\`\`typescript
private cleanupIntervalId?: NodeJS.Timer;

constructor(config: Partial<AuthManagerConfig> = {}) {
  super();
  // ... existing code ...

  // Start token cleanup interval
  this.cleanupIntervalId = setInterval(() => this.cleanupExpiredTokens(), 60000);
}
\`\`\`

2. Add a destroy/shutdown method:
\`\`\`typescript
/**
 * Cleanup resources and stop background tasks
 */
destroy(): void {
  if (this.cleanupIntervalId) {
    clearInterval(this.cleanupIntervalId);
    this.cleanupIntervalId = undefined;
  }
  this.tokens.clear();
  this.failedAttempts.clear();
  this.lockedAccounts.clear();
  this.emit('destroyed');
}
\`\`\`

3. Emit 'destroyed' event for external monitoring

**Testing:** \`cd packages/mcp-core && pnpm build && pnpm test\`
`,
  },
  {
    id: 'MCP-02',
    priority: 'MEDIUM',
    title: 'Replace Console Logging with Structured Logger',
    prompt: `## Task: Replace console.log with Structured Logger in MCP-Core

**Files to modify:**
- packages/mcp-core/src/broker/MessageRouter.ts
- packages/mcp-core/src/broker/MCPBroker.ts
- packages/mcp-core/src/auth/AuthenticationManager.ts

**Current Issue:**
Multiple files use \`console.log\` and \`console.error\` directly, making debugging and log aggregation difficult.

**Required Fix:**
1. Create a logger abstraction:
\`\`\`typescript
// packages/mcp-core/src/utils/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  constructor(private readonly name: string) {}

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(\`[\${this.name}] \${message}\`, context || '');
  }
  // ... implement other methods
}

export function createLogger(name: string): Logger {
  return new ConsoleLogger(name);
}
\`\`\`

2. Replace all console.log/error with logger calls
3. Add context objects where helpful (serviceId, requestId, etc.)

**Testing:** \`cd packages/mcp-core && pnpm build\`
`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIUM PRIORITY - AGENT PACKAGE IMPROVEMENTS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'AGENT-01',
    priority: 'MEDIUM',
    title: 'Add DACC-v1 Agent ID Format to Registry',
    prompt: `## Task: Implement DACC-v1 Agent ID Format in Redis Registry

**File:** packages/agent/src/registry/redis-agent-registry.ts

**Purpose:** Ensure agent IDs follow DACC-v1 format for protocol compliance.

**Required Changes:**
1. Add agent ID generation with DACC-v1 format:
\`\`\`typescript
/**
 * Generate a DACC-v1 compliant agent ID
 * Format: AGENT-XX where XX is a zero-padded sequential number
 */
generateAgentId(): string {
  const sequence = this.getNextSequence();
  return \`AGENT-\${sequence.toString().padStart(2, '0')}\`;
}

private async getNextSequence(): Promise<number> {
  const key = 'tnf:agent:sequence';
  return await this.redis.incr(key);
}
\`\`\`

2. Add agent ID validation:
\`\`\`typescript
isValidAgentId(id: string): boolean {
  return /^AGENT-\\d{2,}$/.test(id);
}
\`\`\`

3. Store assigned ID mapping for session continuity

**Also:**
- Add tests for ID generation and validation
- Document the ID format in JSDoc

**Testing:** \`cd packages/agent && pnpm build && pnpm test\`
`,
  },
  {
    id: 'AGENT-02',
    priority: 'MEDIUM',
    title: 'Add Agent Capability Discovery',
    prompt: `## Task: Implement Agent Capability Discovery

**File:** packages/agent/src/registry/redis-agent-registry.ts

**Purpose:** Allow agents to advertise and discover capabilities per A2A protocol.

**Required Changes:**
1. Extend AgentMetadata interface:
\`\`\`typescript
export interface AgentCapability {
  name: string;
  version: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface AgentMetadata {
  // ... existing fields ...
  capabilities: AgentCapability[];
  protocols: string[]; // e.g., ['DACC-v1', 'A2A-v0.3']
}
\`\`\`

2. Add capability query methods:
\`\`\`typescript
async findAgentsByCapability(capability: string): Promise<AgentMetadata[]> {
  // Search agents that have the specified capability
}

async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
  // Get capabilities for a specific agent
}
\`\`\`

**Testing:** \`cd packages/agent && pnpm build && pnpm test\`
`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIUM PRIORITY - INFRASTRUCTURE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'INFRA-01',
    priority: 'MEDIUM',
    title: 'Add Super Admin Account Types',
    prompt: `## Task: Define Super Admin Account Types for Multi-Tenant System

**Location:** Create new file packages/security/src/admin/SuperAdminTypes.ts

**Purpose:** Define the account hierarchy for the multi-tenant system with Super Admin privileges.

**Implementation:**
\`\`\`typescript
/**
 * Account tiers for the TNF multi-tenant system
 */
export enum AccountTier {
  /** Regular end users */
  USER = 'user',
  /** Project/team administrators */
  ADMIN = 'admin',
  /** System-wide administrators */
  SUPER_ADMIN = 'super_admin',
  /** Master developer account (Daniel Goldberg) */
  MASTER_DEV = 'master_dev'
}

export interface AccountQuota {
  /** Daily API calls */
  apiCallsPerDay: number;
  /** Daily Jules task submissions */
  julesTasksPerDay: number;
  /** Maximum concurrent agents */
  maxConcurrentAgents: number;
  /** Maximum storage (bytes) */
  maxStorageBytes: number;
}

export const DEFAULT_QUOTAS: Record<AccountTier, AccountQuota> = {
  [AccountTier.USER]: {
    apiCallsPerDay: 1000,
    julesTasksPerDay: 0,
    maxConcurrentAgents: 2,
    maxStorageBytes: 100 * 1024 * 1024 // 100MB
  },
  [AccountTier.ADMIN]: {
    apiCallsPerDay: 10000,
    julesTasksPerDay: 10,
    maxConcurrentAgents: 10,
    maxStorageBytes: 1024 * 1024 * 1024 // 1GB
  },
  [AccountTier.SUPER_ADMIN]: {
    apiCallsPerDay: 100000,
    julesTasksPerDay: 100,
    maxConcurrentAgents: 50,
    maxStorageBytes: 10 * 1024 * 1024 * 1024 // 10GB
  },
  [AccountTier.MASTER_DEV]: {
    apiCallsPerDay: Infinity,
    julesTasksPerDay: Infinity,
    maxConcurrentAgents: Infinity,
    maxStorageBytes: Infinity
  }
};

export interface SuperAdminAccount {
  id: string;
  email: string;
  tier: AccountTier;
  quotas: AccountQuota;
  createdAt: Date;
  /** Override default quotas */
  customQuotas?: Partial<AccountQuota>;
}
\`\`\`

**Also:**
1. Export from packages/security/src/index.ts
2. Add to RBAC manager integration
3. Document the tier system

**Testing:** \`cd packages/security && pnpm build\`
`,
  },
  {
    id: 'INFRA-02',
    priority: 'MEDIUM',
    title: 'Add Account Quota Enforcement',
    prompt: `## Task: Implement Quota Enforcement Service

**Location:** Create new file packages/security/src/admin/QuotaEnforcer.ts

**Purpose:** Track and enforce account quotas in real-time.

**Implementation:**
\`\`\`typescript
import { AccountTier, AccountQuota, DEFAULT_QUOTAS } from './SuperAdminTypes';

export interface QuotaUsage {
  apiCallsToday: number;
  julesTasksToday: number;
  activeAgents: number;
  storageUsedBytes: number;
  lastResetDate: string; // YYYY-MM-DD
}

export class QuotaEnforcer {
  private usage = new Map<string, QuotaUsage>();

  constructor(private storage?: { get: (key: string) => Promise<QuotaUsage | null>, set: (key: string, value: QuotaUsage) => Promise<void> }) {}

  async checkQuota(accountId: string, tier: AccountTier, action: keyof AccountQuota): Promise<boolean> {
    const quota = DEFAULT_QUOTAS[tier];
    const usage = await this.getUsage(accountId);

    switch (action) {
      case 'apiCallsPerDay':
        return usage.apiCallsToday < quota.apiCallsPerDay;
      case 'julesTasksPerDay':
        return usage.julesTasksToday < quota.julesTasksPerDay;
      case 'maxConcurrentAgents':
        return usage.activeAgents < quota.maxConcurrentAgents;
      default:
        return true;
    }
  }

  async incrementUsage(accountId: string, action: 'apiCall' | 'julesTask' | 'agentStart'): Promise<void> {
    const usage = await this.getUsage(accountId);
    // ... increment logic with daily reset
  }

  private async getUsage(accountId: string): Promise<QuotaUsage> {
    // Check storage or return fresh usage for new day
  }
}
\`\`\`

**Testing:** \`cd packages/security && pnpm build && pnpm test\`
`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LOWER PRIORITY - DOCUMENTATION & TESTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'DOCS-01',
    priority: 'LOW',
    title: 'Add DACC-v1 Protocol Documentation',
    prompt: `## Task: Create DACC-v1 Protocol Documentation

**Location:** Create docs/protocols/DACC-v1.md

**Purpose:** Document the DACC (Distributed Agent Communication Channel) protocol version 1.

**Content to include:**
1. Protocol Overview
   - Purpose and goals
   - Version history

2. Message Format
   - Header structure (agent_id, alg, nonce, timestamp)
   - Payload structure (type, channel, data, conatus_weight)
   - Signature generation and verification

3. Agent Registration
   - ID assignment format (AGENT-XX)
   - Capability advertisement
   - Channel joining

4. Security Requirements
   - HMAC-SHA256 signing
   - Nonce requirements for replay prevention
   - Timestamp validation window

5. Channel Management
   - Channel creation
   - Joining and leaving
   - Message broadcasting

6. Example Flows
   - Registration flow
   - Message exchange
   - Multi-agent coordination

**Format:** Use clear markdown with code examples in TypeScript.

**Test:** Ensure all examples compile.
`,
  },
  {
    id: 'TEST-01',
    priority: 'LOW',
    title: 'Add Integration Tests for A2A Communication',
    prompt: `## Task: Create Integration Tests for A2A Communication

**Location:** packages/a2a-core/src/__tests__/integration/

**Purpose:** Verify end-to-end agent communication flows.

**Tests to create:**
1. \`agent-registration.test.ts\`
   - Test agent registration with relay server
   - Verify ID assignment
   - Test duplicate registration handling

2. \`message-signing.test.ts\`
   - Test HMAC signature generation
   - Test signature verification
   - Test replay attack prevention

3. \`channel-communication.test.ts\`
   - Test channel creation
   - Test message broadcasting
   - Test channel membership

4. \`multi-agent-collaboration.test.ts\`
   - Test two-agent communication
   - Test three-agent coordination
   - Test message ordering

**Use Jest for test framework**

**Run tests:** \`cd packages/a2a-core && pnpm test\`
`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TASK SUBMISSION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function submitTasks() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  JULES BATCH TASK SUBMISSION - TNF IMPROVEMENT CYCLE          ║');
  console.log('║  Using Super Admin Quota (100 tasks/day)                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Total tasks to submit: ${tasks.length}`);
  console.log();

  // Check if Jules is available
  try {
    execSync('which jules', { encoding: 'utf8' });
    console.log('✅ Jules CLI found');
  } catch {
    console.log('❌ Jules CLI not found. Please install Jules first.');
    console.log('   Visit: https://jules.google.com');
    console.log();
    console.log('Tasks saved to file for manual submission.');
    saveTasks();
    return;
  }

  // Check Jules login status
  try {
    const status = execSync('jules remote list --session 2>&1 | head -1', { encoding: 'utf8' });
    console.log('✅ Jules authenticated');
  } catch (error) {
    console.log('⚠️  Jules may not be logged in. Attempting to proceed...');
  }

  console.log();
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Submitting tasks by priority:');
  console.log('─────────────────────────────────────────────────────────────────');

  const results = [];

  // Group by priority
  const criticalTasks = tasks.filter((t) => t.priority === 'CRITICAL');
  const highTasks = tasks.filter((t) => t.priority === 'HIGH');
  const mediumTasks = tasks.filter((t) => t.priority === 'MEDIUM');
  const lowTasks = tasks.filter((t) => t.priority === 'LOW');

  // Submit in priority order
  for (const taskGroup of [criticalTasks, highTasks, mediumTasks, lowTasks]) {
    for (const task of taskGroup) {
      try {
        console.log();
        console.log(`[${task.priority}] ${task.id}: ${task.title}`);

        // Escape the prompt for shell
        const escapedPrompt = task.prompt
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$')
          .replace(/\n/g, '\\n');

        // Submit to Jules
        const result = execSync(`jules new "${escapedPrompt}"`, {
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
          timeout: 60000,
        });

        console.log(`   ✅ Submitted successfully`);
        results.push({ task, status: 'success', result });

        // Small delay between submissions
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message.substring(0, 100)}`);
        results.push({ task, status: 'failed', error: error.message });
      }
    }
  }

  // Summary
  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SUBMISSION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');

  const successful = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log();
  console.log('Monitor progress with:');
  console.log('  jules remote list --session');
  console.log();

  // Save results
  const resultsFile =
    '.agent/jules-batch-results-' + new Date().toISOString().split('T')[0] + '.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsFile}`);
}

function saveTasks() {
  const tasksFile =
    '.agent/jules-pending-tasks-' + new Date().toISOString().split('T')[0] + '.json';
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
  console.log(`Tasks saved to: ${tasksFile}`);
}

// Run
submitTasks().catch(console.error);
