import { Repository, DataSource, FindManyOptions } from 'typeorm';
import { Log, LogLevel } from '../entities/Log.js';
export declare class LogRepository extends Repository<Log> {
    private dataSource;
    constructor(dataSource: DataSource);
    findByLevel(level: LogLevel, options?: FindManyOptions<Log>): Promise<Log[]>;
    findByTimeRange(startTime: Date, endTime: Date): Promise<Log[]>;
    searchLogs(searchTerm: string, limit?: number): Promise<Log[]>;
    getLogStatistics(since: Date): Promise<{
        level: string;
        count: number;
    }[]>;
    getTopContexts(since: Date, limit?: number): Promise<{
        context: string;
        count: number;
    }[]>;
    deleteOldLogs(beforeDate: Date): Promise<number>;
}
//# sourceMappingURL=LogRepository.d.ts.map