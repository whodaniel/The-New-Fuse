import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { AgentDiscoveryService } from '../services/agent-discovery.service.js';
import { AgentType } from '@prisma/client';

/**
 * Script to register Augment as an AI Agent using the AgentDiscoveryService
 */
async function registerAugment(): any {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('Starting Augment registration...');
    
    // Get the AgentDiscoveryService
    const agentDiscoveryService = app.get(AgentDiscoveryService);
    
    // Discover all MCP tools
    console.log('Discovering MCP tools...');
    const mcpTools = await agentDiscoveryService.discoverMCPTools();
    
    // Get admin user ID (this would normally be retrieved from the database)
    // For this example, we'll use a placeholder
    const adminUserId = 'admin-user-id';
    
    // Register Augment
    console.log('Registering Augment...');
    const augmentAgent = await agentDiscoveryService.registerAgent(
      'Augment',
      'Augment AI Assistant by Augment Code, based on Claude 3.7 Sonnet',
      AgentType.ANALYSIS,
      adminUserId,
      [
        'code_analysis',
        'code_generation',
        'documentation',
        'refactoring',
        'debugging',
        'testing'
      ],
      mcpTools
    );
    
    console.log('Augment registration complete!');
    console.log('Agent ID:', augmentAgent.id);
    
    return augmentAgent;
  } catch (error) {
    console.error('Error registering Augment:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the registration if this script is run directly
if (require.main === module) {
  registerAugment()
    .then(() => {
      console.log('Registration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Registration script failed:', error);
      process.exit(1);
    });
}

export { registerAugment };
