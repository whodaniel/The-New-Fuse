export interface LLMProviderSettings {
  basePath?: string;
  apiKey?: string;
  modelPref?: string;
  tokenLimit?: number;
}

export interface LLMModel {
  id: string;
  organization?: string;
}

export interface BaseLLMOptionsProps {
  settings: LLMProviderSettings;
  showAlert?: boolean;
}

export interface ModelSelectionProps {
  settings: LLMProviderSettings;
  basePath: string | null;
  apiKey?: string | null;
}