# Gemini CLI Task Delegation - Restoration Roadmap
## Tasks to Delegate (Bottom-Up from Roadmap)

### CRITICAL: Terminal Setup Instructions
Use these exact commands in sequence for proper Gemini CLI delegation:

1. **Create Terminal with Focus**:
```bash
osascript -e 'tell application "Visual Studio Code" to activate' -e 'delay 1' -e 'tell application "System Events" to tell process "Code" to keystroke "p" using {command down, shift down}'
osascript -e 'delay 1' -e 'tell application "System Events" to keystroke "Terminal: Create New Terminal"' -e 'delay 0.5' -e 'tell application "System Events" to keystroke return'
```

2. **Launch Gemini CLI**:
```bash
osascript -e 'delay 2' -e 'tell application "System Events" to keystroke "gemini"' -e 'delay 0.5' -e 'tell application "System Events" to keystroke return'
```

3. **Wait for Gemini to Load**:
```bash
osascript -e 'delay 5'  # Wait for full Gemini startup
```

---

## TASK DELEGATION LIST (Bottom-Up Priority)

### 1. DEPLOYMENT & PRODUCTION READINESS (Section 18) - PRIORITY 1
**Task for Gemini Terminal 1:**
```
URGENT: Production Configuration Audit

Analyze The New Fuse platform for production readiness:
1. Audit all environment configuration files (.env, .env.example, config/)
2. Verify database connection configuration across all apps
3. Check API endpoint configuration consistency
4. Identify missing production environment variables
5. Review deployment scripts in scripts/ directory
6. Assess health check endpoints in all applications
7. Generate production readiness checklist with specific gaps identified

Report back with concrete findings and deployment blockers.
```

### 2. PROMPT TEMPLATING & LLM INTEGRATION (Section 17) - PRIORITY 2
**Task for Gemini Terminal 2:**
```
URGENT: Prompt Templating System Analysis

Deep dive into packages/prompt-templating/ system:
1. Analyze current prompt template engine implementation
2. Document existing template formats and capabilities
3. Map LLM integration points (Claude, Gemini, others)
4. Identify multi-agent prompt coordination mechanisms
5. Review context-aware template selection logic
6. Test dynamic prompt generation capabilities
7. Assess prompt version management system

Create comprehensive technical documentation of current capabilities and gaps.
```

### 3. FEATURE MANAGEMENT SYSTEM (Section 16) - PRIORITY 3
**Task for Gemini Terminal 3:**
```
URGENT: Feature Management Ecosystem Audit

Comprehensive analysis of feature management packages:
- packages/features/ (core feature management)
- packages/feature-tracker/ (tracking system)  
- packages/feature-suggestions/ (suggestion system)

Tasks:
1. Map feature toggle system architecture
2. Test runtime feature flag management capabilities
3. Document A/B testing infrastructure
4. Analyze user-based feature rollout mechanisms
5. Review feature usage analytics implementation
6. Assess feature suggestion pipeline workflow
7. Test integration with agent workflows

Provide detailed technical assessment and implementation gaps.
```

### 4. FAIRTABLE ECOSYSTEM (Section 15) - PRIORITY 4
**Task for Gemini Terminal 4:**
```
URGENT: FairTable System Comprehensive Review

Analyze the 5-package FairTable ecosystem:
- packages/fairtable-core/
- packages/fairtable-components/
- packages/fairtable-utils/
- packages/fairtable-adapters/
- Additional fairtable package (identify)

Tasks:
1. Test table rendering and virtualization performance
2. Verify data sorting, filtering, pagination functionality
3. Check real-time data update capabilities
4. Test export/import functionality
5. Document custom cell renderers and editors
6. Analyze agent data visualization integration
7. Test workflow data management features

Report performance benchmarks and functionality gaps.
```

### 5. INTEGRATION TESTS & VERIFICATION (Section 14) - PRIORITY 5
**Task for Gemini Terminal 5:**
```
URGENT: Integration Test Infrastructure Assessment

Analyze packages/integration-tests/ and testing framework:
1. Run comprehensive integration test suite
2. Execute end-to-end workflow testing
3. Test agent communication protocols
4. Verify browser automation testing
5. Check API integration test coverage
6. Run performance benchmarking suite
7. Execute build verification commands:
   - bun install
   - bun run build
   - bun run typecheck
   - bun run lint
   - bun run test:integration
   - bun run test:e2e

Document test results, failures, and infrastructure gaps.
```

---

## DELEGATION EXECUTION PROTOCOL

For each terminal instance:
1. **Create dedicated terminal** using VSCode API commands
2. **Launch Gemini CLI** with proper timing delays
3. **Wait for full Gemini startup** (5 second delay minimum)
4. **Focus terminal properly** before sending tasks
5. **Send specific task message** with clear deliverables
6. **Track terminal PID** for each Gemini instance

### CRITICAL SAFETY CHECKS:
- NEVER type into own input field instead of Gemini terminal
- ALWAYS use osascript commands for text sending to terminals
- NEVER use coordinate clicking (unreliable)
- ONLY send commands after proper terminal focus
- Track each terminal's process ID individually

### EXPECTED DELIVERABLES:
Each Gemini instance should provide:
- Detailed technical analysis report
- Specific implementation gaps identified
- Concrete next steps with priority ranking
- Test results and performance metrics
- Documentation of current vs. required state

---

## MONITORING DELEGATION PROGRESS

Check status of each Gemini terminal:
1. Terminal 1 (Production Readiness): [Status: Pending]
2. Terminal 2 (Prompt Templating): [Status: Pending]  
3. Terminal 3 (Feature Management): [Status: Pending]
4. Terminal 4 (FairTable Ecosystem): [Status: Pending]
5. Terminal 5 (Integration Tests): [Status: Pending]

Update this document as each terminal reports back with findings.