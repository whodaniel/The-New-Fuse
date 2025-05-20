import { createLogger, format, transports } from 'winston';

const { combine, timestamp, label, printf, errors } = format;

const logger = createLogger({
    format: combine(
        label({ label: 'app' }),
        timestamp(),
        errors({ stack: true }),
        printf(({ level, message, label, timestamp, stack }) => {
            return `${timestamp} [${label}] ${level}: ${stack || message}`;
        })
    ),
    transports: [
        new transports.Console()
    ]
});

export default logger;
