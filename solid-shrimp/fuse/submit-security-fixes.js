#!/usr/bin/env node
/**
 * Jules Task: Fix Critical Security Issues
 *
 * Submits a task to Jules CLI to fix the critical security vulnerabilities
 * identified in the security package audit.
 */

const { execSync } = require('child_process');

const taskPrompt = `
## Task: Fix Critical Security Issues in packages/security

Based on the security audit, fix the following CRITICAL issues:

### Issue 1: Encryption Key Fallback (SecurityService.ts)

**Current Code (line 18):**
\`\`\`typescript
Buffer.from(process.env.ENCRYPTION_KEY || '')
\`\`\`

**Fix:** Add proper validation at service initialization:
\`\`\`typescript
private validateEncryptionKey(): Buffer {
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

### Issue 2: Stub Credential Validation (auth/index.ts)

**Current Code (lines 19-22):**
\`\`\`typescript
async validateCredentials(_credentials: UserCredentialsType): Promise<boolean> {
  return true; // Always returns true!
}
\`\`\`

**Fix:** Add a TODO comment and proper placeholder:
\`\`\`typescript
async validateCredentials(credentials: UserCredentialsType): Promise<boolean> {
  // TODO: Implement actual credential validation
  // This should:
  // 1. Look up user by username
  // 2. Compare password hash using bcrypt
  // 3. Check account status (active, locked, etc.)
  throw new Error('validateCredentials not implemented - configure user repository');
}
\`\`\`

### Issue 3: Dynamic JWT Require (auth/index.ts)

**Current Code (lines 26, 32):**
\`\`\`typescript
const jwt = require('jsonwebtoken');
\`\`\`

**Fix:** Use proper ES import at top of file:
\`\`\`typescript
import jwt from 'jsonwebtoken';
// or: import * as jwt from 'jsonwebtoken';
\`\`\`

### Additional Improvements:

1. Add JSDoc comments to all public methods
2. Ensure all error messages are consistent
3. Add type safety where missing

### Files to modify:
- packages/security/src/SecurityService.ts
- packages/security/src/auth/index.ts

### Testing:
After changes, run:
\`\`\`bash
cd packages/security && pnpm build && pnpm test
\`\`\`
`;

console.log('Submitting security fix task to Jules...');
console.log('Task prompt length:', taskPrompt.length, 'characters');

try {
  // Check if Jules is available
  execSync('which jules', { encoding: 'utf8' });

  // Submit the task
  const command = `jules new "${taskPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  console.log('\\nExecuting jules new command...');

  const result = execSync(command, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 30000,
  });

  console.log('Jules response:', result);
} catch (error) {
  if (error.message.includes('which jules')) {
    console.log('\\n⚠️  Jules CLI not found. Task saved for manual submission.');
    console.log('\\nTo submit manually, run:');
    console.log('  jules new "Fix critical security issues in packages/security..."');
  } else {
    console.error('Error submitting task:', error.message);
  }
}

console.log('\\n✅ Security fix task prepared');
console.log('Monitor with: jules remote list --session');
