import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations (e.g., hybrid apps or websockets), httpAdapterHost may be unavailable.
    // However, for a standard REST API, it should be present.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message:
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error',
    };

    // If it's a validation error (often an object with 'message' array), clean it up
    if (
      exception instanceof HttpException &&
      typeof responseBody.message === 'object' &&
      responseBody.message !== null
    ) {
      const exceptionResponse = exception.getResponse() as any;
      if (exceptionResponse.message) {
         // Flatten validation errors if they are arrays of strings
         responseBody.message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(', ')
          : exceptionResponse.message;
      }
    }

    // Log the error for internal tracking
    if (httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
       this.logger.error(
        `Status: ${httpStatus} Error: ${JSON.stringify(responseBody)}`,
        exception instanceof Error ? exception.stack : ''
      );
    } else {
       this.logger.warn(
        `Status: ${httpStatus} Error: ${JSON.stringify(responseBody)}`
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
