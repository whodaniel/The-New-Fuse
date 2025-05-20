// filepath: src/types/modules/winston-daily-rotate-file.d.ts
declare module "winston-daily-rotate-file" {
  import * as winston from "winston";

  interface DailyRotateFileTransportOptions {
    level?: string;
    filename?: string;
    dirname?: string;
    datePattern?: string;
    zippedArchive?: boolean;
    maxSize?: string;
    maxFiles?: string | number;
    auditFile?: string;
    frequency?: string;
    utc?: boolean;
    extension?: string;
    createSymlink?: boolean;
    symlinkName?: string;
    format?: unknown;
  }

  class DailyRotateFile {
    constructor(options: DailyRotateFileTransportOptions);
  }

  export = DailyRotateFile;
}
