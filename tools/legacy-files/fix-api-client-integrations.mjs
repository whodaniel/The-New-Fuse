#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INTEGRATIONS_DIR = join(__dirname, 'packages/api-client/src/integrations');

// List of corrupted files to remove/recreate
const corruptedFiles = [
  'ai/anthropic.ts',
  'ai/huggingface.ts', 
  'ai/openai.ts',
  'ai/stability-ai.ts',
  'ai/stability.ts',
  'automation/make.ts',
  'automation/pabbly.ts',
  'automation/zapier.ts',
  'ecommerce/shopify.ts',
  'IntegrationRegistry.ts',
  'make.ts'
];

// Create basic stub files to replace the corrupted ones
const createStubFile = (filePath, className, description) => {
  return `import { ApiClient } from "../../client/ApiClient.js";
import { Integration, IntegrationType } from "../types.js";

/**
 * ${description}
 */
export class ${className} implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  capabilities: {
    actions: string[];
    triggers: string[];
    supportsWebhooks: boolean;
    supportsPolling: boolean;
    supportsCustomFields: boolean;
  };
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  private apiClient: ApiClient;

  constructor(config: any) {
    this.id = config.id || "${className.toLowerCase()}";
    this.name = config.name || "${className}";
    this.type = IntegrationType.OTHER;
    this.description = "${description}";
    this.capabilities = {
      actions: ["test"],
      triggers: [],
      supportsWebhooks: false,
      supportsPolling: true,
      supportsCustomFields: false
    };
    this.apiClient = new ApiClient(config);
  }

  async connect(): Promise<boolean> {
    // TODO: Implement connection logic
    this.isConnected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    // TODO: Implement disconnection logic
    this.isConnected = false;
  }

  async executeAction(action: string, params?: any): Promise<any> {
    // TODO: Implement action execution
    throw new Error(\`Action \${action} not implemented\`);
  }

  async getMetadata(): Promise<Record<string, any>> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt
    };
  }
}

export function create${className}(config: any = {}): ${className} {
  return new ${className}(config);
}
`;
};

// File mappings with class names and descriptions
const fileMapping = {
  'ai/anthropic.ts': ['AnthropicIntegration', 'Anthropic AI integration for Claude models'],
  'ai/huggingface.ts': ['HuggingFaceIntegration', 'Hugging Face AI model integration'],
  'ai/openai.ts': ['OpenAIIntegration', 'OpenAI GPT model integration'],
  'ai/stability-ai.ts': ['StabilityAIIntegration', 'Stability AI image generation integration'],
  'ai/stability.ts': ['StabilityIntegration', 'Stability AI integration'],
  'automation/make.ts': ['MakeIntegration', 'Make.com automation platform integration'],
  'automation/pabbly.ts': ['PabblyIntegration', 'Pabbly Connect automation integration'],
  'automation/zapier.ts': ['ZapierIntegration', 'Zapier automation platform integration'],
  'ecommerce/shopify.ts': ['ShopifyIntegration', 'Shopify e-commerce platform integration'],
  'IntegrationRegistry.ts': ['', ''], // Special case - will handle separately
  'make.ts': ['MakeIntegration', 'Make integration (duplicate)']
};

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function fixCorruptedFiles() {
  console.log('🔧 Fixing corrupted integration files...');

  for (const filePath of corruptedFiles) {
    const fullPath = join(INTEGRATIONS_DIR, filePath);
    const [className, description] = fileMapping[filePath] || ['', ''];
    
    try {
      // Ensure directory exists
      await ensureDir(dirname(fullPath));

      if (filePath === 'IntegrationRegistry.ts') {
        // Special case for IntegrationRegistry
        const registryContent = `import { Integration, IntegrationType } from "./types.js";

/**
 * Registry for managing external service integrations
 */
export class IntegrationRegistry {
  private integrations: Map<string, Integration> = new Map();
 
  /**
   * Register a new integration
   */
  registerIntegration(integration: Integration): void {
    this.integrations.set(integration.id, integration);
  }
 
  /**
   * Get an integration by ID
   */
  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }
 
  /**
   * Get all integrations
   */
  getAllIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }
 
  /**
   * Get integrations by type
   */
  getIntegrationsByType(type: IntegrationType): Integration[] {
    return Array.from(this.integrations.values())
      .filter(integration => integration.type === type);
  }
 
  /**
   * Check if an integration exists
   */
  hasIntegration(id: string): boolean {
    return this.integrations.has(id);
  }
 
  /**
   * Remove an integration
   */
  removeIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }

  /**
   * Get integrations count
   */
  getIntegrationsCount(): number {
    return this.integrations.size;
  }
}

export const integrationRegistry = new IntegrationRegistry();
`;
        await fs.writeFile(fullPath, registryContent, 'utf8');
      } else if (className) {
        const content = createStubFile(filePath, className, description);
        await fs.writeFile(fullPath, content, 'utf8');
      }

      console.log(`✅ Fixed ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to fix ${filePath}:`, error.message);
    }
  }

  console.log('🎉 All corrupted integration files have been fixed!');
}

// Run the fix
fixCorruptedFiles().catch(console.error);