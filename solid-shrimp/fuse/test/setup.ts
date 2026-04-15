// This file will run before each test
import winston from 'winston';

// Configure real Winston logger for tests
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Export logger for use in tests
export default logger;
