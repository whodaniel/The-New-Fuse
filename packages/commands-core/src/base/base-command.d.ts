import { ICommand, CommandMetadata, ValidationError, ErrorType, IDomainEvent } from '../interfaces';
/**
 * Abstract base command implementation
 */
export declare abstract class BaseCommand<TData = any, TResult = any> implements ICommand<TData, TResult> {
    readonly type: string;
    readonly data: TData;
    readonly metadata: CommandMetadata;
    protected _events: IDomainEvent[];
    constructor(type: string, data: TData, metadata?: Partial<CommandMetadata>);
    /**
     * Validate string field
     */
    protected validateString(value: string | null | undefined, fieldName: string, minLength?: number, maxLength?: number): ValidationError[];
}
/**
 * CommandError class for command-specific errors
 */
export declare class CommandError extends Error {
    readonly code: string;
    readonly type: ErrorType;
    readonly details?: Record<string, any>;
    constructor(options: {
        code: string;
        message: string;
        type: ErrorType;
        stack?: string;
        details?: Record<string, any>;
    });
}
//# sourceMappingURL=base-command.d.ts.map