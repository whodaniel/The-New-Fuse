---
description:
  'Delegate complex coding tasks to Google Jules CLI agent for parallel
  asynchronous execution. Perfect for large-scale refactoring, website
  improvements, and systematic code quality enhancements.'
category: 'development-automation'
agent: 'jules-cli-agent'
---

# Delegate to Jules CLI Agent

Invoke the Jules CLI agent to handle complex, time-consuming coding tasks
asynchronously across multiple parallel sessions.

## Usage

```
/delegate-to-jules <task-type> <task-descriptions>
```

## Arguments

- **task-type**: The type of delegation pattern to use
  - `parallel-specialized`: Launch multiple targeted tasks in parallel
  - `batch-improvements`: Systematic repository-wide improvements
  - `single-complex`: One large complex task

- **task-descriptions**: Detailed descriptions of tasks to delegate (one per
  session)

## Execution Instructions

You are delegating tasks to the **Jules CLI agent**, Google's asynchronous
coding agent. Follow this protocol:

### Step 1: Analyze Task Requirements

- Review the provided task descriptions
- Determine optimal number of parallel sessions
- Identify task dependencies and ordering
- Validate repository context (current repo: whodaniel/fuse)

### Step 2: Prepare Effective Task Descriptions

For each task, create a detailed description including:

- **Specific scope**: Exact files, pages, or modules to work on
- **Clear objectives**: What needs to be accomplished
- **Quality standards**: Performance targets, accessibility requirements, etc.
- **Reference materials**: Existing docs, logs, or patterns to follow
- **Deliverables**: Expected outputs (code, docs, test results)
- **Success criteria**: How to validate completion

### Step 3: Launch Jules Sessions

Execute Jules CLI commands to create sessions:

```bash
jules new --repo whodaniel/fuse "[detailed task description 1]"
jules new --repo whodaniel/fuse "[detailed task description 2]"
...
```

### Step 4: Track Sessions

Create a tracking document with:

- Session IDs and descriptions
- Direct monitoring URLs
- Status tracking
- Next steps for retrieval

### Step 5: Report Results

Provide user with:

- ✅ Session summary (IDs, descriptions, URLs)
- 📊 Status overview
- 📁 Documentation reference
- ⏭️ Next actions (monitoring and retrieval)

## Example 1: Website Quality Improvements (Parallel Specialized)

```
/delegate-to-jules parallel-specialized "
1. Fix all broken navigation links and dead-end hrefs - test each link from QA log, update documentation
2. Implement WCAG 2.1 Level AA accessibility - semantic HTML, ARIA labels, keyboard navigation
3. Optimize frontend performance for Lighthouse 90+ - lazy loading, bundle optimization, image optimization
4. Enhance auth pages for world-class UX - form validation, loading states, error handling
5. Fix layout and DOM structure issues - overflow, responsive breakpoints, consistent spacing
"
```

## Example 2: Systematic Code Quality (Batch Improvements)

```
/delegate-to-jules batch-improvements "
1. Add TypeScript strict mode across all files - fix type errors, add missing types
2. Implement error boundaries at all route levels - graceful error handling, user feedback
3. Standardize API error handling - consistent error messages, retry logic, timeout handling
4. Add loading states to all async operations - spinners, skeletons, progress indicators
"
```

## Example 3: Large Complex Task (Single)

```
/delegate-to-jules single-complex "
Complete authentication system overhaul:
- Implement OAuth 2.0 with Google, GitHub providers
- Add 2FA with TOTP support
- Create session management with Redis
- Implement RBAC with permissions
- Add comprehensive auth testing
- Update documentation
Target: Production-ready, OWASP-compliant auth system
"
```

## Task Template for Jules

When creating Jules task descriptions, use this format:

```markdown
[ACTION] [SCOPE] [SPECIFIC DETAILS]

**Objective**: [Clear goal statement]

**Scope**:

- Files/modules to modify: [List]
- Pages/routes affected: [List]

**Requirements**:

1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

**Standards**:

- [Quality standard 1]: [Target metric]
- [Quality standard 2]: [Target metric]

**Reference**:

- Follow patterns from: [File/module]
- See documentation: [Doc path]
- Use QA log: [Log path]

**Deliverables**:

- [ ] [Expected output 1]
- [ ] [Expected output 2]
- [ ] [Expected output 3]

**Success Criteria**:

- [How to validate completion]
```

## Best Practices

### DO ✅

- Provide detailed, specific task descriptions
- Reference existing code patterns and docs
- Set measurable success criteria
- Include context (QA logs, architecture docs)
- Launch related tasks in parallel
- Create tracking documentation
- Review results before applying

### DON'T ❌

- Use vague descriptions like "fix the website"
- Forget to specify target files/modules
- Skip quality standards and metrics
- Launch too many sessions (> 20 concurrent)
- Apply patches without reviewing
- Ignore failed sessions

## Monitoring Sessions

After delegation, monitor sessions:

```bash
# List all sessions
jules remote list --session

# View specific session
https://jules.google.com/session/[SESSION_ID]

# Pull results when complete
jules remote pull --session [SESSION_ID]

# Apply approved changes
jules remote pull --session [SESSION_ID] --apply
```

## Common Use Cases

### 1. Website Overhaul (10 parallel tasks)

- Navigation fixes
- Layout/responsive issues
- Performance optimization
- Accessibility improvements
- SEO enhancements
- Error handling
- Design consistency
- Missing page implementations
- Auth UX improvements
- User flow completion

### 2. Codebase Modernization (6 parallel tasks)

- TypeScript migration
- React hooks conversion
- API modernization
- Test coverage addition
- Documentation generation
- Dependency updates

### 3. Quality Improvements (8 parallel tasks)

- Error handling standardization
- Loading state additions
- Empty state implementations
- Form validation enhancement
- Security hardening
- Performance profiling
- Accessibility auditing
- Code style consistency

## Integration with TNF

This slash command integrates with:

- **Jules CLI Agent**: Executes the delegated tasks
- **Agent Registry**: Tracks Jules as external agent
- **Task Tracker**: Documents all launched sessions
- **Orchestrator Agent**: Can be used in multi-agent workflows

## Output Format

After executing this command, you will receive:

```markdown
# Jules Task Delegation Summary

## 🚀 Sessions Launched: [COUNT]

### Session Details

1. **Navigation & Links** (ID: 11929188233130826202)
   - Status: ⏳ Running
   - URL: https://jules.google.com/session/11929188233130826202
   - Task: Fix all broken navigation links

2. **Layout & Responsive** (ID: 7823214629716985215)
   - Status: ⏳ Running
   - URL: https://jules.google.com/session/7823214629716985215
   - Task: Fix layout and DOM structure issues

[... additional sessions ...]

## 📊 Status Overview

- ⏳ Running: X sessions
- ✅ Completed: X sessions
- ❌ Failed: X sessions

## 📁 Documentation

Tracking document created: `docs/JULES_SESSIONS_SUMMARY.md`

## ⏭️ Next Steps

1. Monitor sessions via provided URLs
2. Check status: `jules remote list --session`
3. Pull results when complete: `jules remote pull --session [ID]`
4. Review and apply approved changes
5. Test locally before production deployment

## 🔗 Quick Links

[List of all session URLs]
```

## Notes

- Jules requires internet connectivity
- Sessions run asynchronously (non-blocking)
- Results available via pull command when complete
- Always review before applying patches
- Can handle up to 50 concurrent sessions
- Each session auto-approves or awaits plan approval
- Failed sessions can be relaunched with refined instructions
