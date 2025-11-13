"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const base_1 = require("../base");
const interfaces_1 = require("../interfaces");
const fixtures_spec_1 = require("./fixtures.spec");
(0, globals_1.describe)('BaseCommand', () => {
    let mockContext;
    (0, globals_1.beforeEach)(() => {
        mockContext = (0, fixtures_spec_1.createMockCommandContext)();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('constructor', () => {
        (0, globals_1.it)('should initialize command with correct properties', () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            (0, globals_1.expect)(command.type).toBe('TestCommand');
            (0, globals_1.expect)(command.data).toEqual({ input: 'test-input' });
            (0, globals_1.expect)(command.metadata).toEqual(fixtures_spec_1.mockCommandMetadata);
        });
        (0, globals_1.it)('should use default metadata when not provided', () => {
            const command = new fixtures_spec_1.TestCommand();
            (0, globals_1.expect)(command.metadata.version).toBe('1.0.0');
            (0, globals_1.expect)(command.metadata.name).toBe('TestCommand');
            (0, globals_1.expect)(command.metadata.category).toBe('general');
            (0, globals_1.expect)(command.metadata.tags).toEqual([]);
        });
        (0, globals_1.it)('should merge provided metadata with defaults', () => {
            const customMetadata = {
                description: 'Custom description',
                category: 'custom',
                tags: ['custom-tag']
            };
            const command = new base_1.BaseCommand('CustomCommand', {}, customMetadata);
            (0, globals_1.expect)(command.metadata.description).toBe('Custom description');
            (0, globals_1.expect)(command.metadata.category).toBe('custom');
            (0, globals_1.expect)(command.metadata.tags).toEqual(['custom-tag']);
            (0, globals_1.expect)(command.metadata.version).toBe('1.0.0'); // default
        });
    });
    (0, globals_1.describe)('execute', () => {
        (0, globals_1.it)('should execute command successfully and return result', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data).toEqual({ output: 'processed-test-input' });
            (0, globals_1.expect)(result.error).toBeUndefined();
            (0, globals_1.expect)(result.events).toHaveLength(1);
            (0, globals_1.expect)(result.events[0].type).toBe('TestExecuted');
            (0, globals_1.expect)(result.metadata.executionTime).toBeGreaterThan(0);
            (0, globals_1.expect)(result.metadata.eventCount).toBe(1);
        });
        (0, globals_1.it)('should handle command execution failure', async () => {
            const command = new fixtures_spec_1.FailingCommand();
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.data).toBeUndefined();
            (0, globals_1.expect)(result.error).toBeInstanceOf(base_1.CommandError);
            (0, globals_1.expect)(result.error?.code).toBe('TEST_FAILURE');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.BUSINESS_RULE);
            (0, globals_1.expect)(result.metadata.executionTime).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should validate command before execution', async () => {
            const command = new fixtures_spec_1.TestCommand(''); // Invalid input
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.code).toBe('VALIDATION_FAILED');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.VALIDATION);
        });
        (0, globals_1.it)('should handle validation warnings', async () => {
            // Create a command that has warnings but passes validation
            const command = new fixtures_spec_1.TestCommand('valid-input');
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            // Warnings would be checked in validation result, but execution should succeed
        });
        (0, globals_1.it)('should wrap unexpected errors in CommandError', async () => {
            class ThrowingCommand extends base_1.BaseCommand {
                constructor() {
                    super('ThrowingCommand', {});
                }
                async executeInternal() {
                    throw new Error('Unexpected error');
                }
            }
            const command = new ThrowingCommand();
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeInstanceOf(base_1.CommandError);
            (0, globals_1.expect)(result.error?.code).toBe('EXECUTION_ERROR');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.INTERNAL);
        });
    });
    (0, globals_1.describe)('validate', () => {
        (0, globals_1.it)('should return valid result for valid command', async () => {
            const command = new fixtures_spec_1.TestCommand('valid-input');
            const result = await command.validate(mockContext);
            (0, globals_1.expect)(result.isValid).toBe(true);
            (0, globals_1.expect)(result.errors).toHaveLength(0);
            (0, globals_1.expect)(result.warnings).toHaveLength(0);
        });
        (0, globals_1.it)('should return invalid result for invalid command', async () => {
            const command = new fixtures_spec_1.TestCommand(''); // Empty input
            const result = await command.validate(mockContext);
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.errors).toHaveLength(1);
            (0, globals_1.expect)(result.errors[0].code).toBe('REQUIRED_INPUT');
            (0, globals_1.expect)(result.errors[0].path).toBe('input');
        });
        (0, globals_1.it)('should validate basic context requirements', async () => {
            const command = new fixtures_spec_1.TestCommand('valid-input');
            const invalidContext = { ...mockContext, executionId: undefined };
            const result = await command.validate(invalidContext);
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.errors.some(e => e.code === 'MISSING_EXECUTION_ID')).toBe(true);
        });
        (0, globals_1.it)('should validate multiple validation rules', async () => {
            const command = new fixtures_spec_1.ValidationTestCommand(-5); // Negative value
            const result = await command.validate(mockContext);
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.errors).toHaveLength(1);
            (0, globals_1.expect)(result.errors[0].code).toBe('NEGATIVE_VALUE');
        });
        (0, globals_1.it)('should handle validation with both errors and warnings', async () => {
            // Create a command that generates both errors and warnings
            class WarningCommand extends base_1.BaseCommand {
                constructor(value) {
                    super('WarningCommand', { value });
                }
                async executeInternal() {
                    return {};
                }
                async validateData() {
                    return [this.createValidationError('TEST_ERROR', 'Test error', 'value')];
                }
                async validateWarnings() {
                    return [this.createValidationWarning('TEST_WARNING', 'Test warning', 'value')];
                }
            }
            const command = new WarningCommand(10);
            const result = await command.validate(mockContext);
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.errors).toHaveLength(1);
            (0, globals_1.expect)(result.warnings).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('event handling', () => {
        (0, globals_1.it)('should emit domain events during execution', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.events).toHaveLength(1);
            (0, globals_1.expect)(result.events[0].type).toBe('TestExecuted');
            (0, globals_1.expect)(result.events[0].data.input).toBe('test-input');
        });
        (0, globals_1.it)('should handle multiple events', async () => {
            const command = new fixtures_spec_1.EventHeavyCommand();
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.events).toHaveLength(5);
            (0, globals_1.expect)(result.data?.count).toBe(5);
            for (let i = 0; i < 5; i++) {
                (0, globals_1.expect)(result.events[i].type).toBe(`Event${i + 1}`);
                (0, globals_1.expect)(result.events[i].data.sequence).toBe(i + 1);
            }
        });
        (0, globals_1.it)('should clear events after execution', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            await command.execute(mockContext);
            // Events should be cleared after execution
            (0, globals_1.expect)(command.getEvents()).toHaveLength(0);
        });
        (0, globals_1.it)('should allow manual event addition', () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            command.addEvent('ManualEvent', { manual: true });
            const events = command.getEvents();
            (0, globals_1.expect)(events).toHaveLength(1);
            (0, globals_1.expect)(events[0].type).toBe('ManualEvent');
            (0, globals_1.expect)(events[0].data.manual).toBe(true);
        });
    });
    (0, globals_1.describe)('validation helpers', () => {
        (0, globals_1.it)('should validate required fields', async () => {
            class RequiredFieldCommand extends base_1.BaseCommand {
                constructor(name) {
                    super('RequiredFieldCommand', { name });
                }
                async executeInternal() {
                    return {};
                }
                async validateData() {
                    return this.validateRequired(this.data.name, 'name', mockContext);
                }
            }
            const validCommand = new RequiredFieldCommand('test');
            const invalidCommand = new RequiredFieldCommand();
            (0, globals_1.expect)((await validCommand.validate(mockContext)).isValid).toBe(true);
            (0, globals_1.expect)((await invalidCommand.validate(mockContext)).isValid).toBe(false);
        });
        (0, globals_1.it)('should validate string fields', async () => {
            class StringFieldCommand extends base_1.BaseCommand {
                constructor(text) {
                    super('StringFieldCommand', { text });
                }
                async executeInternal() {
                    return {};
                }
                async validateData() {
                    return [
                        ...this.validateString(this.data.text, 'text', 2, 10)
                    ];
                }
            }
            const validCommand = new StringFieldCommand('hello');
            const tooShortCommand = new StringFieldCommand('h');
            const tooLongCommand = new StringFieldCommand('this-is-way-too-long');
            (0, globals_1.expect)((await validCommand.validate(mockContext)).isValid).toBe(true);
            (0, globals_1.expect)((await tooShortCommand.validate(mockContext)).isValid).toBe(false);
            (0, globals_1.expect)((await tooLongCommand.validate(mockContext)).isValid).toBe(false);
        });
        (0, globals_1.it)('should validate number fields', async () => {
            class NumberFieldCommand extends base_1.BaseCommand {
                constructor(value) {
                    super('NumberFieldCommand', { value });
                }
                async executeInternal() {
                    return {};
                }
                async validateData() {
                    return [
                        ...this.validateNumber(this.data.value, 'value', 0, 100)
                    ];
                }
            }
            const validCommand = new NumberFieldCommand(50);
            const tooLowCommand = new NumberFieldCommand(-5);
            const tooHighCommand = new NumberFieldCommand(150);
            const invalidTypeCommand = new NumberFieldCommand(NaN);
            (0, globals_1.expect)((await validCommand.validate(mockContext)).isValid).toBe(true);
            (0, globals_1.expect)((await tooLowCommand.validate(mockContext)).isValid).toBe(false);
            (0, globals_1.expect)((await tooHighCommand.validate(mockContext)).isValid).toBe(false);
            (0, globals_1.expect)((await invalidTypeCommand.validate(mockContext)).isValid).toBe(false);
        });
        (0, globals_1.it)('should handle null/undefined checks', () => {
            const command = new fixtures_spec_1.TestCommand('test');
            (0, globals_1.expect)(command.isNullOrUndefined(null)).toBe(true);
            (0, globals_1.expect)(command.isNullOrUndefined(undefined)).toBe(true);
            (0, globals_1.expect)(command.isNullOrUndefined('')).toBe(false);
            (0, globals_1.expect)(command.isNullOrUndefined(0)).toBe(false);
            (0, globals_1.expect)(command.isNullOrEmpty('')).toBe(true);
            (0, globals_1.expect)(command.isNullOrEmpty('   ')).toBe(true);
            (0, globals_1.expect)(command.isNullOrEmpty(null)).toBe(true);
            (0, globals_1.expect)(command.isNullOrEmpty('test')).toBe(false);
            (0, globals_1.expect)(command.isNullOrEmptyArray([])).toBe(true);
            (0, globals_1.expect)(command.isNullOrEmptyArray(null)).toBe(true);
            (0, globals_1.expect)(command.isNullOrEmptyArray([1, 2, 3])).toBe(false);
        });
    });
    (0, globals_1.describe)('error handling', () => {
        (0, globals_1.it)('should wrap errors in CommandError', async () => {
            class ErrorThrowingCommand extends base_1.BaseCommand {
                constructor() {
                    super('ErrorThrowingCommand', {});
                }
                async executeInternal() {
                    throw new Error('Original error message');
                }
            }
            const command = new ErrorThrowingCommand();
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeInstanceOf(base_1.CommandError);
            (0, globals_1.expect)(result.error?.message).toBe('Original error message');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.INTERNAL);
            (0, globals_1.expect)(result.error?.code).toBe('EXECUTION_ERROR');
        });
        (0, globals_1.it)('should preserve existing CommandError instances', async () => {
            const originalError = new base_1.CommandError({
                code: 'ORIGINAL_ERROR',
                message: 'Original command error',
                type: interfaces_1.ErrorType.BUSINESS_RULE
            });
            class ErrorThrowingCommand extends base_1.BaseCommand {
                constructor() {
                    super('ErrorThrowingCommand', {});
                }
                async executeInternal() {
                    throw originalError;
                }
            }
            const command = new ErrorThrowingCommand();
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.error).toBe(originalError);
            (0, globals_1.expect)(result.error?.code).toBe('ORIGINAL_ERROR');
            (0, globals_1.expect)(result.error?.type).toBe(interfaces_1.ErrorType.BUSINESS_RULE);
        });
    });
    (0, globals_1.describe)('performance and statistics', () => {
        (0, globals_1.it)('should track execution time', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const startTime = Date.now();
            const result = await command.execute(mockContext);
            const endTime = Date.now();
            (0, globals_1.expect)(result.metadata.executionTime).toBeGreaterThanOrEqual(10); // At least the delay
            (0, globals_1.expect)(result.metadata.executionTime).toBeLessThanOrEqual(endTime - startTime);
            (0, globals_1.expect)(result.metadata.completedAt).toBeInstanceOf(Date);
            (0, globals_1.expect)(result.metadata.completedAt.getTime()).toBeGreaterThanOrEqual(startTime);
        });
        (0, globals_1.it)('should include execution statistics', async () => {
            const command = new fixtures_spec_1.TestCommand('test-input');
            const result = await command.execute(mockContext);
            (0, globals_1.expect)(result.metadata.stats).toBeDefined();
            (0, globals_1.expect)(result.metadata.stats?.executionTime).toBe(result.metadata.executionTime);
            (0, globals_1.expect)(result.metadata.eventCount).toBe(1);
        });
    });
});
//# sourceMappingURL=base-command.spec.js.map