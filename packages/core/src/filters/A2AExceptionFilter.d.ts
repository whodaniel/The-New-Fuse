import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { A2AService } from '../services/A2AService';
export declare class A2AExceptionFilter implements ExceptionFilter {
    private readonly a2aService;
    private logger;
    constructor(a2aService: A2AService);
    catch(exception: unknown, host: ArgumentsHost): "agent_discovery" | "agent_registration" | "general" | "message_exchange" | "agent_listing" | "agent_details" | undefined;
    private getErrorCode;
    private getErrorType;
    private isRetryableError;
    private getSuggestedAction;
    private isA2AInteraction;
    private logError;
}
export declare class A2AAgentNotFoundException extends HttpException {
}
//# sourceMappingURL=A2AExceptionFilter.d.ts.map