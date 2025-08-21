/**
 * CMS Integration Types
 * 
 * Type definitions for the Content Management System integration
 * with existing user and tenant systems.
 */

import { UserRole } from '@prisma/client';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  metadata: ContentMetadata;
  ownerId: string;
  tenantId?: string;
  privacy: PrivacyLevel;
  sharingSettings: SharingSettings;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  checksum: string;
}

export interface ProjectConfiguration {
  id: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  ownerId: string;
  tenantId?: string;
  privacy: PrivacyLevel;
  collaborators: Collaborator[];
  syncSettings: SyncSettings;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CollaborationSettings {
  allowedRoles: UserRole[];
  permissions: Permission[];
  accessLevel: AccessLevel;
  expiresAt?: Date;
}

export interface PrivacyBoundary {
  tenantId: string;
  userId: string;
  dataTypes: string[];
  restrictions: Restriction[];
  auditRequired: boolean;
}

export interface CMSConfig {
  enablePersonalContent: boolean;
  enableProjectSync: boolean;
  enableCollaboration: boolean;
  defaultPrivacy: PrivacyLevel;
  maxContentSize: number;
  allowedContentTypes: ContentType[];
  syncInterval: number;
}

export interface ContentMetadata {
  tags: string[];
  category?: string;
  language?: string;
  format: string;
  size: number;
  lastAccessed?: Date;
  accessCount: number;
  customFields?: Record<string, any>;
}

export interface SharingPermission {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface Collaborator {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  addedAt: Date;
  addedBy: string;
}

export interface SharingSettings {
  isPublic: boolean;
  allowedUsers: string[];
  allowedRoles: UserRole[];
  permissions: SharingPermission[];
}

export interface SyncSettings {
  enabled: boolean;
  frequency: SyncFrequency;
  conflictResolution: ConflictResolutionStrategy;
  backupEnabled: boolean;
  versionHistory: boolean;
}

export interface Restriction {
  type: RestrictionType;
  value: string;
  description?: string;
}

export enum ContentType {
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  CONFIGURATION = 'configuration',
  SCRIPT = 'script',
  DATA = 'data',
  MEDIA = 'media',
  PROJECT = 'project'
}

export enum PrivacyLevel {
  PRIVATE = 'private',
  TENANT = 'tenant',
  SHARED = 'shared',
  PUBLIC = 'public'
}

export enum AccessLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin'
}

export enum SyncFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_HOUR = 'every_hour',
  DAILY = 'daily',
  MANUAL = 'manual'
}

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual',
  VERSION_BRANCH = 'version_branch'
}

export enum RestrictionType {
  IP_ADDRESS = 'ip_address',
  TIME_WINDOW = 'time_window',
  GEOGRAPHIC = 'geographic',
  DEVICE = 'device',
  ROLE_BASED = 'role_based'
}

export interface CMSEvent {
  type: CMSEventType;
  contentId: string;
  userId: string;
  tenantId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export enum CMSEventType {
  CONTENT_CREATED = 'content_created',
  CONTENT_UPDATED = 'content_updated',
  CONTENT_DELETED = 'content_deleted',
  CONTENT_SHARED = 'content_shared',
  CONTENT_ACCESSED = 'content_accessed',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  SYNC_COMPLETED = 'sync_completed',
  CONFLICT_DETECTED = 'conflict_detected'
}