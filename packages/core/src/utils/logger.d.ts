/**
 * Enhanced logger utility for MCP components with file output,
 * log rotation, and structured logging support.
 */
import { EventEmitter } from 'events';
export declare enum LogLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
export declare class Logger extends EventEmitter {
    private readonly name;
    private static level;
    private static enableConsole;
    private static enableFile;
    private static logDir;
    private static maxFileSize;
    private static maxFiles;
    private static structured;
    private static currentLogFile;
    private static currentFileSize;
    constructor(name: string);
    private ensureLogDirectory;
}
