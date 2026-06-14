/**
 * Custom HTTP exception filter
 * Converts exceptions to standardized API responses
 */
import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: any, host: ArgumentsHost): void;
}
//# sourceMappingURL=global-exception.filter.d.ts.map