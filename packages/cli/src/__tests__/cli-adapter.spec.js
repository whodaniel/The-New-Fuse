import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { Command } from 'commander';
import { CommandBus } from '@the-new-fuse/commands-core';
import { TestCommand, FailingCommand, createMockCommandContext } from '../../commands-core/src/__tests__/fixtures.spec';
// Mock commander and inquirer
jest.mock('commander');
jest.mock('inquirer');
describe('CLI Platform Adapter Integration', () => {
    let commandBus;
    let mockContext;
    beforeEach(() => {
        commandBus = new CommandBus();
        mockContext = createMockCommandContext();
        jest.clearAllMocks();
    });
    afterEach(() => {
        commandBus.clear();
    });
    describe('Command Registration and Execution', () => {
        it('should register CLI commands with the command bus', () => {
            // This test demonstrates how CLI commands should integrate with the unified architecture
            class CLICommandAdapter {
                commandBus;
                constructor(commandBus) {
                    this.commandBus = commandBus;
                }
                async executeCommand(commandType, data) {
                    const command = new TestCommand(data.input);
                    command.type = commandType;
                    const result = await this.commandBus.execute(command);
                    return result;
                }
            }
            const adapter = new CLICommandAdapter(commandBus);
            // Register a handler for the command
            commandBus.register('CLICommand', {
                handle: async (command) => ({
                    success: true,
                    data: { executed: true, input: command.data.input },
                    metadata: {
                        executionTime: 10,
                        completedAt: new Date(),
                        eventCount: 0
                    },
                    events: []
                }),
                canHandle: (command) => command.type === 'CLICommand',
                getMetadata: () => ({
                    name: 'CLIHandler',
                    commandTypes: ['CLICommand'],
                    version: '1.0.0'
                })
            });
            expect(commandBus.hasHandler('CLICommand')).toBe(true);
        });
        it('should handle CLI command execution through adapter', async () => {
            class CLICommandAdapter {
                commandBus;
                constructor(commandBus) {
                    this.commandBus = commandBus;
                }
                async executeCLICommand(commandType, cliArgs) {
                    // Convert CLI args to command data
                    const commandData = {
                        input: cliArgs.input || 'default-input',
                        options: cliArgs
                    };
                    const command = new TestCommand(commandData.input);
                    command.type = commandType;
                    return await this.commandBus.execute(command);
                }
            }
            const adapter = new CLICommandAdapter(commandBus);
            // Register handler
            commandBus.register('ProcessFileCommand', {
                handle: async (command) => ({
                    success: true,
                    data: {
                        processed: true,
                        filePath: command.data.input,
                        options: command.data.options
                    },
                    metadata: {
                        executionTime: 50,
                        completedAt: new Date(),
                        eventCount: 1
                    },
                    events: [{
                            id: '1',
                            type: 'FileProcessed',
                            data: { filePath: command.data.input },
                            metadata: {},
                            timestamp: new Date(),
                            version: '1.0.0'
                        }]
                }),
                canHandle: (command) => command.type === 'ProcessFileCommand',
                getMetadata: () => ({
                    name: 'FileProcessor',
                    commandTypes: ['ProcessFileCommand'],
                    version: '1.0.0'
                })
            });
            const cliArgs = {
                input: '/path/to/file.txt',
                verbose: true,
                output: '/output/path'
            };
            const result = await adapter.executeCLICommand('ProcessFileCommand', cliArgs);
            expect(result.success).toBe(true);
            expect(result.data.processed).toBe(true);
            expect(result.data.filePath).toBe('/path/to/file.txt');
            expect(result.data.options).toEqual(cliArgs);
            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe('FileProcessed');
        });
        it('should handle CLI command failures gracefully', async () => {
            class CLICommandAdapter {
                commandBus;
                constructor(commandBus) {
                    this.commandBus = commandBus;
                }
                async executeCLICommand(commandType, cliArgs) {
                    const command = new FailingCommand();
                    command.type = commandType;
                    try {
                        return await this.commandBus.execute(command);
                    }
                    catch (error) {
                        // CLI should handle errors gracefully
                        return {
                            success: false,
                            error: error.message,
                            exitCode: 1
                        };
                    }
                }
            }
            const adapter = new CLICommandAdapter(commandBus);
            commandBus.register('FailingCLICommand', {
                handle: async () => {
                    throw new Error('CLI command failed');
                },
                canHandle: (command) => command.type === 'FailingCLICommand',
                getMetadata: () => ({
                    name: 'FailingCLIHandler',
                    commandTypes: ['FailingCLICommand'],
                    version: '1.0.0'
                })
            });
            const result = await adapter.executeCLICommand('FailingCLICommand', {});
            expect(result.success).toBe(false);
            expect(result.error).toContain('CLI command failed');
            expect(result.exitCode).toBe(1);
        });
    });
    describe('CLI Command Builder Integration', () => {
        it('should build commander commands that integrate with command bus', () => {
            class CLICommandBuilder {
                commandBus;
                constructor(commandBus) {
                    this.commandBus = commandBus;
                }
                buildCommand(commandName, commandType) {
                    const cmd = new Command(commandName);
                    cmd
                        .description(`Execute ${commandType} command)
            .option('-i, --input <input>', 'Input data')
            .option('-v, --verbose', 'Verbose output')
            .action(async (options: any) => {
              try {
                const command = new TestCommand(options.input || 'default');
                (command as any).type = commandType;

                const result = await this.commandBus.execute(command);

                if (result.success) {
                  if (options.verbose) {
                    console.log('Command executed successfully:', result.data);
                  } else {
                    console.log('Success');
                  }
                } else {
                  console.error('Command failed:', result.error?.message);
                  process.exit(1);
                }
              } catch (error) {
                console.error('Execution error:', error);
                process.exit(1);
              }
            });

          return cmd;
        }
      }

      const builder = new CLICommandBuilder(commandBus);

      // Register handler
      commandBus.register('BuildCommand', {
        handle: async (command: any) => ({
          success: true,
          data: { built: true, input: command.data.input },
          metadata: {
            executionTime: 20,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'BuildCommand',
        getMetadata: () => ({
          name: 'BuildHandler',
          commandTypes: ['BuildCommand'],
          version: '1.0.0'
        })
      });

      const cmd = builder.buildCommand('build', 'BuildCommand');

      expect(cmd).toBeInstanceOf(Command);
      // The actual execution would be tested in E2E tests
    });

    it('should handle interactive CLI commands with inquirer', async () => {
      const mockPrompt = jest.mocked(inquirer.prompt);

      class InteractiveCLIAdapter {
        private commandBus: CommandBus;

        constructor(commandBus: CommandBus) {
          this.commandBus = commandBus;
        }

        async executeInteractiveCommand(commandType: string): Promise<any> {
          // Mock interactive prompts
          mockPrompt.mockResolvedValueOnce({
            name: 'test-project',
            description: 'A test project',
            confirm: true
          });

          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Project name:',
              validate: (input: string) => input.length > 0
            },
            {
              type: 'input',
              name: 'description',
              message: 'Description:'
            },
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Create project?'
            }
          ]);

          if (!answers.confirm) {
            return { success: false, cancelled: true };
          }

          const command = new TestCommand(answers.name);
          (command as any).type = commandType;

          return await this.commandBus.execute(command);
        }
      }

      const adapter = new InteractiveCLIAdapter(commandBus);

      commandBus.register('CreateProjectCommand', {
        handle: async (command: any) => ({
          success: true,
          data: {
            projectCreated: true,
            name: command.data.input,
            timestamp: new Date()
          },
          metadata: {
            executionTime: 100,
            completedAt: new Date(),
            eventCount: 1
          },
          events: [{
            id: '1',
            type: 'ProjectCreated',
            data: { name: command.data.input },
            metadata: {},
            timestamp: new Date(),
            version: '1.0.0'
          }]
        }),
        canHandle: (command: any) => command.type === 'CreateProjectCommand',
        getMetadata: () => ({
          name: 'ProjectCreator',
          commandTypes: ['CreateProjectCommand'],
          version: '1.0.0'
        })
      });

      const result = await adapter.executeInteractiveCommand('CreateProjectCommand');

      expect(result.success).toBe(true);
      expect(result.data.projectCreated).toBe(true);
      expect(result.data.name).toBe('test-project');
      expect(mockPrompt).toHaveBeenCalledTimes(1);
    });
  });

  describe('CLI Error Handling and Validation', () => {
    it('should validate CLI arguments before command execution', async () => {
      class ValidatingCLIAdapter {
        private commandBus: CommandBus;

        constructor(commandBus: CommandBus) {
          this.commandBus = commandBus;
        }

        async executeWithValidation(commandType: string, args: any): Promise<any> {
          // Pre-validate CLI arguments
          const validation = this.validateCLIArgs(args);
          if (!validation.valid) {
            return {
              success: false,
              error: validation.errors.join(', '),
              exitCode: 2
            };
          }

          const command = new TestCommand(args.input);
          (command as any).type = commandType;

          return await this.commandBus.execute(command);
        }

        private validateCLIArgs(args: any): { valid: boolean; errors: string[] } {
          const errors: string[] = [];

          if (!args.input) {
            errors.push('--input is required');
          }

          if (args.input && args.input.length > 255) {
            errors.push('--input must be less than 255 characters');
          }

          if (args.count !== undefined && (isNaN(args.count) || args.count < 0)) {
            errors.push('--count must be a non-negative number');
          }

          return {
            valid: errors.length === 0,
            errors
          };
        }
      }

      const adapter = new ValidatingCLIAdapter(commandBus);

      commandBus.register('ValidatedCommand', {
        handle: async (command: any) => ({
          success: true,
          data: { validated: true, input: command.data.input },
          metadata: {
            executionTime: 10,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'ValidatedCommand',
        getMetadata: () => ({
          name: 'ValidatedHandler',
          commandTypes: ['ValidatedCommand'],
          version: '1.0.0'
        })
      });

      // Test valid arguments
      const validResult = await adapter.executeWithValidation('ValidatedCommand', {
        input: 'valid-input',
        count: 5
      });

      expect(validResult.success).toBe(true);
      expect(validResult.data.validated).toBe(true);

      // Test invalid arguments
      const invalidResult = await adapter.executeWithValidation('ValidatedCommand', {
        count: -1
      });

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('--input is required');
      expect(invalidResult.error).toContain('--count must be a non-negative number');
      expect(invalidResult.exitCode).toBe(2);
    });

    it('should handle command execution timeouts', async () => {
      class TimeoutCLIAdapter {
        private commandBus: CommandBus;
        private timeoutMs: number;

        constructor(commandBus: CommandBus, timeoutMs = 1000) {
          this.commandBus = commandBus;
          this.timeoutMs = timeoutMs;
        }

        async executeWithTimeout(commandType: string, args: any): Promise<any> {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Command execution timeout')), this.timeoutMs);
          });

          const executionPromise = this.commandBus.execute(new TestCommand(args.input || 'test'));

          try {
            return await Promise.race([executionPromise, timeoutPromise]);
          } catch (error) {
            return {
              success: false,
              error: error.message,
              timeout: true,
              exitCode: 124 // Standard timeout exit code
            };
          }
        }
      }

      const adapter = new TimeoutCLIAdapter(commandBus, 50); // Very short timeout

      commandBus.register('SlowCommand', {
        handle: async (command: any) => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            success: true,
            data: { completed: true },
            metadata: {
              executionTime: 100,
              completedAt: new Date(),
              eventCount: 0
            },
            events: []
          };
        },
        canHandle: (command: any) => command.type === 'SlowCommand',
        getMetadata: () => ({
          name: 'SlowHandler',
          commandTypes: ['SlowCommand'],
          version: '1.0.0'
        })
      });

      const result = await adapter.executeWithTimeout('SlowCommand', { input: 'test' });

      expect(result.success).toBe(false);
      expect(result.timeout).toBe(true);
      expect(result.error).toContain('timeout');
      expect(result.exitCode).toBe(124);
    });
  });

  describe('CLI Output Formatting', () => {
    it('should format command results for CLI output', async () => {
      class CLIOuputFormatter {
        private commandBus: CommandBus;

        constructor(commandBus: CommandBus) {
          this.commandBus = commandBus;
        }

        async executeAndFormat(commandType: string, args: any, format: 'json' | 'text' = 'text'): Promise<string> {
          const command = new TestCommand(args.input || 'test');
          (command as any).type = commandType;

          const result = await this.commandBus.execute(command);

          if (format === 'json') {
            return JSON.stringify({
              success: result.success,
              data: result.data,
              executionTime: result.metadata.executionTime,
              timestamp: result.metadata.completedAt
            }, null, 2);
          } else {
            if (result.success) {`);
                    return `✅ Success: ${JSON.stringify(result.data)}`;
                    n;
                    Execution;
                    time: $;
                    {
                        result.metadata.executionTime;
                    }
                    ms;
                }
            }
            {
                `
              return `;
                Failed: $;
                {
                    result.error?.message;
                }
                `\n⏱️  Execution time: ${result.metadata.executionTime}ms`;
            }
        });
    });
});
const formatter = new CLIOuputFormatter(commandBus);
commandBus.register('FormatTestCommand', {
    handle: async (command) => ({
        success: true,
        data: { processed: command.data.input, count: 42 },
        metadata: {
            executionTime: 25,
            completedAt: new Date(),
            eventCount: 0
        },
        events: []
    }),
    canHandle: (command) => command.type === 'FormatTestCommand',
    getMetadata: () => ({
        name: 'FormatHandler',
        commandTypes: ['FormatTestCommand'],
        version: '1.0.0'
    })
});
// Test text format
const textOutput = await formatter.executeAndFormat('FormatTestCommand', { input: 'test-data' }, 'text');
expect(textOutput).toContain('✅ Success');
expect(textOutput).toContain('Execution time: 25ms');
expect(textOutput).toContain('processed');
// Test JSON format
const jsonOutput = await formatter.executeAndFormat('FormatTestCommand', { input: 'test-data' }, 'json');
const parsed = JSON.parse(jsonOutput);
expect(parsed.success).toBe(true);
expect(parsed.data.processed).toBe('test-data');
expect(parsed.executionTime).toBe(25);
;
;
;
//# sourceMappingURL=cli-adapter.spec.js.map