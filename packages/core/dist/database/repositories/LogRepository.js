var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Between } from 'typeorm';
import { Log } from '../entities/Log.js';
let LogRepository = class LogRepository extends Repository {
    constructor(dataSource) {
        super(Log, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    async findByLevel(level, options) {
        return this.find({
            ...options,
            where: { level },
            order: { timestamp: 'DESC' },
        });
    }
    async findByTimeRange(startTime, endTime) {
        return this.find({
            where: {
                timestamp: Between(startTime, endTime),
            },
            order: { timestamp: 'DESC' },
        });
    }
    async searchLogs(searchTerm, limit = 100) {
        return this.createQueryBuilder('log')
            .where('log.message ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orderBy('log.timestamp', 'DESC')
            .limit(limit)
            .getMany();
    }
    async getLogStatistics(since) {
        const result = await this.createQueryBuilder('log')
            .select('log.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .where('log.timestamp >= :since', { since })
            .groupBy('log.level')
            .getRawMany();
        return result;
    }
    async getTopContexts(since, limit = 10) {
        const topContextsResult = await this.createQueryBuilder('log')
            .select('log.context', 'context')
            .addSelect('COUNT(*)', 'count')
            .where('log.timestamp >= :since', { since })
            .andWhere('log.context IS NOT NULL')
            .groupBy('log.context')
            .orderBy('COUNT(*)', 'DESC')
            .limit(limit)
            .getRawMany();
        return topContextsResult;
    }
    async deleteOldLogs(beforeDate) {
        const result = await this.delete({
            timestamp: Between(new Date(0), beforeDate),
        });
        return result.affected ?? 0;
    }
};
LogRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DataSource])
], LogRepository);
export { LogRepository };
//# sourceMappingURL=LogRepository.js.map