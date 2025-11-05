/**
 * Global Exception Filter
 * Standardizes error responses across the API Gateway
 */
import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
}
//# sourceMappingURL=global-exception.filter.d.ts.map