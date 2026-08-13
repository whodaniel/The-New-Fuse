/**
 * CMS Integration Module
 *
 * Provides content management system integration with existing user and tenant systems.
 * Implements personal content management, project configuration sync, collaborative
 * content sharing, and private data isolation.
 */

export { CMSIntegrationService } from './CMSIntegrationService';
export { CollaborativeContentService } from './CollaborativeContentService';
export { PersonalContentManager } from './PersonalContentManager';
export { PrivateDataIsolationService } from './PrivateDataIsolationService';
export { ProjectConfigurationSync } from './ProjectConfigurationSync';

// Types
export type {
  CMSConfig,
  CollaborationSettings,
  ContentItem,
  ContentMetadata,
  PrivacyBoundary,
  ProjectConfiguration,
  SharingPermission,
} from './types';
