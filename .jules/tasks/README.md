# Jules CLI Task Queue

This directory contains task prompts for Jules CLI agent instances. Each task
file can be sent to a separate Jules instance for parallel execution.

## How to Use

1. Open each `JULES_TASK_*.md` file
2. Copy the content to the Jules Bridge extension or JULES_PROMPT.md
3. Validate and send to a Jules instance
4. Each task can run in parallel with others (up to 16 instances)

## Task Categories

### 🔧 Database/Drizzle Migration (Priority: HIGH)

| Task                                               | Description                                 | Complexity |
| -------------------------------------------------- | ------------------------------------------- | ---------- |
| [01](JULES_TASK_01_drizzle_user_repository.md)     | Create Drizzle UserRepository               | ⭐⭐⭐     |
| [02](JULES_TASK_02_drizzle_workflow_repository.md) | Create Drizzle WorkflowRepository           | ⭐⭐⭐     |
| [03](JULES_TASK_03_drizzle_task_repository.md)     | Create Drizzle Task & Pipeline Repositories | ⭐⭐⭐     |
| [04](JULES_TASK_04_drizzle_chat_repository.md)     | Create Drizzle Chat & Message Repositories  | ⭐⭐⭐     |

### 🔥 Core Package Migration (Priority: CRITICAL)

| Task                                          | Description                            | Complexity |
| --------------------------------------------- | -------------------------------------- | ---------- |
| [05](JULES_TASK_05_core_prisma_migration.md)  | Migrate Core Prisma Service to Drizzle | ⭐⭐⭐⭐   |
| [06](JULES_TASK_06_core_messaging_service.md) | Migrate MessagingService to Drizzle    | ⭐⭐⭐⭐   |

### 📋 Code Quality & Validation (Priority: MEDIUM)

| Task                                           | Description                             | Complexity |
| ---------------------------------------------- | --------------------------------------- | ---------- |
| [07](JULES_TASK_07_typescript_strict_audit.md) | TypeScript Strict Mode Audit            | ⭐⭐⭐     |
| [12](JULES_TASK_12_test_coverage_database.md)  | Add Unit Tests for Drizzle Repositories | ⭐⭐⭐⭐   |
| [14](JULES_TASK_14_code_quality_lint.md)       | Lint and Format New Drizzle Files       | ⭐⭐       |

### 🎨 Frontend (Priority: MEDIUM)

| Task                                            | Description                      | Complexity |
| ----------------------------------------------- | -------------------------------- | ---------- |
| [08](JULES_TASK_08_frontend_agent_dashboard.md) | Create Agent Dashboard Component | ⭐⭐⭐⭐   |

### 🔌 Backend/API (Priority: MEDIUM)

| Task                                             | Description                             | Complexity |
| ------------------------------------------------ | --------------------------------------- | ---------- |
| [09](JULES_TASK_09_redis_agent_registry.md)      | Audit & Improve Redis Agent Registry    | ⭐⭐⭐⭐⭐ |
| [10](JULES_TASK_10_api_agent_endpoints.md)       | Create/Audit Agent Management Endpoints | ⭐⭐⭐⭐   |
| [11](JULES_TASK_11_workflow_execution_engine.md) | Audit Workflow Execution Engine         | ⭐⭐⭐⭐⭐ |

### 📖 Documentation (Priority: LOW)

| Task                                        | Description            | Complexity |
| ------------------------------------------- | ---------------------- | ---------- |
| [13](JULES_TASK_13_documentation_update.md) | Update Package READMEs | ⭐⭐       |

### 🔒 Security (Priority: HIGH)

| Task                                    | Description                     | Complexity |
| --------------------------------------- | ------------------------------- | ---------- |
| [15](JULES_TASK_15_security_audit.md)   | Security Audit - Sensitive Data | ⭐⭐⭐⭐⭐ |
| [16](JULES_TASK_16_dependency_audit.md) | Dependency Security Audit       | ⭐⭐⭐     |

## Recommended Execution Order

For maximum efficiency, run these task groups in parallel:

**Batch 1 (Database)**: Tasks 01, 02, 03, 04 (can all run in parallel)

**Batch 2 (Core Migration)**: Tasks 05, 06 (after Batch 1 completes)

**Batch 3 (Quality + Frontend + Backend)**: Tasks 07, 08, 09, 10, 11, 12, 14
(can all run in parallel)

**Batch 4 (Documentation + Security)**: Tasks 13, 15, 16 (can all run in
parallel)

## Notes

- Each task is self-contained with clear success criteria
- Tasks include discovery steps (grep, find, ls) so Jules can understand context
- All tasks reference the current WIP branch state
- Commit after each successful task completion
