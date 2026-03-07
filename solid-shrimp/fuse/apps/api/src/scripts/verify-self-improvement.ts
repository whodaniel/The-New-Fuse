import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AgentSwarmOrchestrationService } from '../modules/agency-hub/services/agent-swarm-orchestration.service';
import { PromptTemplatesService } from '../services/prompt-templates.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SelfImprovementVerification');

  logger.log('Initializing Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const swarmService = app.get(AgentSwarmOrchestrationService);
  const promptService = app.get(PromptTemplatesService);

  const agencyId = 'agency-self-improvement-test';
  const agentName = 'EvolutionaryAgent';

  try {
    logger.log('--- Step 1: Initialize Swarm ---');
    await swarmService.initializeAgencySwarm(agencyId);
    logger.log('Swarm Initialized');

    logger.log('--- Step 2: Register Agent ---');
    const agentId = await swarmService.registerAgent(agencyId, {
      name: agentName,
      type: 'generalist',
      capabilities: ['self-evolution', 'prompt-engineering'],
      currentLoad: 0,
      maxLoad: 5,
      qualityScore: 1.0,
      status: 'active'
    });
    logger.log(`Agent Registered: ${agentId}`);

    logger.log('--- Step 3: Agent Creates Its Own Prompt ---');
    const initialPrompt = "You are a helpful assistant.";
    // Note: The createTemplate signature in PromptTemplatesService expects data structure matching Drizzle Input
    // We need to match what we wrote in the service:
    /*
      name: data.name,
        description: data.description,
        isPublic: data.isPublic || false,
        category: data.category,
        tags: data.tags || [],
        analytics: {},
        versions: {
          create: data.versions || []
        }
    */
    const template = await promptService.createTemplate({
      name: `${agentName}-Core-Prompt-${Date.now()}`, // Unique name
      description: 'The core system prompt for the Evolutionary Agent',
      category: 'System',
      isPublic: false,
      tags: ['agent-core', 'evolutionary'],
      versions: [{
        version: 1,
        content: initialPrompt,
        label: 'Genesis',
        variables: {},
        changelog: 'Initial birth',
        isActive: true
      }]
    });
    logger.log(`Prompt Template Created: ${template.id}`);

    logger.log('--- Step 4: Agent Improves Its Own Prompt ---');
    const improvedPrompt = "You are a highly advanced AI assistant capable of self-correction.";
    const version = await promptService.createVersion(template.id, {
      content: improvedPrompt,
      label: 'Iteration 1',
      changelog: 'Self-optimization applied',
      variables: {},
      isActive: true
    });
    logger.log(`Prompt Updated to Version: ${version.version}`);
    logger.log(`New Content: ${version.content}`);

    logger.log('--- Verification Complete: Cycle Closed ---');
  } catch (error) {
    logger.error('Verification Failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
