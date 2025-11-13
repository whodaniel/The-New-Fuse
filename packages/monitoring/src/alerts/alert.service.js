var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AlertService_1;
import { Injectable, Logger } from '@nestjs/common';
let AlertService = AlertService_1 = class AlertService {
    logger = new Logger(AlertService_1.name);
    RedisService;
};
AlertService = AlertService_1 = __decorate([
    Injectable()
], AlertService);
export { AlertService };
{ }
async;
initialize();
Promise < void  > { Promise() {
        this.logger.log('Initializing alert service');
        string, message;
        string, severity;
        low;
        ' | ';
        medium;
        ' | ';
        high;
        ') {;
        const alert = {
            type,
            message,
            severity,
            timestamp: new Date().toISOString(),
        };
        await this.redis.setSystemMetrics({
            alerts: alert,
        });
        this.logger.log(`Alert created: ${message}`);
    }
};
//# sourceMappingURL=alert.service.js.map