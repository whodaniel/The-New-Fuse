"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataGenerator = exports.MockInterceptor = exports.MockMiddleware = exports.MockCommandHandler = exports.EventHeavyCommand = exports.string = exports.mockAuthContext = void 0;
const uuid_1 = require("uuid");
const interfaces_1 = require("../interfaces");
const base_1 = require("../base");
/**
 * Test fixtures and mock data for command architecture tests
 */
// Mock Auth Context
exports.mockAuthContext = {
    isAuthenticated: true,
    roles: ['user', 'admin'],
    permissions: ['read', 'write', 'execute'],
    claims: {
        userId: 'test-user-123',
        tenantId: 'test-tenant-456',
        // Mock Command Context
        const: createMockCommandContext = (overrides = {}) => ({
            executionId: (0, uuid_1.v4)(),
            userId: 'test-user-123',
            sessionId: 'test-session-456',
            timestamp: new Date(),
            data: {},
            auth: exports.mockAuthContext,
            correlationId: 'test-correlation-789',
            causationId: 'test-causation-101',
            ...overrides
        }),
        // Mock Command Metadata
        const: mockCommandMetadata, CommandMetadata: interfaces_1.CommandMetadata = {
            version: '1.0.0',
            name: 'TestCommand',
            description: 'A test command for unit testing',
            category: 'test',
            tags: ['unit', 'test', 'mock'],
            customProperty: 'custom-value'
        },
        // Mock Domain Event
        const: createMockDomainEvent = (overrides = {}) => ({
            id: (0, uuid_1.v4)(),
            type: 'TestEvent',
            data: { testData: 'test-value' },
            metadata: {
                commandId: 'test-command-id',
                aggregateId: 'test-aggregate-id',
                aggregateType: 'TestAggregate',
                eventNumber: 1,
                correlationId: 'test-correlation-id',
                causationId: 'test-causation-id'
            },
            timestamp: new Date(),
            version: '1.0.0',
            ...overrides
        }),
        // Mock Command Result
        const: createMockCommandResult = (success = true, data, error) => ({
            success,
            data,
            error,
            metadata: {
                executionTime: 100,
                completedAt: new Date(),
                eventCount: 1,
                stats: {
                    executionTime: 100,
                    memoryUsage: 1024
                }
            },
            events: success ? [createMockDomainEvent()] : []
        }),
        // Test Command Implementation
        class: TestCommand, extends: base_1.BaseCommand < { input: exports.string },
    }
};
 > {
    constructor(input = 'test-input') {
        super('TestCommand', { input }, mockCommandMetadata);
    },
    async executeInternal(context) {
        // Simulate some processing
        await new Promise(resolve => setTimeout(resolve, 10));
        // Add a domain event
        this.addEvent('TestExecuted', {
            input: this.data.input,
            processedAt: new Date()
        });
        return {
            output: `processed-${this.data.input}
    };
  }

  protected async validateData(context: ICommandContext) {
    const errors = [];

    if (!this.data.input || this.data.input.trim() === '') {
      errors.push(this.createValidationError(
        'REQUIRED_INPUT',
        'Input is required and cannot be empty',
        'input',
        this.data.input
      ));
    }

    if (this.data.input && this.data.input.length > 100) {
      errors.push(this.createValidationError(
        'INPUT_TOO_LONG',
        'Input cannot be longer than 100 characters',
        'input',
        this.data.input
      ));
    }

    return errors;
  }
}

// Failing Test Command
export class FailingCommand extends BaseCommand<{}, never> {
  constructor() {
    super('FailingCommand', {}, mockCommandMetadata);
  }

  protected async executeInternal(context: ICommandContext): Promise<never> {
    throw new CommandError({
      code: 'TEST_FAILURE',
      message: 'This command always fails for testing purposes',
      type: ErrorType.BUSINESS_RULE,
      details: { testFailure: true }
    });
  }
}

// Async Test Command
export class AsyncTestCommand extends BaseCommand<{ delay: number }, { result: string }> {
  constructor(delay: number = 50) {
    super('AsyncTestCommand', { delay }, mockCommandMetadata);
  }

  protected async executeInternal(context: ICommandContext): Promise<{ result: string }> {
    await new Promise(resolve => setTimeout(resolve, this.data.delay));`,
            return: { result: `delayed-result-${this.data.delay}`, ms }
        };
    }
    // Validation Test Command
    ,
    // Validation Test Command
    class: ValidationTestCommand, extends: base_1.BaseCommand < { value: number },
};
{
    doubled: number;
}
 > {
    constructor(value) {
        super('ValidationTestCommand', { value }, mockCommandMetadata);
    },
    async executeInternal(context) {
        return { doubled: this.data.value * 2 };
    },
    async validateData(context) {
        const errors = [];
        if (typeof this.data.value !== 'number') {
            errors.push(this.createValidationError('INVALID_TYPE', 'Value must be a number', 'value', this.data.value));
        }
        if (this.data.value < 0) {
            errors.push(this.createValidationError('NEGATIVE_VALUE', 'Value must be non-negative', 'value', this.data.value));
        }
        if (this.data.value > 1000) {
            errors.push(this.createValidationError('VALUE_TOO_LARGE', 'Value cannot be greater than 1000', 'value', this.data.value));
        }
        return errors;
    }
};
// Event-Heavy Command
class EventHeavyCommand extends base_1.BaseCommand {
    constructor() {
        super('EventHeavyCommand', {}, mockCommandMetadata);
    }
    async executeInternal(context) {
        // Emit multiple events
        for (let i = 1; i <= 5; i++) {
            this.addEvent(Event$, { i }, { sequence: i, timestamp: new Date() });
        }
        return { count: 5 };
    }
}
exports.EventHeavyCommand = EventHeavyCommand;
// Mock Command Handler
class MockCommandHandler {
    shouldFail = false;
    executionCount = 0;
    constructor(shouldFail = false) {
        this.shouldFail = shouldFail;
    }
    async handle(command, context) {
        this.executionCount++;
        if (this.shouldFail) {
            return createMockCommandResult(false, undefined, new base_1.CommandError({
                code: 'MOCK_HANDLER_ERROR',
                message: 'Mock handler configured to fail',
                type: interfaces_1.ErrorType.INTERNAL
            }));
        }
        return createMockCommandResult(true, { handled: true, executionCount: this.executionCount });
    }
    canHandle(command) {
        return command.type === 'TestCommand' || command.type === 'MockCommand';
    }
    getMetadata() {
        return {
            name: 'MockCommandHandler',
            description: 'A mock command handler for testing',
            commandTypes: ['TestCommand', 'MockCommand'],
            version: '1.0.0',
            tags: ['mock', 'test']
        };
    }
    getExecutionCount() {
        return this.executionCount;
    }
}
exports.MockCommandHandler = MockCommandHandler;
// Mock Middleware
class MockMiddleware {
    name = 'mock';
    priority = 100;
    executionCount = 0;
    async execute(command, context, next) {
        this.executionCount++;
        context.data.middlewareExecuted = true;
        context.data.middlewareOrder = (context.data.middlewareOrder || []).concat('mock');
        const result = await next();
        result.metadata.middlewareCompleted = true;
        return result;
    }
    getExecutionCount() {
        return this.executionCount;
    }
}
exports.MockMiddleware = MockMiddleware;
// Mock Interceptor
class MockInterceptor {
    name = 'mock';
    beforeCount = 0;
    afterCount = 0;
    errorCount = 0;
    async beforeExecute(command, context) {
        this.beforeCount++;
        context.data.interceptorBeforeExecuted = true;
    }
    async afterExecute(command, context, result) {
        this.afterCount++;
        context.data.interceptorAfterExecuted = true;
        context.data.finalResult = result;
    }
    async onError(command, context, error) {
        this.errorCount++;
        context.data.interceptorErrorHandled = true;
        context.data.caughtError = error;
    }
    getCounts() {
        return {
            before: this.beforeCount,
            after: this.afterCount,
            error: this.errorCount
        };
    }
}
exports.MockInterceptor = MockInterceptor;
// Test Data Generators
class TestDataGenerator {
    static generateValidInputs(count = 10) {
        return Array.from({ length: count }, (_, i) => ({} `
      input: valid-input-${i + 1}`));
    }
    ;
}
exports.TestDataGenerator = TestDataGenerator;
generateInvalidInputs();
Array < { input: exports.string } > {
    return: [
        { input: '' },
        { input: '   ' },
        { input: 'a'.repeat(101) }, // Too long
        { input: null },
        { input: undefined }
    ]
};
generateValidationTestCases();
Array < { value: any, shouldPass: boolean, errorCount: number } > {
    return: [
        { value: 10, shouldPass: true, errorCount: 0 },
        { value: 0, shouldPass: true, errorCount: 0 },
        { value: 1000, shouldPass: true, errorCount: 0 },
        { value: -1, shouldPass: false, errorCount: 1 },
        { value: 1001, shouldPass: false, errorCount: 1 },
        { value: '10', shouldPass: false, errorCount: 1 },
        { value: null, shouldPass: false, errorCount: 1 },
        { value: undefined, shouldPass: false, errorCount: 1 }
    ]
};
generateConcurrentCommands(count, number = 50);
TestCommand[];
{
    return Array.from({ length: count }, (_, i) => new TestCommand(concurrent - input - $, { i } `)
    );
  }
}));
}
//# sourceMappingURL=fixtures.spec.js.map