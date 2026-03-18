// Resource types for the Resources Dashboard
import type {
  ResourceCatalogItem as SharedResourceCatalogItem,
  ResourceSearchEnvelope as SharedResourceSearchEnvelope,
  ResourceSearchProtocolRequestEnvelope as SharedResourceSearchProtocolRequestEnvelope,
  ResourceSearchProtocolResponseEnvelope as SharedResourceSearchProtocolResponseEnvelope,
  ResourceSearchRequest as SharedResourceSearchRequest,
  ResourceSearchMeta as SharedResourceTraitScreenMeta,
} from '@the-new-fuse/types';

export type ResourceType = 'skill' | 'workflow' | 'template' | 'tool' | 'integration';
export type ResourceCategory =
  | 'development'
  | 'productivity'
  | 'communication'
  | 'data'
  | 'automation'
  | 'ai'
  | 'other';

export interface Resource extends SharedResourceCatalogItem {
  id: string;
  name: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  tags: string[];
  author: string;
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  featured: boolean;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  previewImage?: string;
}

export interface ClaudeSkill extends Resource {
  type: 'skill';
  skillType: 'mcp-tool' | 'prompt' | 'workflow' | 'integration';
  capabilities: string[];
  modelCompatibility: string[];
  examples: SkillExample[];
  documentation: string;
  sourceUrl?: string;
  installCommand?: string;
}

export interface SkillExample {
  title: string;
  description: string;
  input: string;
  output: string;
}

export interface N8NWorkflow extends Resource {
  type: 'workflow';
  nodes: number;
  triggers: string[];
  actions: string[];
  integrations: string[];
  complexity: 'simple' | 'medium' | 'complex';
  workflowData?: any;
  importUrl?: string;
}

export interface AgentTemplate extends Resource {
  type: 'template';
  templateType: 'chat' | 'task' | 'analysis' | 'automation';
  model: string;
  systemPrompt: string;
  capabilities: string[];
  configuration: Record<string, any>;
  requiredSkills: string[];
  optionalSkills: string[];
}

export interface ResourceFilter {
  search: NonNullable<SharedResourceSearchRequest['search']>;
  type: NonNullable<SharedResourceSearchRequest['type']>;
  category: NonNullable<SharedResourceSearchRequest['category']>;
  tags: NonNullable<SharedResourceSearchRequest['tags']>;
  featured: NonNullable<SharedResourceSearchRequest['featured']>;
  sortBy: NonNullable<SharedResourceSearchRequest['sortBy']>;
  traitScreen?: boolean;
  traitLimit?: number;
  traitThreshold?: number;
  includeTraitMeta?: boolean;
}

export type ResourceTraitScreenMeta = SharedResourceTraitScreenMeta;

export type ResourceSearchEnvelope = SharedResourceSearchEnvelope<Resource>;
export type ResourceSearchProtocolRequestEnvelope = SharedResourceSearchProtocolRequestEnvelope;
export type ResourceSearchProtocolResponseEnvelope =
  SharedResourceSearchProtocolResponseEnvelope<Resource>;

export interface ResourceSearchResult {
  items: Resource[];
  traitScreen: ResourceTraitScreenMeta | null;
}

export interface ResourceStats {
  totalResources: number;
  totalSkills: number;
  totalWorkflows: number;
  totalTemplates: number;
  totalDownloads: number;
  averageRating: number;
}

export interface FavoriteResource {
  resourceId: string;
  userId: string;
  addedAt: string;
}

export interface ResourceShare {
  resourceId: string;
  fromUserId?: string;
  toAgentId: string;
  sharedAt: string;
  notes?: string;
}
