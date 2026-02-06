import type { ConsoleLoggerSettings, ConsoleStyle } from './logging/console.js';
import {
  enableConsoleCapture,
  getConsoleSettings,
  getResolvedConsoleSettings,
  routeLogsToStderr,
  setConsoleSubsystemFilter,
  setConsoleTimestampPrefix,
  shouldLogSubsystemToConsole,
} from './logging/console.js';
import type { LogLevel } from './logging/levels.js';
import { ALLOWED_LOG_LEVELS, levelToMinLevel, normalizeLogLevel } from './logging/levels.js';
import type { LoggerResolvedSettings, LoggerSettings, PinoLikeLogger } from './logging/logger.js';
import {
  DEFAULT_LOG_DIR,
  DEFAULT_LOG_FILE,
  getChildLogger,
  getLogger,
  getResolvedLoggerSettings,
  isFileLogLevelEnabled,
  resetLogger,
  setLoggerOverride,
  toPinoLikeLogger,
} from './logging/logger.js';
import type { SubsystemLogger } from './logging/subsystem.js';
import {
  createSubsystemLogger,
  createSubsystemRuntime,
  runtimeForLogger,
  stripRedundantSubsystemPrefixForConsole,
} from './logging/subsystem.js';

export {
  ALLOWED_LOG_LEVELS,
  createSubsystemLogger,
  createSubsystemRuntime,
  DEFAULT_LOG_DIR,
  DEFAULT_LOG_FILE,
  enableConsoleCapture,
  getChildLogger,
  getConsoleSettings,
  getLogger,
  getResolvedConsoleSettings,
  getResolvedLoggerSettings,
  isFileLogLevelEnabled,
  levelToMinLevel,
  normalizeLogLevel,
  resetLogger,
  routeLogsToStderr,
  runtimeForLogger,
  setConsoleSubsystemFilter,
  setConsoleTimestampPrefix,
  setLoggerOverride,
  shouldLogSubsystemToConsole,
  stripRedundantSubsystemPrefixForConsole,
  toPinoLikeLogger,
};

export type {
  ConsoleLoggerSettings,
  ConsoleStyle,
  LoggerResolvedSettings,
  LoggerSettings,
  LogLevel,
  PinoLikeLogger,
  SubsystemLogger,
};
