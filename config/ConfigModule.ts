import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as os from 'os';
import { format as dateFnsFormat } from 'date-fns';
import { TransformableInfo } from 'logform';

// Time Management
interface TimeDeltaArgs {
    days?: number;
    seconds?: number;
    microseconds?: number;
    milliseconds?: number;
    minutes?: number;
    hours?: number;
    weeks?: number;
}

export class TimeDelta {
    private days: number;
    private seconds: number;
    private microseconds: number;

    constructor(args: TimeDeltaArgs = {}) {
        this.days = args.days || 0;
        this.seconds = args.seconds || 0;
        this.microseconds = args.microseconds || 0;

        if (args.milliseconds) {
            this.microseconds += args.milliseconds * 1000;
        }
        if (args.minutes) {
            this.seconds += args.minutes * 60;
        }
        if (args.hours) {
            this.seconds += args.hours * 3600;
        }
        if (args.weeks) {
            this.days += args.weeks * 7;
        }

        this.normalize();
    }

    private normalize(): void {
        // Convert excess microseconds to seconds
        const extraSeconds = Math.floor(this.microseconds / 1_000_000);
        this.microseconds %= 1_000_000;
        this.seconds += extraSeconds;

        // Convert excess seconds to days
        const extraDays = Math.floor(this.seconds / 86400);
        this.seconds %= 86400;
        this.days += extraDays;
    }

    public toMilliseconds(): number {
        return (
            this.days * 86400000 +
            this.seconds * 1000 +
            Math.floor(this.microseconds / 1000)
        );
    }
}

// Caching
export class LRUCache<K, V> {
    private cache: Map<K, { value: V; timestamp: number }>;
    private readonly maxSize: number;

    constructor(maxSize: number) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (item) {
            item.timestamp = Date.now();
            return item.value;
        }
        return undefined;
    }

    set(key: K, value: V): void {
        if (this.cache.size >= this.maxSize) {
            let oldestKey: K | null = null;
            let oldestTimestamp = Infinity;

            this.cache.forEach((value, key) => {
                if (value.timestamp < oldestTimestamp) {
                    oldestTimestamp = value.timestamp;
                    oldestKey = key;
                }
            });

            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Logging
interface LoggerOptions {
    name: string;
    level?: string;
    enableJson?: boolean;
    enableConsole?: boolean;
    enableFile?: boolean;
    logDir?: string;
    correlationId?: string;
    component?: string;
}

class JsonFormatter {
    static transform(info: TransformableInfo): TransformableInfo {
        const logRecord: any = { ...info };
        
        logRecord.timestamp = dateFnsFormat(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        logRecord.level = info.level;
        
        if (info.correlation_id) {
            logRecord.correlation_id = info.correlation_id;
        }
        if (info.component) {
            logRecord.component = info.component;
        }
        
        return logRecord;
    }
}

export class LoggerManager {
    private static instance: LoggerManager;
    private loggers: Map<string, winston.Logger>;
    private readonly defaultLogDir: string = 'logs';
    
    private constructor() {
        this.loggers = new Map();
    }

    static getInstance(): LoggerManager {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }

    private createRotatingHandler(
        filename: string,
        maxBytes: number = 10485760,
        backupCount: number = 5
    ): Transport {
        os.mkdirSync(this.defaultLogDir, { recursive: true });
        return new winston.transports.File({
            filename: `${this.defaultLogDir}/${filename}`,
            maxsize: maxBytes,
            maxFiles: backupCount,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        });
    }

    private createTimedHandler(
        filename: string,
        when: string = 'midnight',
        interval: number = 1,
        backupCount: number = 30
    ): Transport {
        os.mkdirSync(this.defaultLogDir, { recursive: true });
        return new winston.transports.File({
            filename: `${this.defaultLogDir}/${filename}`,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        });
    }

    getLogger(options: LoggerOptions): winston.Logger {
        if (this.loggers.has(options.name)) {
            return this.loggers.get(options.name)!;
        }

        const transports: Transport[] = [];

        if (options.enableConsole) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }

        if (options.enableFile) {
            transports.push(
                this.createRotatingHandler(`${options.name}.log`)
            );
        }

        const logger = winston.createLogger({
            level: options.level || 'info',
            format: winston.format.combine(
                winston.format(JsonFormatter.transform)(),
                winston.format.json()
            ),
            defaultMeta: {
                component: options.component,
                correlation_id: options.correlationId
            },
            transports
        });

        this.loggers.set(options.name, logger);
        return logger;
    }
}

// Export singleton instances
export const loggerManager = LoggerManager.getInstance();
