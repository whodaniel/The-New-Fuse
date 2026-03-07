# Enhanced CodebaseIndexer - Health, Efficiency & Cost Optimization

## Overview

Enhanced version of CodebaseIndexer that adds:

1. **Duplication detection**
2. **Orphaned file detection**
3. **Memory leak detection**
4. **Inefficiency detection**
5. **Keyword index building**
6. **Concept matching across codebase**
7. **Orchestration layer validation**
8. **Cost-optimized task routing**

---

## 🔍 Codebase Health Audits

### 1. Duplication Detection

#### What It Finds:

- **Exact duplicates**: Same code in multiple files
- **Structural duplicates**: Similar structure, different variable names
- **Partial duplicates**: Code blocks > 5 lines that appear multiple times

#### Detection Algorithm:

```typescript
async detectDuplication(): Promise<DuplicationReport> {
  const files = await this.scanCodebase();
  const codeBlocks = new Map<string, string[]>();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Extract functions, classes, blocks
    const blocks = this.extractCodeBlocks(content);

    for (const block of blocks) {
      const hash = this.hashCode(block);

      if (!codeBlocks.has(hash)) {
        codeBlocks.set(hash, []);
      }
      codeBlocks.get(hash)!.push(file);
    }
  }

  // Find duplicates (hash with > 1 file)
  const duplicates = Array.from(codeBlocks.entries())
    .filter(([hash, files]) => files.length > 1)
    .map(([hash, files]) => ({
      codeHash: hash,
      occurrences: files.length,
      locations: files,
      suggestedAction: this.getDuplicationAction(files)
    }));

  return {
    totalDuplicates: duplicates.length,
    duplicates,
    estimatedWastedLines: duplicates.reduce((sum, d) => sum + (d.occurrences - 1) * 50, 0)
  };
}

getDuplicationAction(files: string[]): string {
  if (files.every(f => f.includes('/utils/'))) {
    return 'Extract to shared utility in packages/utils';
  }
  if (files.every(f => f.includes('Service.ts'))) {
    return 'Extract to base class or mixin';
  }
  return 'Review for consolidation or shared abstraction';
}
```

#### Report Example:

```json
{
  "type": "duplication",
  "severity": "medium",
  "duplicates": [
    {
      "codeHash": "a1b2c3d4",
      "occurrences": 3,
      "locations": [
        "packages/api/src/validators/user.ts",
        "packages/core/src/validators/user.ts",
        "apps/backend/src/validators/user.ts"
      ],
      "suggestedAction": "Extract to @the-new-fuse/validators package",
      "estimatedSavings": "150 lines, reduce maintenance by 66%"
    }
  ]
}
```

---

### 2. Orphaned File Detection

#### What It Finds:

- **Unused files**: No imports referencing them
- **Incomplete implementations**: Files with TODO or WIP comments
- **Deprecated files**: Old implementations left behind
- **Test files without source**: Tests for deleted code

#### Detection Algorithm:

```typescript
async detectOrphanedFiles(): Promise<OrphanedFileReport> {
  const allFiles = await this.scanCodebase();
  const importMap = await this.buildImportMap(allFiles);

  const orphaned: OrphanedFile[] = [];

  for (const file of allFiles) {
    const isReferenced = importMap.has(file);
    const isEntryPoint = this.isEntryPoint(file); // main.ts, index.ts, etc.
    const content = await fs.readFile(file, 'utf-8');

    // Check for orphaned markers
    const hasWIP = content.includes('WIP') || content.includes('TODO: Implement');
    const hasDeprecated = content.includes('@deprecated');
    const isTestWithoutSource = file.includes('.test.') && !this.hasSourceFile(file);

    if (!isReferenced && !isEntryPoint) {
      orphaned.push({
        file,
        reason: isTestWithoutSource ? 'test-without-source' :
                hasDeprecated ? 'deprecated' :
                hasWIP ? 'incomplete' : 'unused',
        lastModified: (await fs.stat(file)).mtime,
        suggestedAction: this.getOrphanAction(file, content)
      });
    }
  }

  return {
    totalOrphaned: orphaned.length,
    orphaned: orphaned.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime()),
    estimatedCleanupImpact: `${orphaned.length} files, ~${orphaned.length * 100} lines`
  };
}

getOrphanAction(file: string, content: string): string {
  if (content.includes('WIP') && content.split('\n').length < 50) {
    return 'DELETE - Incomplete stub, < 50 lines';
  }
  if (content.includes('@deprecated')) {
    return 'DELETE - Marked as deprecated';
  }
  if (file.includes('.test.')) {
    return 'DELETE - Test for deleted source';
  }
  return 'REVIEW - May be entry point or needed later';
}
```

#### Report Example:

```json
{
  "type": "orphaned-files",
  "severity": "low",
  "orphaned": [
    {
      "file": "packages/old-api/src/routes/legacy.ts",
      "reason": "deprecated",
      "lastModified": "2024-06-15T10:00:00Z",
      "suggestedAction": "DELETE - Marked as deprecated, 6 months old",
      "safeDeletion": true
    },
    {
      "file": "packages/core/src/experimental/feature.ts",
      "reason": "incomplete",
      "lastModified": "2024-12-20T15:00:00Z",
      "suggestedAction": "COMPLETE or DELETE - WIP for 8 days",
      "safeDeletion": false
    }
  ]
}
```

---

### 3. Memory Leak Detection

#### What It Finds:

- **Unclosed connections**: DB, Redis, WebSocket
- **Event listener leaks**: addEventListener without removeEventListener
- **Interval/Timeout leaks**: setInterval without clearInterval
- **Large object retention**: Objects held in closures

#### Detection Algorithm:

```typescript
async detectMemoryLeaks(): Promise<MemoryLeakReport> {
  const files = await this.scanCodebase();
  const leaks: MemoryLeak[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Pattern 1: Unclosed connections
    if (content.includes('new Redis(') && !content.includes('.quit()')) {
      leaks.push({
        file,
        type: 'unclosed-connection',
        pattern: 'Redis connection without .quit()',
        lineNumber: this.findLineNumber(content, 'new Redis('),
        severity: 'high',
        fix: 'Add cleanup in onModuleDestroy or process.on("SIGTERM")'
      });
    }

    // Pattern 2: Event listener leaks
    const addListeners = (content.match(/addEventListener\(/g) || []).length;
    const removeListeners = (content.match(/removeEventListener\(/g) || []).length;
    if (addListeners > removeListeners) {
      leaks.push({
        file,
        type: 'event-listener-leak',
        pattern: `${addListeners} addEventListener, ${removeListeners} removeEventListener`,
        severity: 'medium',
        fix: 'Add cleanup removeEventListener calls'
      });
    }

    // Pattern 3: Interval leaks
    if (content.includes('setInterval(') && !content.includes('clearInterval(')) {
      leaks.push({
        file,
        type: 'interval-leak',
        pattern: 'setInterval without clearInterval',
        lineNumber: this.findLineNumber(content, 'setInterval('),
        severity: 'high',
        fix: 'Store interval ref and clear in cleanup'
      });
    }

    // Pattern 4: Large array/object growth
    if (content.match(/\.push\(/) && !content.match(/\.splice\(|\.shift\(|\.pop\(/)) {
      leaks.push({
        file,
        type: 'unbounded-growth',
        pattern: 'Array.push without bounds checking',
        severity: 'medium',
        fix: 'Add max size check or periodic cleanup'
      });
    }
  }

  return {
    totalLeaks: leaks.length,
    criticalLeaks: leaks.filter(l => l.severity === 'high').length,
    leaks: leaks.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
  };
}
```

---

### 4. Inefficiency Detection

#### What It Finds:

- **N+1 queries**: Loop with DB query inside
- **Synchronous operations**: Blocking operations in async context
- **Large file reads**: Loading entire file when streaming would work
- **Redundant operations**: Same calculation multiple times

#### Detection Algorithm:

```typescript
async detectInefficiencies(): Promise<InefficiencyReport> {
  const files = await this.scanCodebase();
  const inefficiencies: Inefficiency[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Pattern 1: N+1 queries
    if (this.hasN1Query(content)) {
      inefficiencies.push({
        file,
        type: 'n-plus-1-query',
        pattern: 'Database query inside loop',
        impact: 'high',
        fix: 'Use bulk query with WHERE IN or JOIN',
        estimatedSpeedup: '10-100x depending on data size'
      });
    }

    // Pattern 2: Synchronous file operations
    if (content.includes('fs.readFileSync') && content.includes('async ')) {
      inefficiencies.push({
        file,
        type: 'sync-in-async',
        pattern: 'fs.readFileSync in async function',
        impact: 'medium',
        fix: 'Use await fs.readFile() instead',
        estimatedSpeedup: 'Non-blocking, better concurrency'
      });
    }

    // Pattern 3: Large file reads
    if (content.match(/readFile.*\.json.*JSON\.parse/) &&
        content.includes('readFile')) {
      inefficiencies.push({
        file,
        type: 'large-file-read',
        pattern: 'Reading entire JSON file into memory',
        impact: 'medium',
        fix: 'Use streaming JSON parser for large files',
        estimatedSpeedup: 'Constant memory vs linear growth'
      });
    }

    // Pattern 4: Multiple identical calculations
    const calculations = content.match(/new Date\(\).getTime\(\)/g);
    if (calculations && calculations.length > 3) {
      inefficiencies.push({
        file,
        type: 'redundant-calculation',
        pattern: `new Date().getTime() called ${calculations.length} times`,
        impact: 'low',
        fix: 'Cache result in variable',
        estimatedSpeedup: 'Micro-optimization, cleaner code'
      });
    }
  }

  return {
    totalInefficiencies: inefficiencies.length,
    highImpact: inefficiencies.filter(i => i.impact === 'high').length,
    inefficiencies
  };
}

hasN1Query(content: string): boolean {
  // Simplified detection
  return (content.includes('for (') || content.includes('forEach(')) &&
         (content.includes('.findOne(') || content.includes('.query('));
}
```

---

## 🔑 Keyword Index System

### Index Structure

```typescript
interface KeywordIndex {
  keyword: string;
  occurrences: number;
  locations: KeywordLocation[];
  relatedConcepts: string[];
}

interface KeywordLocation {
  file: string;
  lineNumber: number;
  context: string; // Surrounding 2 lines
  type: 'code' | 'comment' | 'string' | 'identifier';
}
```

### Building the Index

```typescript
async buildKeywordIndex(): Promise<Map<string, KeywordIndex>> {
  const files = await this.scanCodebase();
  const index = new Map<string, KeywordIndex>();

  // Key concepts to track
  const keywordList = [
    // Architecture
    'agent', 'service', 'controller', 'repository', 'queue', 'task',
    // Patterns
    'singleton', 'factory', 'observer', 'strategy', 'decorator',
    // Operations
    'authentication', 'authorization', 'validation', 'transformation',
    // Infrastructure
    'redis', 'database', 'websocket', 'http', 'api',
    // Business
    'user', 'workflow', 'execution', 'monitoring', 'logging'
  ];

  for (const keyword of keywordList) {
    const locations: KeywordLocation[] = [];

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          locations.push({
            file,
            lineNumber: idx + 1,
            context: lines.slice(Math.max(0, idx - 1), idx + 2).join('\n'),
            type: this.detectContextType(line, keyword)
          });
        }
      });
    }

    if (locations.length > 0) {
      index.set(keyword, {
        keyword,
        occurrences: locations.length,
        locations,
        relatedConcepts: this.findRelatedConcepts(keyword, locations)
      });
    }
  }

  // Save to Redis
  await this.saveKeywordIndex(index);

  return index;
}

findRelatedConcepts(keyword: string, locations: KeywordLocation[]): string[] {
  const conceptMap = {
    'agent': ['task', 'inbox', 'capability', 'heartbeat'],
    'service': ['controller', 'repository', 'dependency-injection'],
    'queue': ['task', 'job', 'worker', 'bull'],
    'authentication': ['authorization', 'token', 'session', 'jwt']
  };

  return conceptMap[keyword] || [];
}
```

### Searching the Index

```typescript
async searchConcept(concept: string): Promise<ConceptSearchResult> {
  const index = await this.loadKeywordIndex();
  const matches: KeywordIndex[] = [];

  // Direct match
  if (index.has(concept)) {
    matches.push(index.get(concept)!);
  }

  // Related concepts
  for (const [keyword, data] of index) {
    if (data.relatedConcepts.includes(concept)) {
      matches.push(data);
    }
  }

  // Fuzzy match
  for (const [keyword, data] of index) {
    if (this.similarityScore(keyword, concept) > 0.7) {
      matches.push(data);
    }
  }

  return {
    query: concept,
    matches,
    totalOccurrences: matches.reduce((sum, m) => sum + m.occurrences, 0),
    files: [...new Set(matches.flatMap(m => m.locations.map(l => l.file)))]
  };
}
```

---

## 🎯 Cost-Optimized Task Routing

### Agent Cost Model

```typescript
interface AgentCostModel {
  agentId: string;
  costPerTask: number; // in credits/cents
  intelligenceLevel: 1 | 2 | 3 | 4 | 5; // 1=simple, 5=complex
  capabilities: string[];
  averageExecutionTime: number; // milliseconds
  successRate: number; // 0-1
}

const agentCostRegistry: Map<string, AgentCostModel> = new Map([
  [
    'jules-cli',
    {
      agentId: 'jules-cli',
      costPerTask: 0.01, // Very cheap
      intelligenceLevel: 2, // Basic code analysis
      capabilities: ['file-operations', 'simple-analysis'],
      averageExecutionTime: 500,
      successRate: 0.95,
    },
  ],
  [
    'codebase-indexer',
    {
      agentId: 'codebase-indexer',
      costPerTask: 0.05, // Moderate
      intelligenceLevel: 3, // AST parsing, pattern detection
      capabilities: ['ast-parsing', 'dependency-analysis', 'synergy-detection'],
      averageExecutionTime: 5000,
      successRate: 0.9,
    },
  ],
  [
    'claude-3-haiku',
    {
      agentId: 'claude-3-haiku',
      costPerTask: 0.1, // API cost
      intelligenceLevel: 3, // Fast, lightweight
      capabilities: ['code-generation', 'simple-reasoning', 'text-processing'],
      averageExecutionTime: 2000,
      successRate: 0.92,
    },
  ],
  [
    'claude-3-sonnet',
    {
      agentId: 'claude-3-sonnet',
      costPerTask: 0.5, // Higher API cost
      intelligenceLevel: 4, // Strong reasoning
      capabilities: [
        'complex-reasoning',
        'code-generation',
        'architecture-design',
      ],
      averageExecutionTime: 5000,
      successRate: 0.95,
    },
  ],
  [
    'claude-3-opus',
    {
      agentId: 'claude-3-opus',
      costPerTask: 2.0, // Highest API cost
      intelligenceLevel: 5, // Strongest reasoning
      capabilities: [
        'advanced-reasoning',
        'complex-problem-solving',
        'creative-solutions',
      ],
      averageExecutionTime: 10000,
      successRate: 0.98,
    },
  ],
  [
    'gemini-flash',
    {
      agentId: 'gemini-flash',
      costPerTask: 0.08, // Competitive
      intelligenceLevel: 3,
      capabilities: ['fast-reasoning', 'multimodal', 'code-generation'],
      averageExecutionTime: 1500,
      successRate: 0.91,
    },
  ],
]);
```

### Cost-Optimized Routing Algorithm

```typescript
async routeTaskCostOptimized(task: Task): Promise<string> {
  const requiredCapabilities = task.requiresSkills || [];
  const requiredIntelligence = this.assessTaskComplexity(task);
  const budget = task.metadata?.budget || Infinity;

  // 1. Find all capable agents
  const capableAgents = Array.from(agentCostRegistry.values())
    .filter(agent =>
      // Has required capabilities
      requiredCapabilities.every(cap => agent.capabilities.includes(cap)) &&
      // Meets intelligence requirement
      agent.intelligenceLevel >= requiredIntelligence
    );

  if (capableAgents.length === 0) {
    throw new Error(`No agents capable of: ${requiredCapabilities.join(', ')}`);
  }

  // 2. Calculate cost-effectiveness score
  const scored = capableAgents.map(agent => ({
    agent,
    score: this.calculateCostEffectiveness(agent, requiredIntelligence, budget)
  }));

  // 3. Sort by score (higher is better)
  scored.sort((a, b) => b.score - a.score);

  // 4. Select best agent
  const selected = scored[0].agent;

  this.logger.log(
    `Task ${task.id} routed to ${selected.agentId} ` +
    `(cost: $${selected.costPerTask}, intelligence: ${selected.intelligenceLevel}/5, ` +
    `score: ${scored[0].score.toFixed(2)})`
  );

  return selected.agentId;
}

calculateCostEffectiveness(
  agent: AgentCostModel,
  requiredIntelligence: number,
  budget: number
): number {
  // Cost-effectiveness formula:
  // score = (successRate / cost) * intelligenceWeight * budgetFit

  const costScore = 1 / agent.costPerTask; // Lower cost = higher score
  const successScore = agent.successRate; // Higher success = higher score

  // Intelligence weight: Prefer just enough intelligence, not overkill
  const intelligenceOverhead = agent.intelligenceLevel - requiredIntelligence;
  const intelligenceWeight = intelligenceOverhead === 0 ? 1.5 : // Perfect match
                             intelligenceOverhead === 1 ? 1.2 : // Slight overkill
                             intelligenceOverhead === 2 ? 1.0 : // Moderate overkill
                             intelligenceOverhead < 0 ? 0 :      // Insufficient
                             0.8;                                // Too much overkill

  // Budget fit: Penalize if over budget
  const budgetFit = agent.costPerTask <= budget ? 1.0 : 0.1;

  // Speed bonus: Faster is better (but less important than cost)
  const speedBonus = 10000 / agent.averageExecutionTime; // Normalized ~1

  const score = (costScore * successScore * intelligenceWeight * budgetFit) + (speedBonus * 0.1);

  return score;
}

assessTaskComplexity(task: Task): number {
  // Simple heuristic to determine required intelligence
  const type = task.type.toLowerCase();

  if (type.includes('simple') || type.includes('copy') || type.includes('move')) {
    return 1; // Very simple
  }
  if (type.includes('parse') || type.includes('extract') || type.includes('format')) {
    return 2; // Basic processing
  }
  if (type.includes('analyze') || type.includes('detect') || type.includes('index')) {
    return 3; // Analysis/reasoning
  }
  if (type.includes('design') || type.includes('architect') || type.includes('optimize')) {
    return 4; // Design/architecture
  }
  if (type.includes('solve') || type.includes('invent') || type.includes('create')) {
    return 5; // Creative problem-solving
  }

  return 3; // Default to medium
}
```

### Example Routing Decisions:

```
Task: "Copy file from A to B"
├─ Required Intelligence: 1 (very simple)
├─ Capable Agents: jules-cli (1), all others
├─ Cost Analysis:
│  ├─ jules-cli: $0.01, score: 95.0 ✅ SELECTED
│  ├─ claude-haiku: $0.10, score: 9.2 (overkill)
│  └─ claude-opus: $2.00, score: 0.5 (way overkill)
└─ Result: Route to jules-cli (cheapest, sufficient)

Task: "Design new architecture for multi-tenant system"
├─ Required Intelligence: 5 (complex)
├─ Capable Agents: claude-opus (5), claude-sonnet (4 - insufficient)
├─ Cost Analysis:
│  ├─ claude-opus: $2.00, score: 49.0 ✅ SELECTED
│  └─ claude-sonnet: $0.50, score: 0 (insufficient intelligence)
└─ Result: Route to claude-opus (only capable agent)

Task: "Extract imports from TypeScript file"
├─ Required Intelligence: 2 (basic)
├─ Capable Agents: jules-cli (2), codebase-indexer (3), all LLMs
├─ Cost Analysis:
│  ├─ jules-cli: $0.01, score: 142.5 ✅ SELECTED
│  ├─ codebase-indexer: $0.05, score: 24.0 (slight overkill)
│  ├─ claude-haiku: $0.10, score: 13.8 (overkill)
└─ Result: Route to jules-cli (perfect match, cheapest)
```

---

## 📊 Orchestration Layer Validation

### Layer Hierarchy

```
Layer 1: Presentation (Frontend, UI)
Layer 2: API Gateway (Routing, Auth)
Layer 3: Business Logic (Services, Agents)
Layer 4: Data Access (Repositories, DAOs)
Layer 5: Infrastructure (Redis, Database, Queue)
```

### Validation Rules

```typescript
async validateOrchestrationLayers(): Promise<LayerValidationReport> {
  const violations: LayerViolation[] = [];

  const layerMap = await this.buildLayerMap();

  for (const [file, layer] of layerMap) {
    const imports = await this.extractImports(file);

    for (const importPath of imports) {
      const importedLayer = layerMap.get(importPath);

      if (importedLayer && !this.isValidLayerDependency(layer, importedLayer)) {
        violations.push({
          file,
          currentLayer: layer,
          imports: importPath,
          importedLayer,
          violation: `Layer ${layer} should not import from Layer ${importedLayer}`,
          fix: 'Refactor to use dependency injection or event bus'
        });
      }
    }
  }

  return {
    totalViolations: violations.length,
    violations,
    layerCohesion: 1 - (violations.length / layerMap.size)
  };
}

isValidLayerDependency(from: number, to: number): boolean {
  // Can only depend on same layer or layers below
  return to >= from;
}
```

---

## 🎯 Integration with Existing Systems

This enhanced indexer integrates with:

- **AgentInbox**: Sends health reports to architect inbox
- **Cost-Optimized Router**: Routes tasks to cheapest capable agent
- **Keyword Index**: Enables concept search across codebase
- **Visualizers**: Powers codebase health dashboard

---

**Version**: 2.0 - Enhanced with Health, Efficiency & Cost Optimization  
**Last Updated**: Dec 28, 2025
