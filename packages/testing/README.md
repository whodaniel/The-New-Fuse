# Automated Testing Suite for Agent Workflows

Comprehensive integration testing framework for The New Fuse agent workflow pipeline with advanced
test orchestration, scheduling, and analytics.

## Overview

This package provides a complete automated testing solution for agent workflows, including:

- **Integration tests** for entire agent workflow pipeline
- **Test orchestration** with parallel execution and scheduling
- **Performance testing** under load conditions
- **Error handling** and recovery mechanism testing
- **Agent communication** (A2A protocol) testing
- **Test analytics** and comprehensive reporting
- **CI/CD integration** with automated test scheduling

## Features

### 🔄 **Comprehensive Test Scenarios**

- Agent registration and discovery
- Simple and complex workflow execution
- Parallel task processing
- Agent-to-Agent communication
- Error handling and recovery
- Load and performance testing

### 🚀 **Advanced Test Orchestration**

- Parallel test execution
- Configurable timeout and retry mechanisms
- Test scheduling with cron expressions
- Real-time test monitoring
- Automated cleanup and data management

### 📊 **Analytics and Reporting**

- Test success/failure analytics
- Performance trend analysis
- Detailed test reports with recommendations
- Historical data tracking
- Top failure identification

### 🔧 **Integration Points**

- Redis cache testing
- Job queue performance validation
- WebSocket connection testing
- A2A protocol efficiency testing
- Database performance monitoring

## Architecture

```
packages/testing/
├── src/
│   ├── agent-workflow.test-suite.ts    # Core test scenarios
│   ├── test-runner.service.ts          # Test orchestration service
│   ├── test-runner.controller.ts       # REST API endpoints
│   └── testing.module.ts               # NestJS module configuration
├── e2e/                                # End-to-end tests
├── performance/                        # Performance testing
└── docs/                               # Testing documentation
```

## Installation

```bash
pnpm install
```

## Configuration

Set the following environment variables:

```env
# Test Configuration
TEST_TIMEOUT=300000
TEST_RETRY_ATTEMPTS=3
TEST_PARALLEL=true
TEST_MAX_CONCURRENT=3
TEST_ENVIRONMENT=development
TEST_CLEANUP=true
TEST_VERBOSE=false

# Redis Test Database
REDIS_TEST_DB=15

# Test Scheduling
TEST_SCHEDULE_ENABLED=true
```
