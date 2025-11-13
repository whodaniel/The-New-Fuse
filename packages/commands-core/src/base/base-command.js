"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandError = exports.BaseCommand = void 0;
/**
 * Abstract base command implementation
 */
class BaseCommand {
    type;
    data;
    metadata;
    _events = [];
    constructor(type, data, metadata = {}) {
        this.type = type;
        this.data = data;
        this.metadata = {
            version: '1.0.0',
            name: type,
            description: metadata.description || `Command of type ${type},
      category: metadata.category || 'general',
      tags: metadata.tags || [],
      ...metadata
    };
  }

  /**
   * Execute the command with validation and error handling
   */
  public async execute(context: ICommandContext): Promise<ICommandResult<TResult>> {
    const startTime = Date.now();
    
    try {
      // Validate command and context
      const validation = await this.validate(context);
      if (!validation.isValid) {
        return this.createErrorResult(
          new CommandError({
            code: 'VALIDATION_FAILED',
            message: 'Command validation failed',
            type: ErrorType.VALIDATION,
            details: { errors: validation.errors }
          }),
          startTime,
          context
        );
      }

      // Execute the command logic
      const result = await this.executeInternal(context);
      
      // Create successful result
      return this.createSuccessResult(result, startTime, context);
      
    } catch (error) {
      // Handle execution errors
      const commandError = this.wrapError(error);
      return this.createErrorResult(commandError, startTime, context);
    }
  }

  /**
   * Validate the command data and context
   */
  public async validate(context: ICommandContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic validation
    errors.push(...this.validateBasic(context));
    
    // Custom validation
    errors.push(...await this.validateData(context));
    warnings.push(...await this.validateWarnings(context));

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add a domain event to the command
   */
  protected addEvent(type: string, data: any, metadata: Partial<EventMetadata> = {}): void {
    const event: IDomainEvent = {
      id: uuidv4(),
      type,
      data,
      metadata: {
        commandId: this.metadata.name,
        ...metadata
      },
      timestamp: new Date(),
      version: this.metadata.version
    };
    
    this._events.push(event);
  }

  /**
   * Get all events emitted by this command
   */
  public getEvents(): IDomainEvent[] {
    return [...this._events];
  }

  /**
   * Clear all events
   */
  protected clearEvents(): void {
    this._events = [];
  }

  /**
   * Abstract method for command-specific execution logic
   */
  protected abstract executeInternal(context: ICommandContext): Promise<TResult>;

  /**
   * Abstract method for command-specific data validation
   */
  protected validateData(context: ICommandContext): Promise<ValidationError[]> {
    return Promise.resolve([]);
  }

  /**
   * Abstract method for command-specific warning validation
   */
  protected validateWarnings(context: ICommandContext): Promise<ValidationWarning[]> {
    return Promise.resolve([]);
  }

  /**
   * Basic validation common to all commands
   */
  private validateBasic(context: ICommandContext): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!context.executionId) {
      errors.push({
        code: 'MISSING_EXECUTION_ID',
        message: 'Execution ID is required',
        path: 'executionId'
      });
    }

    if (!context.timestamp) {
      errors.push({
        code: 'MISSING_TIMESTAMP',
        message: 'Timestamp is required',
        path: 'timestamp'
      });
    }

    if (!context.auth) {
      errors.push({
        code: 'MISSING_AUTH_CONTEXT',
        message: 'Authentication context is required',
        path: 'auth'
      });
    }

    return errors;
  }

  /**
   * Create a successful command result
   */
  private createSuccessResult(
    data: TResult, 
    startTime: number, 
    context: ICommandContext
  ): ICommandResult<TResult> {
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      data,
      metadata: {
        executionTime,
        completedAt: new Date(),
        eventCount: this._events.length,
        stats: this.calculateStats(executionTime)
      },
      events: [...this._events]
    };
  }

  /**
   * Create an error command result
   */
  private createErrorResult(
    error: CommandError, 
    startTime: number, 
    context: ICommandContext
  ): ICommandResult<TResult> {
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      error,
      metadata: {
        executionTime,
        completedAt: new Date(),
        eventCount: this._events.length,
        stats: this.calculateStats(executionTime)
      },
      events: [...this._events]
    };
  }

  /**
   * Wrap an error into a CommandError
   */
  private wrapError(error: any): CommandError {
    if (error instanceof CommandError) {
      return error;
    }

    if (error instanceof Error) {
      return new CommandError({
        code: 'EXECUTION_ERROR',
        message: error.message,
        type: ErrorType.INTERNAL,
        stack: error.stack,
        details: { originalError: error.name }
      });
    }

    return new CommandError({
      code: 'UNKNOWN_ERROR',
      message: String(error),
      type: ErrorType.INTERNAL,
      details: { originalValue: error }
    });
  }

  /**
   * Calculate execution statistics
   */
  private calculateStats(executionTime: number) {
    // Basic stats - can be extended in subclasses
    return {
      executionTime,
      memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed : undefined
    };
  }

  /**
   * Create a validation error
   */
  protected createValidationError(
    code: string, 
    message: string, 
    path?: string, 
    value?: any
  ): ValidationError {
    return { code, message, path, value };
  }

  /**
   * Create a validation warning
   */
  protected createValidationWarning(
    code: string, 
    message: string, 
    path?: string, 
    value?: any
  ): ValidationWarning {
    return { code, message, path, value };
  }

  /**
   * Check if a value is null or undefined
   */
  protected isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
  }

  /**
   * Check if a string is null, undefined, or empty
   */
  protected isNullOrEmpty(value: string | null | undefined): boolean {
    return this.isNullOrUndefined(value) || value!.trim() === '';
  }

  /**
   * Check if an array is null, undefined, or empty
   */
  protected isNullOrEmptyArray(value: any[] | null | undefined): boolean {
    return this.isNullOrUndefined(value) || value!.length === 0;
  }

  /**
   * Validate required field
   */
  protected validateRequired(
    value: any, 
    fieldName: string, 
    context: ICommandContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (this.isNullOrUndefined(value)) {
      errors.push(this.createValidationError(
        'REQUIRED_FIELD',` `${fieldName}`, is, required,
            fieldName,
            value
        };
        return errors;
    }
    /**
     * Validate string field
     */
    validateString(value, fieldName, minLength, maxLength) {
        const errors = [];
        if (this.isNullOrUndefined(value)) {
            return errors; // Use validateRequired for required fields
        }
        if (typeof value !== 'string') {
            errors.push(this.createValidationError('INVALID_TYPE', $, { fieldName }, must, be, a, string, fieldName, value));
            return errors;
        }
        if (minLength !== undefined && value.length < minLength) {
            errors.push(this.createValidationError('MIN_LENGTH', `
        ${fieldName}`, must, be, at, least, $, { minLength }, characters, long, fieldName, value));
        }
        if (maxLength !== undefined && value.length > maxLength) {
            `
      errors.push(this.createValidationError(`;
            'MAX_LENGTH',
                $;
            {
                fieldName;
            }
            must;
            be;
            no;
            more;
            than;
            $;
            {
                maxLength;
            }
            ` characters long,
        fieldName,
        value
      ));
    }

    return errors;
  }

  /**
   * Validate number field
   */
  protected validateNumber(
    value: number | null | undefined, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (this.isNullOrUndefined(value)) {
      return errors; // Use validateRequired for required fields
    }

    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(this.createValidationError(
        'INVALID_TYPE',
        ${fieldName} must be a valid number,
        fieldName,
        value
      ));
      return errors;
    }

    if (min !== undefined && value < min) {`;
            errors.push(this.createValidationError(`
        'MIN_VALUE',
        ${fieldName} must be at least ${min}`, fieldName, value));
        }
        if (max !== undefined && value > max) {
            errors.push(this.createValidationError('MAX_VALUE', $, { fieldName }, must, be, no, more, than, $, { max } ``, fieldName, value));
        }
        return errors;
    }
}
exports.BaseCommand = BaseCommand;
/**
 * CommandError class for command-specific errors
 */
class CommandError extends Error {
    code;
    type;
    details;
    constructor(options) {
        super(options.message);
        this.name = 'CommandError';
        this.code = options.code;
        this.type = options.type;
        this.details = options.details;
        if (options.stack) {
            this.stack = options.stack;
        }
    }
}
exports.CommandError = CommandError;
//# sourceMappingURL=base-command.js.map