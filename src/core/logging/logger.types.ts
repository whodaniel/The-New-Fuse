// filepath: src/core/logging/(logger as any).types.ts
import winston from "winston";

export interface LoggerConfig {
  level?: string;
  file?: {
    enabled?: boolean;
    path?: string;
    level?: string;
    maxSize?: number;
    maxFiles?: number;
  };
  console?: {
    enabled?: boolean;
    level?: string;
    colorize?: boolean;
  };
  elastic?: {
    enabled?: boolean;
    level?: string;
    node?: string;
    index?: string;
  };
}

// Re-export winston's Logger type to avoid namespace issues
export type Logger = winston.Logger;

// Default logging configuration
export const defaultLoggingConfig: LoggerConfig = {
  level: "info",
  file: {
    enabled: true,
    path: "logs/app.log",
    level: "info",
    maxSize: 5242880, // 5MB
    maxFiles: 5,
  },
  console: {
    enabled: true,
    level: "debug",
    colorize: true,
  },
};
