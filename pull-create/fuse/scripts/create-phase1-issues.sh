#!/bin/bash

# Script to create GitHub issues for Phase 1 tasks
# Run this script after installing GitHub CLI: brew install gh

set -e

echo "🚀 Creating GitHub Issues for Phase 1 Tasks..."

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh"
    echo "   Then run: gh auth login"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Create Phase 1 issues
echo "📝 Creating Phase 1.1.1 - Redis Service Consolidation Audit..."
gh issue create \
  --title "[P1] 1.1.1: Audit all Redis implementations" \
  --label "phase-1,foundation,high-priority,redis" \
  --body "## 📋 Task Information

**Task ID:** 1.1.1  
**Phase:** Phase 1 - Foundation  
**Priority:** HIGH  
**Estimated Effort:** 3 days  
**Dependencies:** None

## 🎯 Objective

Audit all Redis implementations across the codebase to understand current usage patterns, identify duplications, and plan consolidation strategy.

## 📦 Deliverables

- [ ] Complete inventory of Redis implementations
- [ ] Dependency analysis document
- [ ] Consolidation strategy document
- [ ] Risk assessment for migration

## 📍 Current State Analysis

**Locations to audit:**
- \`packages/core/src/redis/\`
- \`packages/agent/src/bridges/redis_bridge.ts\`
- \`packages/core/src/cache/\`
- \`packages/core/src/services/redis.service.ts\`

**Current Issues:**
- Multiple Redis connection implementations
- Inconsistent Redis usage patterns
- Duplicated Redis configuration

## 🎯 Target State

**New Structure:**
- \`packages/infrastructure/redis/RedisService.ts\` (unified implementation)
- Single Redis connection pool
- Consistent Redis interface across all packages

## 🛠️ Implementation Steps

1. [ ] **Audit Phase**
   - [ ] Analyze each Redis implementation
   - [ ] Document connection patterns
   - [ ] Identify configuration differences
   - [ ] Map all dependencies

2. [ ] **Analysis Phase**
   - [ ] Compare feature sets
   - [ ] Identify critical functionality
   - [ ] Document breaking change risks
   - [ ] Plan backwards compatibility

3. [ ] **Documentation Phase**
   - [ ] Create consolidation strategy
   - [ ] Define migration timeline
   - [ ] Document rollback procedures

## ✅ Definition of Done

- [ ] All Redis implementations documented
- [ ] Dependency map created
- [ ] Consolidation strategy approved
- [ ] Migration plan documented

## 📊 Success Metrics

**Before:**
- 7+ separate Redis implementations
- Inconsistent connection handling
- Multiple configuration files

**After (Target):**
- 1 unified Redis service
- Single connection pool
- Centralized configuration

## 🔗 Related Issues

- Blocks: Redis Service Interface Creation
- Related: Configuration Standardization

---

**Roadmap Reference:** [CODEBASE_IMPROVEMENT_ROADMAP.md](../CODEBASE_IMPROVEMENT_ROADMAP.md)"

echo "📝 Creating Phase 1.1.2 - Create unified Redis service interface..."
gh issue create \
  --title "[P1] 1.1.2: Create unified Redis service interface" \
  --label "phase-1,foundation,high-priority,redis" \
  --body "## 📋 Task Information

**Task ID:** 1.1.2  
**Phase:** Phase 1 - Foundation  
**Priority:** HIGH  
**Estimated Effort:** 5 days  
**Dependencies:** Task 1.1.1 (Redis Audit)

## 🎯 Objective

Create a unified Redis service interface that combines all functionality from existing implementations while providing connection pooling, caching, and pub/sub capabilities.

## 📦 Deliverables

- [ ] \`packages/infrastructure/redis/RedisService.ts\`
- [ ] \`packages/infrastructure/redis/types.ts\`
- [ ] \`packages/infrastructure/redis/config.ts\`
- [ ] Comprehensive unit tests
- [ ] Integration tests
- [ ] Documentation

## 📍 Current State Analysis

**Based on audit findings from Task 1.1.1**

## 🎯 Target State

**New Structure:**
\`\`\`typescript
// packages/infrastructure/redis/RedisService.ts
export class RedisService {
  // Connection pooling
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  
  // Basic operations
  async get(key: string): Promise<string | null>
  async set(key: string, value: string, ttl?: number): Promise<void>
  async del(key: string): Promise<void>
  
  // Pub/Sub
  async publish(channel: string, message: string): Promise<void>
  async subscribe(channel: string, callback: Function): Promise<void>
  
  // Caching
  async cache<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>
}
\`\`\`

## 🛠️ Implementation Steps

1. [ ] **Design Phase**
   - [ ] Design unified interface
   - [ ] Plan connection pooling strategy
   - [ ] Define configuration schema

2. [ ] **Implementation Phase**
   - [ ] Create RedisService class
   - [ ] Implement connection pooling
   - [ ] Add pub/sub functionality
   - [ ] Implement caching layer

3. [ ] **Testing Phase**
   - [ ] Unit tests for all methods
   - [ ] Integration tests
   - [ ] Performance benchmarks

## ✅ Definition of Done

- [ ] Unified Redis service implemented
- [ ] All tests passing (95%+ coverage)
- [ ] Performance benchmarks meet requirements
- [ ] Documentation complete

## 📊 Success Metrics

**Performance Requirements:**
- Connection pool: 10-50 connections
- Cache hit ratio: >80%
- Response time: <10ms for simple operations

---

**Roadmap Reference:** [CODEBASE_IMPROVEMENT_ROADMAP.md](../CODEBASE_IMPROVEMENT_ROADMAP.md)"

echo "📝 Creating Phase 1.1.4 - Audit Agent implementations..."
gh issue create \
  --title "[P1] 1.1.4: Audit Agent implementations across packages" \
  --label "phase-1,foundation,high-priority,agents" \
  --body "## 📋 Task Information

**Task ID:** 1.1.4  
**Phase:** Phase 1 - Foundation  
**Priority:** HIGH  
**Estimated Effort:** 4 days  
**Dependencies:** None

## 🎯 Objective

Audit all Agent-related implementations across packages to understand current architecture, identify duplications, and plan consolidation into a unified Agent system.

## 📦 Deliverables

- [ ] Complete Agent implementation inventory
- [ ] Agent interface comparison analysis
- [ ] Agent capability mapping
- [ ] Consolidation strategy document

## 📍 Current State Analysis

**Locations to audit:**
- \`packages/core/src/agents/\`
- \`packages/agent/src/\`
- \`packages/features/agents/\`
- \`packages/core/components/agents/\`

**Suspected Issues:**
- Multiple Agent type definitions
- Inconsistent Agent interfaces
- Duplicated Agent management logic
- Fragmented Agent communication

## 🎯 Target State

**New Structure:**
- \`packages/agents/\` (unified Agent package)
- Single Agent interface definition
- Unified Agent management system
- Consistent communication protocols

## 🛠️ Implementation Steps

1. [ ] **Discovery Phase**
   - [ ] Map all Agent-related files
   - [ ] Analyze Agent type definitions
   - [ ] Document Agent capabilities
   - [ ] Identify communication patterns

2. [ ] **Analysis Phase**
   - [ ] Compare Agent interfaces
   - [ ] Identify core vs specialized functionality
   - [ ] Map dependencies between packages
   - [ ] Document breaking change risks

3. [ ] **Strategy Phase**
   - [ ] Design unified Agent architecture
   - [ ] Plan migration strategy
   - [ ] Define backwards compatibility approach

## ✅ Definition of Done

- [ ] All Agent implementations documented
- [ ] Interface comparison completed
- [ ] Consolidation strategy approved
- [ ] Migration plan documented

## 📊 Success Metrics

**Before:**
- 5+ separate Agent implementations
- Inconsistent Agent interfaces
- Fragmented communication

**After (Target):**
- 1 unified Agent system
- Single Agent interface
- Unified communication protocol

---

**Roadmap Reference:** [CODEBASE_IMPROVEMENT_ROADMAP.md](../CODEBASE_IMPROVEMENT_ROADMAP.md)"

echo "📝 Creating Phase 1.2.1 - Create base configuration system..."
gh issue create \
  --title "[P1] 1.2.1: Create base configuration system" \
  --label "phase-1,foundation,high-priority,configuration" \
  --body "## 📋 Task Information

**Task ID:** 1.2.1  
**Phase:** Phase 1 - Foundation  
**Priority:** HIGH  
**Estimated Effort:** 2 days  
**Dependencies:** None

## 🎯 Objective

Create a base configuration system that all packages can inherit from, reducing the 130+ configuration files to ~40 files through standardization and inheritance.

## 📦 Deliverables

- [ ] \`packages/config/base/tsconfig.base.json\`
- [ ] \`packages/config/base/eslint.base.js\`
- [ ] \`packages/config/base/jest.base.js\`
- [ ] \`packages/config/base/package.base.json\`
- [ ] Configuration inheritance documentation

## 📍 Current State Analysis

**Current Issues:**
- 130+ configuration files across packages
- 60-70% duplication in configurations
- Inconsistent linting and build rules
- Maintenance overhead for config updates

## 🎯 Target State

**New Structure:**
\`\`\`
packages/config/
├── base/
│   ├── tsconfig.base.json
│   ├── eslint.base.js
│   ├── jest.base.js
│   └── package.base.json
├── presets/
│   ├── frontend.json
│   ├── backend.json
│   └── library.json
└── README.md
\`\`\`

**Inheritance Pattern:**
\`\`\`json
// packages/core/tsconfig.json
{
  \"extends\": \"../config/base/tsconfig.base.json\",
  \"compilerOptions\": {
    // Package-specific overrides
  }
}
\`\`\`

## 🛠️ Implementation Steps

1. [ ] **Analysis Phase**
   - [ ] Audit existing configurations
   - [ ] Identify common patterns
   - [ ] Document differences

2. [ ] **Design Phase**
   - [ ] Create base configuration templates
   - [ ] Design inheritance strategy
   - [ ] Plan preset configurations

3. [ ] **Implementation Phase**
   - [ ] Create base configurations
   - [ ] Implement preset configurations
   - [ ] Create migration documentation

## ✅ Definition of Done

- [ ] Base configuration system created
- [ ] Inheritance pattern documented
- [ ] Migration guide available
- [ ] Validation scripts ready

## 📊 Success Metrics

**Target Reduction:**
- Configuration files: 130+ → ~40
- Duplication: 60-70% → <10%
- Maintenance overhead: -60%

---

**Roadmap Reference:** [CODEBASE_IMPROVEMENT_ROADMAP.md](../CODEBASE_IMPROVEMENT_ROADMAP.md)"

echo "📝 Creating Phase 1.3.1 - Merge packages/shared into packages/core..."
gh issue create \
  --title "[P1] 1.3.1: Merge packages/shared/ → packages/core/shared/" \
  --label "phase-1,foundation,medium-priority,refactoring" \
  --body "## 📋 Task Information

**Task ID:** 1.3.1  
**Phase:** Phase 1 - Foundation  
**Priority:** MEDIUM  
**Estimated Effort:** 2 days  
**Dependencies:** None

## 🎯 Objective

Merge the packages/shared/ package into packages/core/shared/ to reduce package fragmentation and consolidate shared utilities under the core package.

## 📦 Deliverables

- [ ] \`packages/core/shared/\` (migrated content)
- [ ] Updated import paths across codebase
- [ ] Updated package.json dependencies
- [ ] Migration validation tests

## 📍 Current State Analysis

**packages/shared/ contents:**
- Shared utilities and helpers
- Common interfaces and types
- Utility functions used across packages

**packages/core/ structure:**
- Core business logic
- Main application services
- Infrastructure components

## 🎯 Target State

**New Structure:**
\`\`\`
packages/core/
├── src/
├── shared/           # ← Migrated from packages/shared/
│   ├── utils/
│   ├── types/
│   └── helpers/
└── package.json      # ← Updated dependencies
\`\`\`

## 🛠️ Implementation Steps

1. [ ] **Preparation Phase**
   - [ ] Audit packages/shared/ contents
   - [ ] Map all import references
   - [ ] Identify potential conflicts

2. [ ] **Migration Phase**
   - [ ] Move files to packages/core/shared/
   - [ ] Update package.json files
   - [ ] Update import paths codebase-wide

3. [ ] **Validation Phase**
   - [ ] Run all tests
   - [ ] Verify build processes
   - [ ] Check for broken imports

4. [ ] **Cleanup Phase**
   - [ ] Remove packages/shared/ directory
   - [ ] Update workspace configuration
   - [ ] Update documentation

## ✅ Definition of Done

- [ ] packages/shared/ successfully migrated
- [ ] All tests passing
- [ ] No broken imports
- [ ] Documentation updated

## 🚨 Risk Assessment

**Potential Risks:**
- Circular dependency creation
- Import path conflicts
- Build system issues

**Mitigation:**
- Thorough dependency analysis
- Incremental migration approach
- Comprehensive testing

---

**Roadmap Reference:** [CODEBASE_IMPROVEMENT_ROADMAP.md](../CODEBASE_IMPROVEMENT_ROADMAP.md)"

echo "✅ Phase 1 GitHub issues created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Install GitHub CLI: brew install gh"
echo "2. Authenticate: gh auth login"
echo "3. Run this script: ./scripts/create-phase1-issues.sh"
echo "4. Assign team members to issues"
echo "5. Set up milestone tracking"