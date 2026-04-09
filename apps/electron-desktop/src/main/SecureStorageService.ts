/**
 * SecureStorageService - Secure API Key Storage using Electron's safeStorage
 * 
 * Uses OS-level encryption:
 * - macOS: Keychain
 * - Windows: DPAPI (Data Protection API)
 * - Linux: libsecret or kwallet
 */

import { safeStorage, app } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as crypto from 'crypto';

export interface StoredCredential {
  id: string;
  name: string;
  provider: string;
  category: CredentialCategory;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CredentialMetadata {
  credentials: StoredCredential[];
  customProviders: ProviderInfo[];
  version: number;
}

export type CredentialCategory = 
  | 'ai' 
  | 'google' 
  | 'mcp' 
  | 'blockchain' 
  | 'database' 
  | 'messaging' 
  | 'devtools' 
  | 'custom';

export interface ProviderInfo {
  id: string;
  name: string;
  category: CredentialCategory;
  envKey: string;
  placeholder: string;
  description?: string;
  docsUrl?: string;
  icon?: string;
  isCustom?: boolean;
}

// Category metadata for UI display
export const CREDENTIAL_CATEGORIES: Record<CredentialCategory, { name: string; icon: string; description: string }> = {
  ai: {
    name: 'AI & LLM Providers',
    icon: 'brain',
    description: 'API keys for AI language models and services',
  },
  google: {
    name: 'Google Services',
    icon: 'google',
    description: 'OAuth and API credentials for Google APIs',
  },
  mcp: {
    name: 'MCP Servers',
    icon: 'server',
    description: 'Credentials for Model Context Protocol servers',
  },
  blockchain: {
    name: 'Blockchain & DeFi',
    icon: 'link',
    description: 'API keys for blockchain and DeFi services',
  },
  database: {
    name: 'Database & Storage',
    icon: 'database',
    description: 'Connection strings and credentials for databases',
  },
  messaging: {
    name: 'Messaging & Communication',
    icon: 'message',
    description: 'API keys for messaging and notification services',
  },
  devtools: {
    name: 'Developer Tools',
    icon: 'code',
    description: 'API keys for development and monitoring services',
  },
  custom: {
    name: 'Custom Integrations',
    icon: 'puzzle',
    description: 'Your own custom API keys and credentials',
  },
};

// Built-in credential providers organized by category
export const CREDENTIAL_PROVIDERS: Record<string, ProviderInfo> = {
  // AI & LLM Providers
  openai: {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    envKey: 'OPENAI_API_KEY',
    placeholder: 'sk-...',
    description: 'GPT-4, GPT-3.5, DALL-E, Whisper APIs',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    category: 'ai',
    envKey: 'ANTHROPIC_API_KEY',
    placeholder: 'sk-ant-...',
    description: 'Claude AI models',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  google_ai: {
    id: 'google_ai',
    name: 'Google AI (Gemini)',
    category: 'ai',
    envKey: 'GOOGLE_AI_API_KEY',
    placeholder: 'AIza...',
    description: 'Gemini Pro, Gemini Ultra models',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    category: 'ai',
    envKey: 'COHERE_API_KEY',
    placeholder: '',
    description: 'Embed, Generate, Classify APIs',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'ai',
    envKey: 'MISTRAL_API_KEY',
    placeholder: '',
    description: 'Mistral, Mixtral models',
    docsUrl: 'https://console.mistral.ai/api-keys',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    category: 'ai',
    envKey: 'GROQ_API_KEY',
    placeholder: 'gsk_...',
    description: 'Ultra-fast LLM inference',
    docsUrl: 'https://console.groq.com/keys',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'ai',
    envKey: 'PERPLEXITY_API_KEY',
    placeholder: 'pplx-...',
    description: 'Perplexity AI search and chat',
    docsUrl: 'https://www.perplexity.ai/settings/api',
  },
  together: {
    id: 'together',
    name: 'Together AI',
    category: 'ai',
    envKey: 'TOGETHER_API_KEY',
    placeholder: '',
    description: 'Open-source model hosting',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
  },
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    category: 'ai',
    envKey: 'REPLICATE_API_TOKEN',
    placeholder: 'r8_...',
    description: 'Run ML models in the cloud',
    docsUrl: 'https://replicate.com/account/api-tokens',
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face',
    category: 'ai',
    envKey: 'HUGGINGFACE_API_KEY',
    placeholder: 'hf_...',
    description: 'Inference API for ML models',
    docsUrl: 'https://huggingface.co/settings/tokens',
  },

  // Google Services
  google_oauth: {
    id: 'google_oauth',
    name: 'Google OAuth Client',
    category: 'google',
    envKey: 'GOOGLE_CLIENT_ID',
    placeholder: '...apps.googleusercontent.com',
    description: 'OAuth 2.0 Client ID for Google sign-in',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  google_oauth_secret: {
    id: 'google_oauth_secret',
    name: 'Google OAuth Secret',
    category: 'google',
    envKey: 'GOOGLE_CLIENT_SECRET',
    placeholder: 'GOCSPX-...',
    description: 'OAuth 2.0 Client Secret',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive API',
    category: 'google',
    envKey: 'GOOGLE_DRIVE_API_KEY',
    placeholder: 'AIza...',
    description: 'API key for Google Drive access',
    docsUrl: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
  },
  google_docs: {
    id: 'google_docs',
    name: 'Google Docs API',
    category: 'google',
    envKey: 'GOOGLE_DOCS_API_KEY',
    placeholder: 'AIza...',
    description: 'API key for Google Docs access',
    docsUrl: 'https://console.cloud.google.com/apis/library/docs.googleapis.com',
  },
  google_sheets: {
    id: 'google_sheets',
    name: 'Google Sheets API',
    category: 'google',
    envKey: 'GOOGLE_SHEETS_API_KEY',
    placeholder: 'AIza...',
    description: 'API key for Google Sheets access',
    docsUrl: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Data API',
    category: 'google',
    envKey: 'YOUTUBE_API_KEY',
    placeholder: 'AIza...',
    description: 'API key for YouTube data access',
    docsUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  },
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar API',
    category: 'google',
    envKey: 'GOOGLE_CALENDAR_API_KEY',
    placeholder: 'AIza...',
    description: 'API key for Google Calendar',
    docsUrl: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
  },
  google_gmail: {
    id: 'google_gmail',
    name: 'Gmail API',
    category: 'google',
    envKey: 'GMAIL_API_KEY',
    placeholder: 'AIza...',
    description: 'API access to Gmail',
    docsUrl: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
  },

  // MCP Servers
  mcp_github: {
    id: 'mcp_github',
    name: 'GitHub MCP Server',
    category: 'mcp',
    envKey: 'GITHUB_TOKEN',
    placeholder: 'ghp_...',
    description: 'Personal access token for GitHub MCP',
    docsUrl: 'https://github.com/settings/tokens',
  },
  mcp_slack: {
    id: 'mcp_slack',
    name: 'Slack MCP Server',
    category: 'mcp',
    envKey: 'SLACK_BOT_TOKEN',
    placeholder: 'xoxb-...',
    description: 'Bot token for Slack MCP',
    docsUrl: 'https://api.slack.com/apps',
  },
  mcp_notion: {
    id: 'mcp_notion',
    name: 'Notion MCP Server',
    category: 'mcp',
    envKey: 'NOTION_API_KEY',
    placeholder: 'secret_...',
    description: 'Integration token for Notion MCP',
    docsUrl: 'https://www.notion.so/my-integrations',
  },
  mcp_linear: {
    id: 'mcp_linear',
    name: 'Linear MCP Server',
    category: 'mcp',
    envKey: 'LINEAR_API_KEY',
    placeholder: 'lin_api_...',
    description: 'API key for Linear MCP',
    docsUrl: 'https://linear.app/settings/api',
  },
  mcp_jira: {
    id: 'mcp_jira',
    name: 'Jira MCP Server',
    category: 'mcp',
    envKey: 'JIRA_API_TOKEN',
    placeholder: '',
    description: 'API token for Jira MCP',
    docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
  },
  mcp_confluence: {
    id: 'mcp_confluence',
    name: 'Confluence MCP Server',
    category: 'mcp',
    envKey: 'CONFLUENCE_API_TOKEN',
    placeholder: '',
    description: 'API token for Confluence MCP',
    docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
  },

  // Blockchain & DeFi
  enso: {
    id: 'enso',
    name: 'Enso Finance',
    category: 'blockchain',
    envKey: 'ENSO_API_KEY',
    placeholder: '',
    description: 'DeFi intents and shortcuts API',
    docsUrl: 'https://docs.enso.finance',
  },
  alchemy: {
    id: 'alchemy',
    name: 'Alchemy',
    category: 'blockchain',
    envKey: 'ALCHEMY_API_KEY',
    placeholder: '',
    description: 'Web3 infrastructure and APIs',
    docsUrl: 'https://dashboard.alchemy.com',
  },
  infura: {
    id: 'infura',
    name: 'Infura',
    category: 'blockchain',
    envKey: 'INFURA_API_KEY',
    placeholder: '',
    description: 'Ethereum and IPFS APIs',
    docsUrl: 'https://infura.io/dashboard',
  },
  etherscan: {
    id: 'etherscan',
    name: 'Etherscan',
    category: 'blockchain',
    envKey: 'ETHERSCAN_API_KEY',
    placeholder: '',
    description: 'Ethereum blockchain explorer API',
    docsUrl: 'https://etherscan.io/myapikey',
  },
  moralis: {
    id: 'moralis',
    name: 'Moralis',
    category: 'blockchain',
    envKey: 'MORALIS_API_KEY',
    placeholder: '',
    description: 'Web3 data and authentication',
    docsUrl: 'https://admin.moralis.io/api',
  },

  // Database & Storage
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    category: 'database',
    envKey: 'SUPABASE_ANON_KEY',
    placeholder: 'eyJ...',
    description: 'Supabase project anon key',
    docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
  },
  supabase_service: {
    id: 'supabase_service',
    name: 'Supabase Service Role',
    category: 'database',
    envKey: 'SUPABASE_SERVICE_ROLE_KEY',
    placeholder: 'eyJ...',
    description: 'Supabase service role key (admin)',
    docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
  },
  firebase: {
    id: 'firebase',
    name: 'Firebase',
    category: 'database',
    envKey: 'FIREBASE_API_KEY',
    placeholder: 'AIza...',
    description: 'Firebase project API key',
    docsUrl: 'https://console.firebase.google.com',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    envKey: 'REDIS_URL',
    placeholder: 'redis://...',
    description: 'Redis connection URL',
  },
  mongodb: {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    envKey: 'MONGODB_URI',
    placeholder: 'mongodb+srv://...',
    description: 'MongoDB connection string',
    docsUrl: 'https://cloud.mongodb.com',
  },

  // Messaging & Communication
  twilio: {
    id: 'twilio',
    name: 'Twilio',
    category: 'messaging',
    envKey: 'TWILIO_AUTH_TOKEN',
    placeholder: '',
    description: 'SMS, voice, and messaging APIs',
    docsUrl: 'https://console.twilio.com',
  },
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'messaging',
    envKey: 'SENDGRID_API_KEY',
    placeholder: 'SG...',
    description: 'Email delivery API',
    docsUrl: 'https://app.sendgrid.com/settings/api_keys',
  },
  discord: {
    id: 'discord',
    name: 'Discord Bot',
    category: 'messaging',
    envKey: 'DISCORD_BOT_TOKEN',
    placeholder: '',
    description: 'Discord bot token',
    docsUrl: 'https://discord.com/developers/applications',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram Bot',
    category: 'messaging',
    envKey: 'TELEGRAM_BOT_TOKEN',
    placeholder: '',
    description: 'Telegram bot token from BotFather',
    docsUrl: 'https://t.me/botfather',
  },

  // Developer Tools
  github: {
    id: 'github',
    name: 'GitHub Personal Token',
    category: 'devtools',
    envKey: 'GITHUB_PERSONAL_TOKEN',
    placeholder: 'ghp_...',
    description: 'GitHub personal access token',
    docsUrl: 'https://github.com/settings/tokens',
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    category: 'devtools',
    envKey: 'STRIPE_SECRET_KEY',
    placeholder: 'sk_...',
    description: 'Stripe secret API key',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
  },
  sentry: {
    id: 'sentry',
    name: 'Sentry',
    category: 'devtools',
    envKey: 'SENTRY_DSN',
    placeholder: 'https://...@sentry.io/...',
    description: 'Error monitoring DSN',
    docsUrl: 'https://sentry.io/settings/account/api/auth-tokens/',
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    category: 'devtools',
    envKey: 'VERCEL_TOKEN',
    placeholder: '',
    description: 'Vercel API token',
    docsUrl: 'https://vercel.com/account/tokens',
  },
  railway: {
    id: 'railway',
    name: 'Railway',
    category: 'devtools',
    envKey: 'RAILWAY_TOKEN',
    placeholder: '',
    description: 'Railway API token',
    docsUrl: 'https://railway.app/account/tokens',
  },
  
  // Catch-all custom
  custom: {
    id: 'custom',
    name: 'Custom API Key',
    category: 'custom',
    envKey: 'CUSTOM_API_KEY',
    placeholder: '',
    description: 'Add any custom API key or credential',
    isCustom: true,
  },
};

export class SecureStorageService {
  private storagePath: string;
  private metadataPath: string;
  private keysPath: string;
  private initialized: boolean = false;

  constructor() {
    // Store in app's user data directory
    this.storagePath = join(app.getPath('userData'), 'secure-storage');
    this.metadataPath = join(this.storagePath, 'credentials-meta.json');
    this.keysPath = join(this.storagePath, 'encrypted-keys.dat');
  }

  /**
   * Initialize the secure storage service
   */
  async initialize(): Promise<{ success: boolean; encryptionAvailable: boolean }> {
    try {
      // Ensure storage directory exists
      if (!existsSync(this.storagePath)) {
        mkdirSync(this.storagePath, { recursive: true });
      }

      // Check if encryption is available
      const encryptionAvailable = safeStorage.isEncryptionAvailable();
      
      if (!encryptionAvailable) {
        console.warn('[SecureStorage] OS-level encryption not available. Keys will still be stored but with reduced security.');
      }

      // Initialize metadata file if it doesn't exist
      if (!existsSync(this.metadataPath)) {
        this.saveMetadata({ credentials: [], customProviders: [], version: 2 });
      }

      // Initialize encrypted keys file if it doesn't exist
      if (!existsSync(this.keysPath)) {
        this.saveEncryptedKeys({});
      }

      this.initialized = true;
      console.log('[SecureStorage] Initialized successfully');
      
      return { success: true, encryptionAvailable };
    } catch (error) {
      console.error('[SecureStorage] Initialization failed:', error);
      return { success: false, encryptionAvailable: false };
    }
  }

  /**
   * Save an API key securely
   */
  async saveApiKey(
    provider: string,
    apiKey: string,
    customName?: string,
    metadata?: Record<string, string>
  ): Promise<{ success: boolean; id: string; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const id = this.generateId();
      const providerInfo = this.getProviderInfo(provider);
      const name = customName || providerInfo?.name || provider;
      const category = providerInfo?.category || 'custom';
      const now = new Date().toISOString();

      // Load existing data
      const metadataStore = this.loadMetadata();
      const encryptedKeys = this.loadEncryptedKeys();

      // Check for existing key with same provider
      const existingIndex = metadataStore.credentials.findIndex(c => c.provider === provider);
      
      // Encrypt the API key
      const encryptedKey = this.encryptString(apiKey);

      if (existingIndex >= 0) {
        // Update existing credential
        const existingId = metadataStore.credentials[existingIndex].id;
        metadataStore.credentials[existingIndex] = {
          ...metadataStore.credentials[existingIndex],
          name,
          updatedAt: now,
          metadata,
        };
        encryptedKeys[existingId] = encryptedKey;
        
        this.saveMetadata(metadataStore);
        this.saveEncryptedKeys(encryptedKeys);
        
        // Also set environment variable for current session
        if (providerInfo?.envKey) {
          process.env[providerInfo.envKey] = apiKey;
        }
        
        return { success: true, id: existingId };
      } else {
        // Add new credential
        const credential: StoredCredential = {
          id,
          name,
          provider,
          category,
          createdAt: now,
          updatedAt: now,
          metadata,
        };

        metadataStore.credentials.push(credential);
        encryptedKeys[id] = encryptedKey;

        this.saveMetadata(metadataStore);
        this.saveEncryptedKeys(encryptedKeys);
        
        // Also set environment variable for current session
        if (providerInfo?.envKey) {
          process.env[providerInfo.envKey] = apiKey;
        }

        return { success: true, id };
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to save API key:', error);
      return { success: false, id: '', error: (error as Error).message };
    }
  }

  /**
   * Retrieve an API key by provider
   */
  async getApiKey(provider: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      const credential = metadataStore.credentials.find(c => c.provider === provider);

      if (!credential) {
        // Fall back to environment variable
        const providerInfo = this.getProviderInfo(provider);
        if (providerInfo?.envKey && process.env[providerInfo.envKey]) {
          return { success: true, apiKey: process.env[providerInfo.envKey] };
        }
        return { success: false, error: `No API key found for provider: ${provider}` };
      }

      const encryptedKeys = this.loadEncryptedKeys();
      const encryptedKey = encryptedKeys[credential.id];

      if (!encryptedKey) {
        return { success: false, error: 'Encrypted key data not found' };
      }

      const apiKey = this.decryptString(encryptedKey);
      return { success: true, apiKey };
    } catch (error) {
      console.error('[SecureStorage] Failed to get API key:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      const credentialIndex = metadataStore.credentials.findIndex(c => c.provider === provider);

      if (credentialIndex === -1) {
        return { success: false, error: `No API key found for provider: ${provider}` };
      }

      const credential = metadataStore.credentials[credentialIndex];
      const encryptedKeys = this.loadEncryptedKeys();

      // Remove from metadata
      metadataStore.credentials.splice(credentialIndex, 1);
      
      // Remove encrypted key
      delete encryptedKeys[credential.id];

      this.saveMetadata(metadataStore);
      this.saveEncryptedKeys(encryptedKeys);

      // Also clear environment variable
      const providerInfo = this.getProviderInfo(provider);
      if (providerInfo?.envKey) {
        delete process.env[providerInfo.envKey];
      }

      return { success: true };
    } catch (error) {
      console.error('[SecureStorage] Failed to delete API key:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List all stored credentials (without the actual keys)
   */
  async listCredentials(): Promise<{ success: boolean; credentials: StoredCredential[]; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      return { success: true, credentials: metadataStore.credentials };
    } catch (error) {
      console.error('[SecureStorage] Failed to list credentials:', error);
      return { success: false, credentials: [], error: (error as Error).message };
    }
  }

  /**
   * Check if a provider has a stored API key
   */
  async hasApiKey(provider: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      const hasStored = metadataStore.credentials.some(c => c.provider === provider);
      
      if (hasStored) return true;

      // Also check environment variables
      const providerInfo = this.getProviderInfo(provider);
      return !!providerInfo?.envKey && !!process.env[providerInfo.envKey];
    } catch {
      return false;
    }
  }

  /**
   * Load all stored API keys into environment variables (for app startup)
   */
  async loadAllKeysToEnv(): Promise<{ success: boolean; loaded: number }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      const encryptedKeys = this.loadEncryptedKeys();
      let loaded = 0;

      for (const credential of metadataStore.credentials) {
        const encryptedKey = encryptedKeys[credential.id];
        if (encryptedKey) {
          try {
            const apiKey = this.decryptString(encryptedKey);
            const providerInfo = this.getProviderInfo(credential.provider);
            if (providerInfo?.envKey) {
              process.env[providerInfo.envKey] = apiKey;
              loaded++;
            }
          } catch (error) {
            console.error(`[SecureStorage] Failed to decrypt key for ${credential.provider}:`, error);
          }
        }
      }

      console.log(`[SecureStorage] Loaded ${loaded} API keys into environment`);
      return { success: true, loaded };
    } catch (error) {
      console.error('[SecureStorage] Failed to load keys to env:', error);
      return { success: false, loaded: 0 };
    }
  }

  /**
   * Add a custom provider
   */
  async addCustomProvider(provider: ProviderInfo): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      
      // Check if provider already exists
      if (CREDENTIAL_PROVIDERS[provider.id] || metadataStore.customProviders?.find(p => p.id === provider.id)) {
        return { success: false, error: `Provider ${provider.id} already exists` };
      }

      if (!metadataStore.customProviders) {
        metadataStore.customProviders = [];
      }

      metadataStore.customProviders.push({
        ...provider,
        isCustom: true,
      });

      this.saveMetadata(metadataStore);
      return { success: true };
    } catch (error) {
      console.error('[SecureStorage] Failed to add custom provider:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Remove a custom provider
   */
  async removeCustomProvider(providerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const metadataStore = this.loadMetadata();
      
      if (!metadataStore.customProviders) {
        return { success: false, error: 'No custom providers found' };
      }

      const index = metadataStore.customProviders.findIndex(p => p.id === providerId);
      if (index === -1) {
        return { success: false, error: `Custom provider ${providerId} not found` };
      }

      metadataStore.customProviders.splice(index, 1);
      
      // Also delete any stored credential for this provider
      await this.deleteApiKey(providerId);

      this.saveMetadata(metadataStore);
      return { success: true };
    } catch (error) {
      console.error('[SecureStorage] Failed to remove custom provider:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all providers (built-in + custom)
   */
  getAllProviders(): Record<string, ProviderInfo> {
    const metadataStore = this.loadMetadata();
    const allProviders = { ...CREDENTIAL_PROVIDERS };
    
    if (metadataStore.customProviders) {
      for (const custom of metadataStore.customProviders) {
        allProviders[custom.id] = custom;
      }
    }
    
    return allProviders;
  }

  /**
   * Get provider info by ID
   */
  getProviderInfo(providerId: string): ProviderInfo | undefined {
    if (CREDENTIAL_PROVIDERS[providerId]) {
      return CREDENTIAL_PROVIDERS[providerId];
    }

    const metadataStore = this.loadMetadata();
    return metadataStore.customProviders?.find(p => p.id === providerId);
  }

  /**
   * Get supported providers (includes custom)
   */
  getSupportedProviders(): typeof CREDENTIAL_PROVIDERS {
    return this.getAllProviders();
  }

  /**
   * Get credential categories
   */
  getCategories(): typeof CREDENTIAL_CATEGORIES {
    return CREDENTIAL_CATEGORIES;
  }

  /**
   * Get providers by category
   */
  getProvidersByCategory(category: CredentialCategory): ProviderInfo[] {
    const allProviders = this.getAllProviders();
    return Object.values(allProviders).filter(p => p.category === category);
  }

  /**
   * Check encryption status
   */
  getEncryptionStatus(): { available: boolean; usingKeychain: boolean } {
    return {
      available: safeStorage.isEncryptionAvailable(),
      usingKeychain: safeStorage.isEncryptionAvailable(),
    };
  }

  // Private helper methods

  private generateId(): string {
    return `cred_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private encryptString(plainText: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(plainText);
      return encrypted.toString('base64');
    } else {
      // Fallback: base64 encoding (not secure, but better than plaintext)
      console.warn('[SecureStorage] Using fallback encoding (not secure)');
      return Buffer.from(plainText).toString('base64');
    }
  }

  private decryptString(encryptedBase64: string): string {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer);
    } else {
      // Fallback: base64 decoding
      return buffer.toString('utf8');
    }
  }

  private loadMetadata(): CredentialMetadata {
    try {
      if (existsSync(this.metadataPath)) {
        const data = readFileSync(this.metadataPath, 'utf8');
        const parsed = JSON.parse(data);
        // Ensure customProviders exists for backwards compatibility
        if (!parsed.customProviders) {
          parsed.customProviders = [];
        }
        return parsed;
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to load metadata:', error);
    }
    return { credentials: [], customProviders: [], version: 2 };
  }

  private saveMetadata(metadata: CredentialMetadata): void {
    writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  private loadEncryptedKeys(): Record<string, string> {
    try {
      if (existsSync(this.keysPath)) {
        const data = readFileSync(this.keysPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to load encrypted keys:', error);
    }
    return {};
  }

  private saveEncryptedKeys(keys: Record<string, string>): void {
    writeFileSync(this.keysPath, JSON.stringify(keys), 'utf8');
  }
}

// Singleton instance
let secureStorageInstance: SecureStorageService | null = null;

export function getSecureStorage(): SecureStorageService {
  if (!secureStorageInstance) {
    secureStorageInstance = new SecureStorageService();
  }
  return secureStorageInstance;
}

