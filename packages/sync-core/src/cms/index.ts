/**
 * CMS Integration Module
 * 
 * Provides content management system integration with existing user and tenant systems.
 * Implements personal content management, project configuration sync, collaborative
 * content sharing, and private data isolation.
 */

export { PersonalContentManager } from './PersonalContentManager.js';
export { ProjectConfigurationSync } from './ProjectConfigurationSync.js';
export { CollaborativeContentService } from './CollaborativeContentService.js';
export { PrivateDataIsolationService } from './PrivateDataIsolationService.js';
export { CMSIntegrationService } from './CMSIntegrationService.js';

// Types
export type {
  ContentItem,
  ProjectConfiguration,
  CollaborationSettings,
  PrivacyBoundary,
  CMSConfig,
  ContentMetadata,
  SharingPermission
} from './types.js';