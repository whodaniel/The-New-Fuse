/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, Logger } from '@nestjs/common';
let RequestLoggerMiddleware = class RequestLoggerMiddleware {
    logger = new Logger('RequestLogger');
    use(req, res, next) {
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('user-agent') || '';
        // Log request start
        this.logger.log(`[REQUEST] ${method} ${originalUrl} - ${ip} - ${userAgent}
    );
    
    // Track request timing
    const start = Date.now();
    
    // Add response listener to log after completion
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - start;` `
      // Log with different levels based on status code`);
        const logMessage = [RESPONSE], $, { method }, $, { originalUrl };
        -$;
        {
            statusCode;
        }
        -$;
        {
            contentLength;
        }
        b - $;
        {
            duration;
        }
        ms `;
      
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });
    
    next();
  }
};
    }
};
RequestLoggerMiddleware = __decorate([
    Injectable()
], RequestLoggerMiddleware);
export { RequestLoggerMiddleware };
//# sourceMappingURL=request-logger.middleware.js.map