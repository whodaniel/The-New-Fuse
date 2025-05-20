import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MCPRegistryService } from '../mcp/mcp-registry.service.js'; // Adjust path if needed
import { Prisma } from '@prisma/client'; // For JsonValue type if needed

@Injectable()
export class EntityDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(EntityDiscoveryService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mcpRegistryService: MCPRegistryService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting entity discovery...');
    await this.discoverAndRegisterEntities();
    this.logger.log('Entity discovery finished.');
  }

  private async discoverAndRegisterEntities() {
    // --- Discover AI Models ---
    await this.registerAIModel('OpenAI', 'OPENAI_API_KEY', { provider: 'OpenAI' });
    await this.registerAIModel('Anthropic', 'ANTHROPIC_API_KEY', { provider: 'Anthropic' });
    // Add more AI model providers as needed

    // --- Discover VS Code Extension ---
    // Register the VS Code extension as a known entity.
    // Details might be static or come from config/package.json if available here.
    await this.registerStaticEntity('Fuse VSCode Extension', 'VSCodeExtension', {
        version: this.configService.get<string>('VSCODE_EXTENSION_VERSION', 'unknown'), // Example: Get version from env
        capabilities: ['file-system-access', 'code-execution', 'terminal-access'], // Example capabilities
    });

    // --- Discover Other Services ---
    // Example: Registering the API itself or other backend components
    // await this.registerStaticEntity('Fuse Backend API', 'APIService', { url: this.configService.get('API_URL') });

    // Add more discovery logic here...
  }

  private async registerAIModel(providerName: string, apiKeyEnvVar: string, baseMetadata: Prisma.JsonObject) {
    const apiKey = this.configService.get<string>(apiKeyEnvVar);
    if (apiKey) {
      this.logger.log(`Found configured API key for ${providerName}. Registering entity...`);
      try {
        // We might want more specific names, e.g., including model types if known
        const entityName = `${providerName}-Service`;
        const metadata = {
            ...baseMetadata,
            configured: true,
            // Potentially add specific model IDs if discoverable or configured
            // models: ['gpt-4', 'gpt-3.5-turbo'] // Example
        };
        await this.mcpRegistryService.registerEntity({
          name: entityName,
          type: 'AIModel',
          metadata: metadata as Prisma.JsonValue, // Cast metadata
        });
        this.logger.log(`Registered/Updated AIModel entity: ${entityName}`);
      } catch (error) {
        this.logger.error(`Failed to register AIModel entity for ${providerName}: ${error.message}`, error.stack);
      }
    } else {
      this.logger.log(`API key for ${providerName} (${apiKeyEnvVar}) not found. Skipping registration.`);
      // Optionally register it as 'unconfigured'
      // await this.mcpRegistryService.registerEntity({ name: `${providerName}-Service`, type: 'AIModel', metadata: { ...baseMetadata, configured: false } });
    }
  }

   private async registerStaticEntity(name: string, type: string, metadata: Prisma.JsonObject) {
       this.logger.log(`Registering static entity: ${name} (${type})`);
       try {
           await this.mcpRegistryService.registerEntity({
               name: name,
               type: type,
               metadata: metadata as Prisma.JsonValue, // Cast metadata
           });
           this.logger.log(`Registered/Updated static entity: ${name}`);
       } catch (error) {
           this.logger.error(`Failed to register static entity ${name}: ${error.message}`, error.stack);
       }
   }
}
