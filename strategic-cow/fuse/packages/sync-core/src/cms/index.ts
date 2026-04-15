/**
 * CMS Integration Module
 * 
 * Provides content management system integration with existing user and tenant systems.
 * Implements personal content management, project configuration sync, collaborative
 * content sharing, and private data isolation.
 */

export { PersonalContentManager } from './PersonalContentManager';
export { ProjectConfigurationSync } from './ProjectConfigurationSync';
export { CollaborativeContentService } from './CollaborativeContentService';
export { PrivateDataIsolationService } from './PrivateDataIsolationService';
export { CMSIntegrationService } from './CMSIntegrationService';

// Types
export type {
  ContentItem,
  ProjectConfiguration,
  CollaborationSettings,
  PrivacyBoundary,
  CMSConfig,
  ContentMetadata,
  SharingPermission
} from './types';