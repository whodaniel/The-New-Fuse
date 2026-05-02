export type PromptSnippetKind =
  | 'text'
  | 'variable'
  | 'instruction'
  | 'example'
  | 'persona'
  | 'constraint'
  | 'tooling'
  | 'context';

export type PromptComposerPlacement =
  | 'workflow-builder-module'
  | 'side-menu'
  | 'standalone';

export type PromptMenuItemKind =
  | 'route'
  | 'prompt'
  | 'prompt-group'
  | 'snippet'
  | 'workflow'
  | 'tool'
  | 'separator';

export interface PromptSnippetReference {
  snippetId: string;
  required?: boolean;
}

export interface PromptSnippet {
  id: string;
  title: string;
  content: string;
  kind: PromptSnippetKind;
  tags: string[];
  description?: string;
  variables?: string[];
  references?: PromptSnippetReference[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptGroup {
  id: string;
  title: string;
  description?: string;
  snippetIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptDocumentSection {
  id: string;
  snippetId: string;
  order: number;
  required?: boolean;
}

export interface PromptDocument {
  id: string;
  title: string;
  description?: string;
  groupIds: string[];
  sections: PromptDocumentSection[];
  tags: string[];
  placements: PromptComposerPlacement[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptComposerState {
  snippets: PromptSnippet[];
  groups: PromptGroup[];
  prompts: PromptDocument[];
  activePromptId?: string;
  activeGroupId?: string;
  selectedSnippetIds: string[];
}

export interface PromptMenuItem {
  id: string;
  kind: PromptMenuItemKind;
  label: string;
  order: number;
  route?: string;
  linkedPromptId?: string;
  linkedGroupId?: string;
  linkedSnippetId?: string;
  icon?: string;
  visible?: boolean;
  children?: PromptMenuItem[];
}

export interface PromptSidebarCustomization {
  version: number;
  items: PromptMenuItem[];
  updatedAt: string;
}

export interface PromptComposerModuleConfig {
  enabled: boolean;
  placements: PromptComposerPlacement[];
  allowSnippetReuse: boolean;
  allowMenuCustomization: boolean;
  allowWorkflowEmbedding: boolean;
  defaultPromptTags: string[];
}

export interface PromptComposerSnapshot {
  config: PromptComposerModuleConfig;
  state: PromptComposerState;
  sidebar: PromptSidebarCustomization;
}
