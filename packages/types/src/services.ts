import type { AuthContextType } from './auth.js';
// import type { IService } from './core/index.js'; // Assuming IService is defined in core/interfaces.js and exported via core/index.js - ERROR: Not exported
import type { User } from './user.js';

/**
 * Base interface for services.
 */
export interface IService {
  // Example properties/methods; adjust as needed if a more specific contract was intended.
  // For now, keeping it minimal to satisfy the type checker.
  // It's possible this was just a marker interface or had a very generic contract.
  id?: string;
  name?: string;
  getStatus?(): Promise<string | ServiceStatus>; // Using ServiceStatus from this file
}

// TODO: Define service-related types and interfaces here.
// For example:

/**
 * Represents the configuration for a generic service.
 */
export interface ServiceConfig {
  id: string;
  name: string;
  version: string;
  // Add other common service configuration properties
}

/**
 * Represents the status of a service.
 */
export interface ServiceStatus {
  serviceId: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Interface for a generic authentication service.
 */
export interface IAuthService extends IService {
  login(credentials: unknown): Promise<AuthContextType['store']>;
  logout(): Promise<void>;
  register(details: unknown): Promise<User>;
  getCurrentUser(): Promise<User | null>;
}

// Re-export imported types or define specific service types
export type { AuthContextType, User };
