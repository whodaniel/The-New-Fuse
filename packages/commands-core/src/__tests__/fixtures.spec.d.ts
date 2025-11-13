import { ICommand, ICommandContext, ICommandResult, AuthContext } from '../interfaces';
import { BaseCommand } from '../base';
/**
 * Test fixtures and mock data for command architecture tests
 */
export declare const mockAuthContext: AuthContext, string: any;
export declare class EventHeavyCommand extends BaseCommand<{}, {
    count: number;
}> {
    constructor();
    protected executeInternal(context: ICommandContext): Promise<{
        count: number;
    }>;
}
export declare class MockCommandHandler implements ICommandHandler {
    private shouldFail;
    private executionCount;
    constructor(shouldFail?: boolean);
    handle(command: ICommand, context: ICommandContext): Promise<ICommandResult>;
    canHandle(command: ICommand): boolean;
    getMetadata(): HandlerMetadata;
    getExecutionCount(): number;
}
export declare class MockMiddleware implements ICommandMiddleware {
    readonly name = "mock";
    readonly priority = 100;
    private executionCount;
    execute(command: ICommand, context: ICommandContext, next: () => Promise<ICommandResult>): Promise<ICommandResult>;
    getExecutionCount(): number;
}
export declare class MockInterceptor implements ICommandInterceptor {
    readonly name = "mock";
    private beforeCount;
    private afterCount;
    private errorCount;
    beforeExecute(command: ICommand, context: ICommandContext): Promise<void>;
    afterExecute(command: ICommand, context: ICommandContext, result: ICommandResult): Promise<void>;
    onError(command: ICommand, context: ICommandContext, error: Error): Promise<void>;
    getCounts(): {
        before: number;
        after: number;
        error: number;
    };
}
export declare class TestDataGenerator {
    static generateValidInputs(count?: number): Array<{
        input: string;
    }>;
}
//# sourceMappingURL=fixtures.spec.d.ts.map