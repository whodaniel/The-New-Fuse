import * as winston from 'winston';
interface TimeDeltaArgs {
    days?: number;
    seconds?: number;
    microseconds?: number;
    milliseconds?: number;
    minutes?: number;
    hours?: number;
    weeks?: number;
}
export declare class TimeDelta {
    private days;
    private seconds;
    private microseconds;
    constructor(args?: TimeDeltaArgs);
    private normalize;
    toMilliseconds(): number;
}
export declare class LRUCache<K, V> {
    private cache;
    private readonly maxSize;
    constructor(maxSize: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    clear(): void;
    size(): number;
}
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
export declare class LoggerManager {
    private static instance;
    private loggers;
    private readonly defaultLogDir;
    private constructor();
    static getInstance(): LoggerManager;
    private createRotatingHandler;
    private createTimedHandler;
    getLogger(options: LoggerOptions): winston.Logger;
}
export declare const loggerManager: LoggerManager;
export {};
