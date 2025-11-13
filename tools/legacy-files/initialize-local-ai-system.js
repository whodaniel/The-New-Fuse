#!/usr/bin/env node

/**
 * Initialize Local AI System
 * Creates default system agents for detected local AIs
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Local AI System\n');

class LocalAIInitializer {
  constructor() {
    this.supportedProviders = [
      {
        name: 'Claude Code CLI',
        command: 'claude',
        checkCommand: ['claude', '--version'],
        description: 'Anthropic Claude Code CLI - Local AI assistant',
        capabilities: ['CHAT', 'CODE_GENERATION', 'FILE_MANAGEMENT', 'DATA_ANALYSIS', 'AUTOMATION'],
        systemPrompt: 'You are Claude Code CLI, a local AI assistant integrated with The New Fuse platform. You provide intelligent assistance for coding, analysis, and automation tasks.',
        defaultModel: 'claude-3-5-sonnet-20241022'
      },
      {
        name: 'Gemini CLI',
        command: 'gemini',
        checkCommand: ['gemini', '--version'],
        description: 'Google Gemini CLI - Local AI assistant',
        capabilities: ['CHAT', 'CODE_GENERATION', 'DATA_ANALYSIS'],
        systemPrompt: 'You are Gemini CLI, a local AI assistant integrated with The New Fuse platform. You provide intelligent assistance for chat, coding, and data analysis.',
        defaultModel: 'gemini-pro'
      },
      {
        name: 'Ollama',
        command: 'ollama',
        checkCommand: ['ollama', 'list'],
        description: 'Ollama - Local LLM runner',
        capabilities: ['CHAT', 'CODE_GENERATION'],
        systemPrompt: 'You are an Ollama-powered AI assistant integrated with The New Fuse platform. You provide local AI assistance for various tasks.',
        apiEndpoint: 'http://localhost:11434',
        defaultModel: 'llama2'
      },
      {
        name: 'LM Studio',
        command: 'lms',
        checkCommand: ['curl', '-s', 'http://localhost:1234/v1/models'],
        description: 'LM Studio - Local AI interface',
        capabilities: ['CHAT', 'CODE_GENERATION'],
        systemPrompt: 'You are an LM Studio-powered AI assistant integrated with The New Fuse platform. You provide local AI assistance through a user-friendly interface.',
        apiEndpoint: 'http://localhost:1234',
        defaultModel: 'local-model'
      },
      {
        name: 'GPT4All',
        command: 'gpt4all',
        checkCommand: ['gpt4all', '--version'],
        description: 'GPT4All - Local GPT models',
        capabilities: ['CHAT', 'CODE_GENERATION'],
        systemPrompt: 'You are a GPT4All-powered AI assistant integrated with The New Fuse platform. You provide local AI assistance using open-source models.',
        defaultModel: 'gpt4all-j'
      },
      {
        name: 'LocalAI',
        command: 'local-ai',
        checkCommand: ['curl', '-s', 'http://localhost:8080/v1/models'],
        description: 'LocalAI - Open source local AI',
        capabilities: ['CHAT', 'CODE_GENERATION', 'API_INTEGRATION'],
        systemPrompt: 'You are a LocalAI-powered assistant integrated with The New Fuse platform. You provide comprehensive local AI assistance with API integration capabilities.',
        apiEndpoint: 'http://localhost:8080',
        defaultModel: 'local-model'
      }
    ];
  }

  async initialize() {
    console.log('🔍 Step 1: Detecting available local AI providers...\n');
    
    const availableProviders = [];
    
    for (const provider of this.supportedProviders) {
      const isAvailable = await this.checkProviderAvailability(provider);
      if (isAvailable) {
        console.log(`✅ Found: ${provider.name}`);
        availableProviders.push(provider);
      } else {
        console.log(`❌ Not found: ${provider.name}`);
      }
    }

    console.log(`\n🎯 Detection complete: ${availableProviders.length}/${this.supportedProviders.length} providers available\n`);

    if (availableProviders.length === 0) {
      console.log('⚠️ No local AI providers detected. Please install at least one local AI CLI to continue.');
      return;
    }

    console.log('📝 Step 2: Creating default system agent configurations...\n');
    
    const agentConfigs = availableProviders.map(provider => this.createAgentConfig(provider));
    
    console.log('💾 Step 3: Saving agent configurations...\n');
    
    await this.saveAgentConfigs(agentConfigs);
    
    console.log('🎉 Step 4: Local AI System initialization complete!\n');
    
    this.printSummary(availableProviders, agentConfigs);
  }

  async checkProviderAvailability(provider) {
    return new Promise((resolve) => {
      const [command, ...args] = provider.checkCommand;
      const process = spawn(command, args, { 
        stdio: 'pipe',
        timeout: 5000 
      });

      let hasResponded = false;

      process.on('close', (code) => {
        if (!hasResponded) {
          hasResponded = true;
          if (provider.checkCommand[0] === 'curl') {
            resolve(code === 0);
          } else {
            resolve(code !== null && code < 2);
          }
        }
      });

      process.on('error', () => {
        if (!hasResponded) {
          hasResponded = true;
          resolve(false);
        }
      });

      setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          process.kill();
          resolve(false);
        }
      }, 5000);
    });
  }

  createAgentConfig(provider) {
    return {
      id: `local-ai-${provider.name.toLowerCase().replace(/\\s+/g, '-')}`,
      name: provider.name,
      type: 'ASSISTANT',
      status: 'ACTIVE',
      description: provider.description,
      systemPrompt: provider.systemPrompt,
      capabilities: provider.capabilities.map(cap => ({
        name: cap,
        description: `${cap} capability provided by ${provider.name}`,
        parameters: {
          provider: provider.name,
          command: provider.command,
          apiEndpoint: provider.apiEndpoint,
          defaultModel: provider.defaultModel
        }
      })),
      configuration: {
        provider: provider.name,
        command: provider.command,
        apiEndpoint: provider.apiEndpoint,
        defaultModel: provider.defaultModel,
        localAI: true,
        autoDetected: true,
        systemAgent: true
      },
      metadata: {
        detectedAt: new Date().toISOString(),
        providerType: 'local',
        version: 'auto-detected',
        initialized: true
      },
      provider: provider.name,
      userId: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async saveAgentConfigs(agentConfigs) {
    // Save to a JSON file for now (in production this would go to database)
    const configPath = path.join(process.cwd(), 'local-ai-agents-config.json');
    
    const config = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalAgents: agentConfigs.length,
      agents: agentConfigs
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Agent configurations saved to: ${configPath}`);
    } catch (error) {
      console.error(`❌ Failed to save configurations: ${error.message}`);
    }

    // Also create individual agent files for easier integration
    const agentsDir = path.join(process.cwd(), 'local-ai-agents');
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    for (const agent of agentConfigs) {
      const agentFile = path.join(agentsDir, `${agent.id}.json`);
      try {
        fs.writeFileSync(agentFile, JSON.stringify(agent, null, 2));
        console.log(`✅ Created agent file: ${agent.name}`);
      } catch (error) {
        console.error(`❌ Failed to create agent file for ${agent.name}: ${error.message}`);
      }
    }
  }

  printSummary(availableProviders, agentConfigs) {
    console.log('═'.repeat(60));
    console.log('🎯 LOCAL AI SYSTEM INITIALIZATION SUMMARY');
    console.log('═'.repeat(60));
    
    console.log(`\n📊 Detection Results:`);
    console.log(`   • Total providers checked: ${this.supportedProviders.length}`);
    console.log(`   • Available providers: ${availableProviders.length}`);
    console.log(`   • System agents created: ${agentConfigs.length}`);
    
    console.log(`\n🤖 Available Local AI Providers:`);
    availableProviders.forEach(provider => {
      console.log(`   ✅ ${provider.name}`);
      console.log(`      Command: ${provider.command}`);
      console.log(`      Capabilities: ${provider.capabilities.join(', ')}`);
      if (provider.apiEndpoint) {
        console.log(`      API: ${provider.apiEndpoint}`);
      }
      console.log('');
    });

    console.log(`🚀 Next Steps:`);
    console.log(`   1. Start The New Fuse API server`);
    console.log(`   2. Import the generated agent configurations`);
    console.log(`   3. Test agent communication through the platform`);
    console.log(`   4. Access Local AI Agents Manager in the UI`);
    
    console.log(`\n📁 Generated Files:`);
    console.log(`   • local-ai-agents-config.json - Complete configuration`);
    console.log(`   • local-ai-agents/ - Individual agent files`);
    
    console.log(`\n💡 Integration Commands:`);
    console.log(`   # Start API with local AI support`);
    console.log(`   npm run dev:api`);
    console.log(`   `);
    console.log(`   # Test local AI agents`);
    console.log(`   node test-local-ai-agents.js`);
    console.log(`   `);
    console.log(`   # Start frontend with agent management`);
    console.log(`   npm run dev:frontend`);
    
    console.log(`\n🎉 The New Fuse is now configured for ${availableProviders.length} local AI provider${availableProviders.length !== 1 ? 's' : ''}!`);
    console.log('═'.repeat(60));
  }
}

// Run the initializer
const initializer = new LocalAIInitializer();
initializer.initialize().catch(console.error);