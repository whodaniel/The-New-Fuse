const noop = () => undefined;
const logger = { info: noop, warn: noop, error: noop, debug: noop, log: noop, child: () => logger };
export const createLogger = () => logger;
export const format = { combine: noop, timestamp: noop, label: noop, printf: noop, colorize: noop, errors: noop, json: noop };
export const transports = { Console: function () {}, File: function () {} };
export default { createLogger, format, transports };
