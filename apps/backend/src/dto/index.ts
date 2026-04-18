/**
 * Data Transfer Objects (DTOs) for input validation
 *
 * All DTOs use class-validator decorators for automatic validation
 * through the global ValidationPipe configured in main.ts
 */

export * from './create-agent.dto.js';
export * from './login.dto.js';
export * from './register.dto.js';
export * from './update-agent.dto.js';
