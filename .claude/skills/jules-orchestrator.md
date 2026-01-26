# Jules Orchestrator Skill

**Skill Name**: `jules-orchestrator`
**Version**: 1.0.0
**Purpose**: Orchestrate full work management cycle with Jules CLI sessions
**When to Use**: For complex, multi-phase development work requiring parallel Jules execution

---

## Overview

This skill manages the complete lifecycle of delegating work to Jules CLI, from planning through testing and deployment. It handles:

- Task breakdown and planning
- Parallel Jules session launches
- Session monitoring and status tracking
- Results review and approval
- Automated testing and validation
- Git commits and merging
- Comprehensive documentation

---

## Activation

```
/jules-orchestrator <task-description>
```

Or for explicit phase control:

```
/jules-orchestrator --phases 6 <task-description>
```

---

## Workflow Phases

### Phase 1: Planning & Task Breakdown

**What It Does:**
1. Analyzes the user's request
2. Explores codebase for context
3. Creates detailed task breakdown
4. Identifies dependencies and critical files
5. Creates execution plan with phases

**Outputs:**
- `~/.claude/plans/[session-name].md` - Comprehensive plan
- Task phase definitions (2-10 phases typically)
- Success criteria for each phase

**Agent Used**: `Plan` agent for exploration and design

---

### Phase 2: Jules Session Orchestration

**What It Does:**
1. Creates detailed prompts for each phase
2. Launches Jules sessions in parallel (up to 6 concurrent)
3. Tracks session IDs and URLs
4. Creates documentation:
   - `docs/JULES_SESSIONS_SUMMARY.md`
   - Session tracking spreadsheet

**Example Launch Pattern:**
```bash
jules new --repo <repo-name> "<detailed-phase-description>"
```

**Session Prompt Template:**
```
PHASE X: [Title]

**Objective**: [Clear goal statement]

**Scope**:
- File: [specific file paths]
- Component: [components to create/modify]

**Requirements**:
1. [Specific requirement]
2. [Specific requirement]
...

**Implementation Details**:
- [Technical approach]
- [Patterns to follow]
- [Standards to maintain]

**Success Criteria**:
- [Verification step 1]
- [Verification step 2]
...

**Context**:
[Any critical background information]
```

---

### Phase 3: Session Monitoring

**What It Does:**
1. Polls session status every 2-5 minutes
2. Tracks completion states:
   - ⏳ In Progress
   - ⏸️ Awaiting User Feedback (needs approval)
   - ✅ Completed
   - ❌ Failed
3. Alerts when sessions need attention
4. Estimates completion time

**Monitoring Command:**
```bash
jules remote list --session | grep -E "(session-id-1|session-id-2|...)"
```

**Status Updates:**
- Real-time progress tracking
- ETA calculations
- Blockers identification

---

### Phase 4: Results Review & Application

**What It Does:**
1. Pulls completed session results:
   ```bash
   jules remote pull --session [SESSION_ID]
   ```
2. Reviews diff for quality:
   - Code style consistency
   - Type safety improvements
   - Error handling patterns
   - Accessibility enhancements
3. Applies changes:
   ```bash
   jules remote pull --session [SESSION_ID] --apply
   ```
4. Handles approval for "Awaiting Feedback" sessions:
   - Provides session URLs for manual approval
   - Waits for approval completion
   - Resumes once approved

**Quality Checks:**
- TypeScript strict mode compliance
- No new console.log statements
- Proper error boundaries
- Loading states implemented
- Accessibility attributes present

---

### Phase 5: Testing & Validation

**What It Does:**
1. Runs TypeScript type checking:
   ```bash
   cd apps/frontend && pnpm run type-check
   ```
2. Runs production build:
   ```bash
   pnpm run build
   ```
3. Identifies new vs pre-existing errors
4. Runs tests if available:
   ```bash
   pnpm run test
   ```
5. Manual testing checklist:
   - Critical user journeys
   - Error states
   - Loading states
   - Form validation

**Failure Handling:**
- If type-check fails on modified files: Create fix session
- If build fails: Investigate and fix
- If tests fail: Analyze and address

---

### Phase 6: Git Commit & Merge

**What It Does:**
1. Reviews all changes:
   ```bash
   git status
   git diff --stat
   ```
2. Creates meaningful commits per phase:
   ```bash
   git add [phase-files]
   git commit -m "feat/fix: [clear message]

   Phase X: [Description]
   - [Change 1]
   - [Change 2]

   Implemented by Jules CLI (Session: [ID])

   Co-Authored-By: Jules CLI <jules@google.com>"
   ```
3. Pushes to remote:
   ```bash
   git push origin main
   ```
4. Handles merge conflicts if needed
5. Updates documentation

**Commit Message Pattern:**
- Type: `feat`, `fix`, `refactor`, `docs`, `test`
- Scope: `(frontend)`, `(backend)`, `(api)`
- Clear description
- Jules session reference
- Co-authorship attribution

---

### Phase 7: Documentation & Reporting

**What It Does:**
1. Creates comprehensive documentation:
   - **EXECUTION_SUMMARY.md**: Overall execution summary
   - **docs/JULES_SESSIONS_SUMMARY.md**: Session tracking
   - **docs/[FEATURE]_STATUS.md**: Feature-specific status
2. Updates README or relevant docs
3. Generates metrics report:
   - Lines added/removed
   - Files modified
   - Features completed
   - Time saved estimate
4. Creates GitHub issue if needed
5. Commits documentation:
   ```bash
   git add docs/ *.md
   git commit -m "docs: Add execution documentation"
   git push origin main
   ```

**Documentation Template Includes:**
- ✅ What was accomplished
- 🔄 What's in progress
- ⏸️ What needs approval
- 📊 Impact metrics
- ⏭️ Next steps
- 🔗 Session links

---

### Phase 8: Post-Execution Cleanup

**What It Does:**
1. Archives session logs
2. Updates todo list
3. Cleans up temporary files
4. Sends completion notification
5. Prepares for next iteration:
   - Identifies remaining work
   - Suggests follow-up phases
   - Updates project roadmap

---

## Configuration Options

### Basic Usage
```
/jules-orchestrator "Fix frontend production readiness issues"
```

### Advanced Usage
```
/jules-orchestrator --phases 6 --parallel 4 --auto-apply "Implement feature X"
```

**Parameters:**
- `--phases N`: Number of phases to break work into (default: auto-detect)
- `--parallel N`: Max concurrent Jules sessions (default: 6)
- `--auto-apply`: Auto-apply completed sessions without review (default: false)
- `--auto-commit`: Auto-commit applied changes (default: false)
- `--branch NAME`: Work on specific branch (default: main)
- `--docs-only`: Only generate documentation, skip execution
- `--resume SESSION_ID`: Resume from a specific session

### Environment Variables
```bash
JULES_REPO="owner/repo"              # Repository to use
JULES_AUTO_APPROVE="false"           # Auto-approve all sessions
JULES_NOTIFICATION_URL=""            # Webhook for notifications
JULES_MAX_RETRIES="3"                # Max retries on failure
```

---

## Decision Tree

```
User Request
    ↓
Is it complex multi-phase work? → YES → Use jules-orchestrator
    ↓ NO
Is it a single task? → YES → Use direct jules new command
    ↓
[jules-orchestrator activated]
    ↓
Phase 1: Planning
    ↓
Create task breakdown (2-10 phases)
    ↓
Phase 2: Launch Sessions (parallel)
    ↓
Monitor until complete or needs approval
    ↓
Has "Awaiting Feedback"? → YES → Notify user, wait for approval
    ↓ NO
Phase 4: Pull & Review Results
    ↓
Quality check passes? → NO → Create fix session
    ↓ YES
Phase 4: Apply Changes
    ↓
Phase 5: Test & Validate
    ↓
Tests pass? → NO → Fix and retry
    ↓ YES
Phase 6: Commit & Push
    ↓
Phase 7: Generate Documentation
    ↓
Phase 8: Cleanup & Report
    ↓
Done! ✅
```

---

## Examples

### Example 1: Frontend Production Readiness

**Command:**
```
/jules-orchestrator "Make frontend production-ready: fix validation errors, remove mock data, add real metrics"
```

**Execution:**
1. Plans 6 phases:
   - Phase 1: Agent Management
   - Phase 2: Workflows
   - Phase 3: API Settings
   - Phase 4: Dashboard Metrics
   - Phase 5: Mock Data Removal
   - Phase 6: Code Quality

2. Launches 6 Jules sessions in parallel

3. Monitors progress:
   - Phase 1, 4, 5: Complete in 30 min
   - Phase 2: In progress (6-8 hours)
   - Phase 3, 6: Awaiting approval

4. Applies completed phases (1, 4, 5)

5. Tests and commits to main

6. Generates comprehensive documentation

**Result:** 50% complete in 1 hour, remaining 50% in progress

---

### Example 2: API Endpoint Implementation

**Command:**
```
/jules-orchestrator --phases 4 "Implement user profile API with CRUD operations"
```

**Execution:**
1. Plans 4 phases:
   - Phase 1: Database schema & migrations
   - Phase 2: API endpoints (create, read, update, delete)
   - Phase 3: Validation & error handling
   - Phase 4: Tests & documentation

2. Launches sequentially (dependency chain)

3. Each phase completes before next starts

4. Auto-applies and tests each phase

5. Commits incrementally

**Result:** Full API implementation with tests in 4-6 hours

---

### Example 3: Bug Fix Sweep

**Command:**
```
/jules-orchestrator --parallel 3 "Fix all TypeScript errors in admin components"
```

**Execution:**
1. Scans admin components for errors

2. Groups into 3 logical phases:
   - Phase 1: Type definitions
   - Phase 2: Component prop types
   - Phase 3: Event handlers

3. Launches 3 sessions in parallel

4. All complete in 2-3 hours

5. Tests and commits as single fix

**Result:** All admin TypeScript errors resolved

---

## Error Handling

### Session Failures

**If Jules session fails:**
1. Capture error message
2. Analyze failure reason:
   - Compilation error → Fix and relaunch
   - Missing dependency → Add and relaunch
   - Unclear requirements → Refine prompt and relaunch
3. Retry up to 3 times
4. If still failing, notify user with details

### Build Failures

**If build fails after applying:**
1. Identify breaking changes
2. Review Jules diff
3. Create hotfix session targeting specific issue
4. Apply hotfix
5. Retry build

### Test Failures

**If tests fail:**
1. Identify failing tests
2. Determine if:
   - Pre-existing failure → Document and skip
   - New failure → Create fix session
3. Apply fix
4. Rerun tests

### Merge Conflicts

**If git push fails:**
1. Pull latest changes
2. Auto-merge if possible
3. If conflict:
   - Notify user
   - Provide conflict resolution guide
   - Wait for manual resolution
4. Retry push

---

## Success Metrics

**Tracks:**
- Total phases planned
- Phases completed
- Phases in progress
- Phases failed
- Total time elapsed
- Estimated time remaining
- Lines of code changed
- Files modified
- Features completed
- Tests written/passing
- Commits created

**Reports:**
- Time saved vs manual development
- Quality improvements
- Automation efficiency
- User intervention points

---

## Integration with Other Agents

### Collaborative Agents:

**frontend-debugger-agent**: Called when Jules encounters React/TypeScript issues

**skill-webapp-testing**: Launched after all phases complete for E2E testing

**technical-seo-auditor-agent**: Runs performance audits post-completion

**legal-compliance-agent**: Generates required legal documents

**content-writer-agent**: Polishes user-facing text after implementation

---

## Best Practices

### Do ✅

- Break complex work into 2-10 logical phases
- Launch independent phases in parallel
- Review diffs before applying
- Test after each phase application
- Commit incrementally with clear messages
- Document as you go
- Handle approvals promptly
- Monitor session progress

### Don't ❌

- Launch too many sessions (>10) at once
- Apply changes without review
- Skip testing after application
- Commit all changes in one huge commit
- Ignore "Awaiting Feedback" sessions
- Forget to document
- Auto-apply without understanding changes

---

## Troubleshooting

### "Session stuck in 'In Progress'"

**Solution:** Check session URL for details, may need to approve a plan

### "Cannot apply patch"

**Solution:** Repository may have changed, pull latest and retry

### "Type errors after applying"

**Solution:** Pre-existing errors in other files, document separately

### "Tests failing"

**Solution:** Determine if new failures or pre-existing, create fix session

### "Git push rejected"

**Solution:** Pull latest, resolve conflicts, retry push

---

## Output Files Created

1. `~/.claude/plans/[session-name].md` - Execution plan
2. `docs/JULES_SESSIONS_SUMMARY.md` - Session tracking
3. `docs/[FEATURE]_STATUS.md` - Feature status
4. `EXECUTION_SUMMARY.md` - Overall summary
5. `.jules/logs/[session-id].log` - Session logs (optional)
6. Git commits with Jules attribution

---

## Future Enhancements

- [ ] Automatic retry with refined prompts
- [ ] Session cost tracking (API usage)
- [ ] Parallel branch strategy (one per phase)
- [ ] Auto-generated PR descriptions
- [ ] Slack/Discord notifications
- [ ] Session analytics dashboard
- [ ] AI-powered diff review
- [ ] Automatic test generation
- [ ] Rollback capabilities
- [ ] Session replay/debugging

---

## Version History

**1.0.0** (2026-01-25)
- Initial skill creation
- Full lifecycle orchestration
- Parallel session management
- Automated testing and validation
- Git integration
- Comprehensive documentation

---

**Skill Author**: Claude Code + User Feedback
**Maintained By**: The New Fuse Team
**License**: MIT
