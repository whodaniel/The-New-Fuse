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
export type Logger = winston.Logger;
export declare const defaultLoggingConfig: LoggerConfig;
