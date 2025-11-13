var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EntityDiscoveryService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { MCPRegistryService } from '../mcp/mcp-registry.service'; // Adjust path if needed
let EntityDiscoveryService = EntityDiscoveryService_1 = class EntityDiscoveryService {
    mcpRegistryService;
    logger = new Logger(EntityDiscoveryService_1.name);
    constructor(mcpRegistryService) {
        this.mcpRegistryService = mcpRegistryService;
    }
    async onModuleInit() {
        this.logger.log('Starting entity discovery...');
        await this.discoverAndRegisterEntities();
        this.logger.log('Entity discovery finished.');
    }
    async discoverAndRegisterEntities() {
        // --- Discover AI Models ---
        await this.registerAIModel('OpenAI', 'OPENAI_API_KEY', { provider: 'OpenAI' });
        await this.registerAIModel('Anthropic', 'ANTHROPIC_API_KEY', { provider: 'Anthropic' });
        // Add more AI model providers as needed
        // --- Discover VS Code Extension ---
        // Register the VS Code extension as a known entity.
        // Details might be static or come from config/package.json if available here.
        await this.registerStaticEntity('Fuse VSCode Extension', 'VSCodeExtension', {
            version: process.env.VSCODE_EXTENSION_VERSION || 'unknown', // Example: Get version from env
            capabilities: ['file-system-access', 'code-execution', 'terminal-access'], // Example capabilities
        });
        // --- Discover Other Services ---
        // Example: Registering the API itself or other backend components
        // await this.registerStaticEntity('Fuse Backend API', 'APIService', { url: process.env.API_URL });
        // Add more discovery logic here...
    }
    async registerAIModel(providerName, apiKeyEnvVar, baseMetadata) {
        const apiKey = process.env[apiKeyEnvVar];
        if (apiKey) {
            this.logger.log(`Found configured API key for ${providerName}. Registering entity...);
      try {
        // We might want more specific names, e.g., including model types if known`);
            const entityName = `${providerName}` - Service;
            const metadata = {
                ...baseMetadata,
                configured: true,
                // Potentially add specific model IDs if discoverable or configured
                // models: ['gpt-4', 'gpt-3.5-turbo'] // Example
            };
            await this.mcpRegistryService.registerEntity({
                name: entityName,
                type: 'AIModel',
                metadata: metadata, // Cast metadata
            });
            this.logger.log(Registered / Updated, AIModel, entity, $, { entityName });
        }
        try { }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            `
        this.logger.error(Failed to register AIModel entity for ${providerName}`;
            $;
            {
                errorMessage;
            }
            errorStack;
            ;
            `
      }`;
        }
        {
            this.logger.log(API, key);
            for ($; { providerName }($, { apiKeyEnvVar } `) not found. Skipping registration.);
      // Optionally register it as 'unconfigured'
      // await this.mcpRegistryService.registerEntity({ name: ${providerName}-Service, type: 'AIModel', metadata: { ...baseMetadata, configured: false } });
    }
  }` `
   private async registerStaticEntity(name: string, type: string, metadata: JsonObject) {
       this.logger.log(Registering static entity: ${name} (${type}`);)
                ;
            try {
                await this.mcpRegistryService.registerEntity({
                    name: name,
                    type: type,
                    metadata: metadata, // Cast metadata
                });
                this.logger.log(Registered / Updated, static, entity, $, { name } `);
       } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'Unknown error';
           const errorStack = error instanceof Error ? error.stack : undefined;
           this.logger.error(Failed to register static entity ${name}: ${errorMessage}`, errorStack);
            }
            finally {
            }
        }
    }
};
EntityDiscoveryService = EntityDiscoveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof MCPRegistryService !== "undefined" && MCPRegistryService) === "function" ? _a : Object])
], EntityDiscoveryService);
export { EntityDiscoveryService };
//# sourceMappingURL=entity-discovery.service.js.map