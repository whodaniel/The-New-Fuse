#!/bin/bash

echo "Submitting Jules tasks..."

# Batch 1: Claude Dev Automation Controller
jules new "Fix 23 TypeScript errors in apps/api/src/controllers/claude-dev-automation.controller.ts. Errors: cast unknown errors to Error, rename getTasksByTenant to getTasksByAgent, add template/resourceUsage/successRate props types."

# Batch 2: Vector Store gRPC Client
jules new "Fix 17 TypeScript errors in apps/api/src/services/vector-store-grpc.client.ts. Fix gRPC client type mismatches and annotations."

# Batch 3: Chat Service
jules new "Fix 12 TypeScript errors in apps/api/src/modules/chat/chat.service.ts. Fix type annotations, interfaces and method signatures."

# Batch 4: Enhanced Error Handler
jules new "Fix 11 TypeScript errors in apps/api/src/middleware/enhanced-error-handler.middleware.ts. Fix handler types and signatures."

# Batch 5: Workflow Controller
jules new "Fix 10 TypeScript errors in apps/api/src/controllers/workflow.controller.ts. Fix Prisma schema mismatches (createdAt vs startTime), request.user casting, and enum values."

# Batch 6: Security Integration Service
jules new "Fix 9 TypeScript errors in apps/api/src/security/security-integration.service.ts. Fix type annotations."

# Batch 7: LLM Provider Service
jules new "Fix 9 TypeScript errors in apps/api/src/llm/llm-provider.service.ts. Fix null vs undefined type mismatches for apiEndpoint."

# Batch 8: Security Config
jules new "Fix 9 TypeScript errors in apps/api/src/config/security.config.ts. Fix 'string | undefined' assignability by adding default values or null coalescing."

# Batch 9: Enhanced Security Middleware
jules new "Fix 7 TypeScript errors in apps/api/src/middleware/enhanced-security.middleware.ts. Fix type annotations."

# Batch 10: Fuse App
jules new "Fix 7 TypeScript errors in apps/api/src/fuseApp.ts. Allow session.user_id by casting to any or augmenting type."

# Batch 11: Auth Service
jules new "Fix 6 TypeScript errors in apps/api/src/services/authService.ts. Update User type annotations."

# Batch 12: Claude Dev CLI
jules new "Fix 6 TypeScript errors in apps/api/src/scripts/claude-dev-cli.ts. Fix CLI script type issues."

# Batch 13: Remaining Miscellaneous Errors
jules new "Fix remaining TypeScript errors in: web3auth.service.ts, agent.service.ts, enhanced-rate-limit.service.ts, neural.tsx, routes/index.ts, monitoring/wallet-monitoring.service.ts, csrf-protection.middleware.ts, gql-auth.guard.ts, n8n-workflows.controller.ts, monitoring.controller.ts, analyzer.service.ts. Verify with tsc."

echo "All tasks submitted."
