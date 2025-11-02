import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class SystemResourceMonitorService {
    private readonly logger = new Logger(SystemResourceMonitorService.name);

    constructor() {}

    getMemoryUsage(): { free: number; total: number; used: number } {
        const free = os.freemem();
        const total = os.totalmem();
        const used = total - free;
        return { free, total, used };
    }

    getCpuUsage(): number {
        const cpus = os.cpus();
        const total = cpus.reduce((acc, cpu) => {
            acc.total += Object.values(cpu.times).reduce((a, b) => a + b, 0);
            acc.idle += cpu.times.idle;
            return acc;
        }, { total: 0, idle: 0 });
        return 1 - total.idle / total.total;
    }

    getDiskUsage(): Promise<{ free: number; total: number; used: number }> {
        return new Promise((resolve, reject) => {
            // This is a placeholder for a more robust implementation that would
            // use a library like 'diskusage' to get disk usage information.
            resolve({ free: 0, total: 0, used: 0 });
        });
    }
}
