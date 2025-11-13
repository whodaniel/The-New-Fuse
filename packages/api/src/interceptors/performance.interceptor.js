var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PerformanceInterceptor_1;
import { Injectable, Logger, } from "@nestjs/common";
import { tap } from "rxjs/operators";
let PerformanceInterceptor = PerformanceInterceptor_1 = class PerformanceInterceptor {
    logger = new Logger(PerformanceInterceptor_1.name);
    intercept(context, next) {
        const start = Date.now();
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        return next.handle().pipe(tap(() => {
            const duration = Date.now() - start;
            const message = `${method} ${url} - ${duration}ms;` `
        if (duration > 1000) {`;
            this.logger.warn(Slow, request, $, { message });
        }));
        if (duration > 500) {
            `
          this.logger.log(Medium request: ${message}`;
            ;
        }
        // In production, you might want to send this to a monitoring service
        if (process.env.NODE_ENV === "production" && duration > 2000) {
            // Send alert for very slow requests
            this.logger.error(Very, slow, request, $, { message } `);
        }
      }),
    );
  }
}
            );
        }
    }
};
PerformanceInterceptor = PerformanceInterceptor_1 = __decorate([
    Injectable()
], PerformanceInterceptor);
export { PerformanceInterceptor };
//# sourceMappingURL=performance.interceptor.js.map