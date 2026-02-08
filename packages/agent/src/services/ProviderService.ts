import { AuthProfile, ProviderConfig, ProviderDefinition } from '@the-new-fuse/types';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class ProviderService {
  private configPath: string;
  private providersPath: string;
  private authProfilesPath: string;

  private builtInProviders: ProviderDefinition[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      authMode: 'api_key',
      apiFormat: 'openai',
      enabled: true,
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          providerId: 'openai',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text', 'image'],
          contextWindow: 128000,
          maxTokens: 4096,
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          providerId: 'openai',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text', 'image'],
          contextWindow: 128000,
          maxTokens: 4096,
        },
        {
          id: 'o1-preview',
          name: 'o1 Preview',
          providerId: 'openai',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 32768,
        },
      ],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      authMode: 'api_key',
      apiFormat: 'anthropic',
      enabled: true,
      models: [
        {
          id: 'claude-3-5-sonnet-20240620',
          name: 'Claude 3.5 Sonnet',
          providerId: 'anthropic',
          apiFormat: 'anthropic',
          reasoning: false,
          capabilities: ['text', 'image'],
          contextWindow: 200000,
          maxTokens: 8192,
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          providerId: 'anthropic',
          apiFormat: 'anthropic',
          reasoning: false,
          capabilities: ['text', 'image'],
          contextWindow: 200000,
          maxTokens: 4096,
        },
      ],
    },
    {
      id: 'google',
      name: 'Google Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com',
      authMode: 'api_key',
      apiFormat: 'google',
      enabled: true,
      models: [
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          providerId: 'google',
          apiFormat: 'google',
          reasoning: false,
          capabilities: ['text', 'image', 'audio', 'video'],
          contextWindow: 2000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          providerId: 'google',
          apiFormat: 'google',
          reasoning: false,
          capabilities: ['text', 'image', 'audio', 'video'],
          contextWindow: 1000000,
          maxTokens: 8192,
        },
      ],
    },
    {
      id: 'sambanova',
      name: 'SambaNova Cloud',
      baseUrl: 'https://api.sambanova.ai/v1',
      authMode: 'api_key',
      apiFormat: 'openai',
      enabled: true,
      models: [
        {
          id: 'llama3-405b-instruct',
          name: 'Llama 3.1 405B',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 4096,
        },
        {
          id: 'llama3-70b-instruct',
          name: 'Llama 3.1 70B',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 4096,
        },
        {
          id: 'llama3-8b-instruct',
          name: 'Llama 3.1 8B',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 4096,
        },
        {
          id: 'allama-7b-instruct-preview',
          name: 'ALLaM-7B-Instruct-preview',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'deepseek-r1',
          name: 'DeepSeek-R1',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 64000,
          maxTokens: 4096,
        },
        {
          id: 'deepseek-r1-distill-llama-70b',
          name: 'DeepSeek-R1-Distill-Llama-70B',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 64000,
          maxTokens: 4096,
        },
        {
          id: 'deepseek-v3-1-cb',
          name: 'DeepSeek-V3.1-cb',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'deepseek-v3-2',
          name: 'DeepSeek-V3.2',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'e5-mistral-7b-instruct',
          name: 'E5-Mistral-7B-Instruct',
          providerId: 'sambanova',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 32000,
          maxTokens: 4096,
        },
      ],
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      authMode: 'api_key',
      apiFormat: 'openai',
      enabled: true,
      models: [
        {
          id: 'qwen/qwen3-coder-next',
          name: 'Qwen3 Coder Next',
          providerId: 'openrouter',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 262144,
          maxTokens: 4096,
        },
        {
          id: 'qwen/qwen3-coder',
          name: 'Qwen3 Coder 480B',
          providerId: 'openrouter',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 262144,
          maxTokens: 4096,
        },
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          providerId: 'openrouter',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text', 'image'],
          contextWindow: 200000,
          maxTokens: 8192,
        },
      ],
    },
    {
      id: 'siliconflow',
      name: 'SiliconFlow',
      baseUrl: 'https://api.siliconflow.cn/v1',
      authMode: 'api_key',
      apiFormat: 'openai',
      enabled: true,
      models: [
        {
          id: 'deepseek-ai/DeepSeek-V3',
          name: 'DeepSeek V3',
          providerId: 'siliconflow',
          apiFormat: 'openai',
          reasoning: false,
          capabilities: ['text'],
          contextWindow: 64000,
          maxTokens: 4096,
        },
        {
          id: 'deepseek-ai/DeepSeek-R1',
          name: 'DeepSeek R1',
          providerId: 'siliconflow',
          apiFormat: 'openai',
          reasoning: true,
          capabilities: ['text'],
          contextWindow: 64000,
          maxTokens: 4096,
        },
      ],
    },
    {
      id: 'google-antigravity',
      name: 'Google Antigravity',
      baseUrl: 'https://cloudcode-pa.googleapis.com',
      authMode: 'oauth',
      apiFormat: 'google',
      enabled: true,
      models: [
        {
          id: 'claude-opus-4-5-thinking',
          name: 'Claude 4.5 Thinking',
          providerId: 'google-antigravity',
          apiFormat: 'google',
          reasoning: true,
          capabilities: ['text', 'image'],
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-3-pro',
          name: 'Gemini 3 Pro',
          providerId: 'google-antigravity',
          apiFormat: 'google',
          reasoning: false,
          capabilities: ['text', 'image', 'audio', 'video'],
          contextWindow: 2000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-3-flash',
          name: 'Gemini 3 Flash',
          providerId: 'google-antigravity',
          apiFormat: 'google',
          reasoning: false,
          capabilities: ['text', 'image', 'audio', 'video'],
          contextWindow: 1000000,
          maxTokens: 8192,
        },
      ],
    },
  ];

  constructor(rootPath?: string) {
    const root = rootPath || path.join(os.homedir(), '.tnf');
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    this.configPath = path.join(root, 'provider-config.json');
    this.providersPath = path.join(root, 'custom-providers.json');
    this.authProfilesPath = path.join(root, 'auth-profiles.json');

    this.ensureFiles();
  }

  private ensureFiles() {
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(
          {
            primaryModelId: 'openai/gpt-4o',
            fallbackModelIds: ['anthropic/claude-3-5-sonnet-20240620'],
            preferredProfiles: {},
          },
          null,
          2
        )
      );
    }
    if (!fs.existsSync(this.providersPath)) {
      fs.writeFileSync(this.providersPath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.authProfilesPath)) {
      fs.writeFileSync(this.authProfilesPath, JSON.stringify([], null, 2));
    }
  }

  public listProviders(): ProviderDefinition[] {
    const customProviders = JSON.parse(
      fs.readFileSync(this.providersPath, 'utf8')
    ) as ProviderDefinition[];
    return [...this.builtInProviders, ...customProviders];
  }

  public getProvider(id: string): ProviderDefinition | undefined {
    return this.listProviders().find((p) => p.id === id);
  }

  public addCustomProvider(provider: ProviderDefinition): void {
    const customProviders = JSON.parse(
      fs.readFileSync(this.providersPath, 'utf8')
    ) as ProviderDefinition[];
    const index = customProviders.findIndex((p) => p.id === provider.id);
    if (index !== -1) {
      customProviders[index] = { ...provider, isCustom: true };
    } else {
      customProviders.push({ ...provider, isCustom: true });
    }
    fs.writeFileSync(this.providersPath, JSON.stringify(customProviders, null, 2));
  }

  public getAuthProfiles(): AuthProfile[] {
    return JSON.parse(fs.readFileSync(this.authProfilesPath, 'utf8')) as AuthProfile[];
  }

  public addAuthProfile(profile: AuthProfile): void {
    const profiles = this.getAuthProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index !== -1) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    fs.writeFileSync(this.authProfilesPath, JSON.stringify(profiles, null, 2));
  }

  public removeAuthProfile(id: string): void {
    const profiles = this.getAuthProfiles();
    const filtered = profiles.filter((p) => p.id !== id);
    fs.writeFileSync(this.authProfilesPath, JSON.stringify(filtered, null, 2));
  }

  public getConfig(): ProviderConfig {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8')) as ProviderConfig;
  }

  public saveConfig(config: ProviderConfig): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }
}
