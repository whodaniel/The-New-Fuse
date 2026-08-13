module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^../types/WorkflowTypes$': '<rootDir>/src/types/WorkflowTypes.ts',
    '^../engine/WorkflowEngine$': '<rootDir>/src/engine/WorkflowEngine.ts',
    '^../executor/WorkflowExecutor$': '<rootDir>/src/executor/WorkflowExecutor.ts',
    '^../queue/WorkflowQueue$': '<rootDir>/src/queue/WorkflowQueue.ts',
    '^../telemetry/TelemetryService$': '<rootDir>/src/telemetry/TelemetryService.ts',
    '^@the-new-fuse/relay-core$': '<rootDir>/../../packages/relay-core/src/index.ts',
    '^@the-new-fuse/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@the-new-fuse/agent$': '<rootDir>/../../packages/agent/src/index.ts',
    '^@the-new-fuse/mcp-core$': '<rootDir>/../../packages/mcp-core/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
