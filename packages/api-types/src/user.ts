/**
 * User-related type definitions
 */
import { UUID, ISODateTime } from './common.js';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export interface UserModel {
  id: UUID;
  email: string;
  username: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  lastLoginAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  role?: UserRole;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}