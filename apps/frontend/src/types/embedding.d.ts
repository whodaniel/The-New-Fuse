export interface BaseEmbeddingSettings {
    EmbeddingEngine?: string;
    EmbeddingModelPref?: string;
    EmbeddingModelMaxChunkLength?: number;
    HasExistingEmbeddings?: boolean;
    HasCachedEmbeddings?: boolean;
}
export interface OpenAiEmbeddingSettings extends BaseEmbeddingSettings {
    OpenAiKey?: string;
}
export interface AzureAiEmbeddingSettings extends BaseEmbeddingSettings {
    AzureApiKey?: string;
    AzureInstanceName?: string;
    AzureDeploymentName?: string;
    AzureApiVersion?: string;
}
export interface LocalAiEmbeddingSettings extends BaseEmbeddingSettings {
    LocalAiApiKey?: string;
}
export interface LMStudioEmbeddingSettings extends BaseEmbeddingSettings {
    LMStudioApiKey?: string;
}
export interface GenericOpenAiEmbeddingSettings extends BaseEmbeddingSettings {
    GenericOpenAiEmbeddingApiKey?: string;
    GenericOpenAiEmbeddingMaxConcurrentChunks?: number;
}
export interface MistralAiEmbeddingSettings extends BaseEmbeddingSettings {
    MistralAiApiKey?: string;
}
export interface CohereEmbeddingSettings extends BaseEmbeddingSettings {
    CohereApiKey?: string;
}
export interface VoyageAiEmbeddingSettings extends BaseEmbeddingSettings {
    VoyageAiApiKey?: string;
}
export interface LiteLLMEmbeddingSettings extends BaseEmbeddingSettings {
    LiteLLMApiKey?: string;
}
export type EmbeddingSettings = BaseEmbeddingSettings | OpenAiEmbeddingSettings | AzureAiEmbeddingSettings | LocalAiEmbeddingSettings | LMStudioEmbeddingSettings | GenericOpenAiEmbeddingSettings | MistralAiEmbeddingSettings | CohereEmbeddingSettings | VoyageAiEmbeddingSettings | LiteLLMEmbeddingSettings;
export interface EmbedderProps {
    name: string;
    value: string;
    image: string;
    description: string;
    checked: boolean;
    onClick: (value: string) => void;
}
export declare const EMBEDDING_PROVIDERS: readonly ["native", "openai", "azure", "localai", "ollama", "lmstudio", "cohere", "voyageai", "litellm", "mistral", "generic-openai"];
export type EmbeddingProvider = typeof EMBEDDING_PROVIDERS[number];
export interface CustomModel {
    id: string;
    name?: string;
    description?: string;
}
export interface SystemUpdateResponse {
    error?: string;
    success?: boolean;
}
export declare const COMMON_STYLES: {
    container: string;
    inputsContainer: string;
    inputWrapper: string;
    label: string;
    labelWithOptional: string;
    optionalText: string;
    input: string;
    select: string;
    advancedButton: string;
    autoDetectButton: string;
    caretIcon: string;
};
