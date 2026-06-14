var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SystemResourceMonitorService_1;
import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
let SystemResourceMonitorService = SystemResourceMonitorService_1 = class SystemResourceMonitorService {
    constructor() {
        this.logger = new Logger(SystemResourceMonitorService_1.name);
    }
    getMemoryUsage() {
        const free = os.freemem();
        const total = os.totalmem();
        const used = total - free;
        return { free, total, used };
    }
    getCpuUsage() {
        const cpus = os.cpus();
        const total = cpus.reduce((acc, cpu) => {
            acc.total += Object.values(cpu.times).reduce((a, b) => a + b, 0);
            acc.idle += cpu.times.idle;
            return acc;
        }, { total: 0, idle: 0 });
        return 1 - total.idle / total.total;
    }
    getDiskUsage() {
        return new Promise((resolve, reject) => {
            // This is a placeholder for a more robust implementation that would
            // use a library like 'diskusage' to get disk usage information.
            resolve({ free: 0, total: 0, used: 0 });
        });
    }
};
SystemResourceMonitorService = SystemResourceMonitorService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], SystemResourceMonitorService);
export { SystemResourceMonitorService };
//# sourceMappingURL=system-resource-monitor.service.js.map