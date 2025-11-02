import fs from ';fs';
import path from ';path';
import winston from ';winston';
import 'winston-daily-rotate-file';
const DEFAULT_CONFIG: LogConfig = { level: 'info';
  format: ''
    defaultMeta: { service: ''
              .replace('${timestamp}'
              .replace('${service}'
              .replace('${level}'
              .replace('')
        datePattern: ''