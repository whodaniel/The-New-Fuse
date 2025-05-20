# Integration Testing Guide

## Test Coverage
Integration tests cover:
- Service communication
- Workflow execution
- State synchronization
- Resource management
- Error handling

## Running Tests
```bash
# Run all integration tests
yarn test:integration

# Run specific test suite
yarn test:integration --suite=workflow

# Run with coverage
yarn test:integration --coverage
```

## Test Environment
- Docker Compose configuration
- Mock services
- Test data sets
- Environment variables

## Continuous Integration
- GitHub Actions workflow
- Automated test execution
- Coverage reporting
- Performance benchmarks