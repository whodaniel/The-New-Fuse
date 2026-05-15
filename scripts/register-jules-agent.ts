#!/usr/bin/env ts-node

/**
 * Register Jules CLI Agent in The New Fuse Agent Registry
 *
 * This script registers Google's Jules CLI as an external agent in TNF's database,
 * making it discoverable and usable within the multi-agent framework.
 */

import axios from 'axios';

// Agent Registration Data (matches IRegistrationData interface)
const julesAgentRegistration = {
  name: 'jules-cli-agent',
  version: '1.0.0',
  author: 'Google',
  description:
    'Asynchronous coding agent for parallel multi-session code generation and repository-wide improvements',

  capabilities: [
    {
      name: 'parallel-task-execution',
      type: 'core',
      version: '1.0.0',
      description: 'Launch multiple coding sessions concurrently for maximum efficiency',
      parameters: {
        max_concurrent_sessions: 50,
        supports_async: true,
      },
    },
    {
      name: 'async-code-generation',
      type: 'core',
      version: '1.0.0',
      description: 'Generate code asynchronously without blocking other operations',
      parameters: {
        execution_model: 'non-blocking',
        result_retrieval: 'pull-based',
      },
    },
    {
      name: 'repository-wide-refactoring',
      type: 'core',
      version: '1.0.0',
      description: 'Make systematic changes across entire codebase',
      parameters: {
        scope: 'repository',
        change_types: ['refactoring', 'migration', 'standardization'],
      },
    },
    {
      name: 'session-management',
      type: 'core',
      version: '1.0.0',
      description: 'Track and manage multiple Jules sessions simultaneously',
      parameters: {
        session_tracking: true,
        status_monitoring: true,
        result_caching: true,
      },
    },
    {
      name: 'batch-code-improvements',
      type: 'extended',
      version: '1.0.0',
      description: 'Apply systematic code quality improvements in batch',
      parameters: {
        improvement_types: [
          'type-safety',
          'error-handling',
          'performance',
          'accessibility',
          'security',
        ],
      },
    },
    {
      name: 'cli-integration',
      type: 'extended',
      version: '1.0.0',
      description: 'Integration via jules CLI executable',
      parameters: {
        executable: 'jules',
        interface_type: 'cli',
        requires_repo: true,
      },
    },
  ],

  metadata: {
    agent_type: 'external',
    integration_method: 'cli',
    executable_name: 'jules',
    executable_path: process.env.JULES_EXECUTABLE_PATH || 'jules',
    documentation_url: 'https://jules.google.com',
    source_file: '.claude/agents/jules-cli-agent.md',
    command_file: '.claude/commands/delegate-to-jules.md',

    // Operational parameters
    requires_internet: true,
    supports_offline: false,
    api_based: false,
    cli_based: true,

    // Session capabilities
    session_management: {
      supports_parallel: true,
      max_concurrent: 50,
      async_execution: true,
      status_tracking: true,
      result_retrieval: 'pull-based',
    },

    // Use cases
    use_cases: [
      'large-scale-refactoring',
      'systematic-code-quality',
      'parallel-development',
      'time-consuming-operations',
      'website-ui-overhauls',
      'repository-wide-changes',
      'batch-improvements',
      'multi-session-workflows',
    ],

    // Integration points
    tnf_integrations: [
      'slash-commands',
      'agent-registry',
      'task-delegation',
      'multi-agent-workflows',
      'orchestrator-agent',
    ],

    // Color and branding
    color: 'Blue',
    icon: '🤖',
    category: 'development-automation',

    // Performance characteristics
    performance: {
      execution_speed: 'async',
      response_time: 'variable (5-45 mins)',
      scalability: 'high',
      reliability: 'production-ready',
    },

    // Tags for searchability
    tags: [
      'code-generation',
      'refactoring',
      'automation',
      'parallel-execution',
      'asynchronous',
      'cli-tool',
      'google',
      'jules',
      'batch-processing',
      'repository-wide',
      'multi-session',
    ],
  },

  heartbeatInterval: 300000, // 5 minutes (Jules sessions are long-running)
};

async function registerJulesAgent() {
  const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
  const REGISTER_ENDPOINT = `${API_BASE_URL}/api/agent-registry/register`;

  console.log('🤖 Registering Jules CLI Agent in TNF Agent Registry...\n');

  try {
    console.log('📡 Sending registration request to:', REGISTER_ENDPOINT);
    console.log('📦 Agent data:', JSON.stringify(julesAgentRegistration, null, 2), '\n');

    const response = await axios.post(REGISTER_ENDPOINT, julesAgentRegistration, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ Jules CLI Agent registered successfully!\n');
    console.log('📋 Registration Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    if (response.data.registrationId) {
      console.log(`🆔 Registration ID: ${response.data.registrationId}`);
      console.log(`🔑 Agent Token: ${response.data.authToken?.substring(0, 20)}...`);
      console.log('\n');
    }

    console.log('🎯 Next Steps:');
    console.log('1. Use /delegate-to-jules slash command to invoke Jules');
    console.log('2. Launch Jules sessions with: jules new --repo whodaniel/fuse "task"');
    console.log('3. Monitor sessions: jules remote list --session');
    console.log('4. Pull results: jules remote pull --session [ID]');
    console.log('\n');

    console.log('📚 Documentation:');
    console.log('- Agent definition: .claude/agents/jules-cli-agent.md');
    console.log('- Slash command: .claude/commands/delegate-to-jules.md');
    console.log('- Registration script: scripts/register-jules-agent.ts');
    console.log('\n');

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Failed to register Jules CLI Agent\n');

      if (error.response) {
        console.error('📛 Server Response:');
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('📛 No response received from server');
        console.error('Ensure the TNF backend is running at:', API_BASE_URL);
        console.error('\nTo start the backend:');
        console.error('  pnpm --filter @the-new-fuse/api-server dev');
      } else {
        console.error('📛 Request Error:', error.message);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }

    console.log('\n');
    console.log('💡 Troubleshooting:');
    console.log('1. Verify backend is running: curl http://localhost:3001/health');
    console.log('2. Check environment variables: echo $VITE_API_URL');
    console.log('3. Review backend logs for errors');
    console.log('4. Ensure database is connected and migrations are run');
    console.log('\n');

    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  registerJulesAgent()
    .then(() => {
      console.log('✨ Jules CLI Agent registration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { julesAgentRegistration, registerJulesAgent };
