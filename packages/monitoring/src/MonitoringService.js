var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Injectable } from '@nestjs/common';
import { PrometheusService } from './PrometheusService';
import { RedisService } from './RedisService';
let MonitoringService = class MonitoringService {
    prometheus;
    redis;
    constructor(prometheus, redis) {
        this.prometheus = prometheus;
        this.redis = redis;
    }
    async trackAgentMetrics() {
        agentId: string, metrics;
        AgentMetrics;
        Promise < any > {
            $
        };
        {
            agentId;
        }
        `, metrics);
  }
};
    }
};
MonitoringService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrometheusService !== "undefined" && PrometheusService) === "function" ? _a : Object, typeof (_b = typeof RedisService !== "undefined" && RedisService) === "function" ? _b : Object])
], MonitoringService);
export { MonitoringService };
//# sourceMappingURL=MonitoringService.js.map