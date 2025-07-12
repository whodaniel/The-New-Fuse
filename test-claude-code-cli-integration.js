#!/usr/bin/env node

/**
 * Test script for Claude Code CLI integration with The New Fuse
 * This script verifies that Claude Code CLI can be used as a local LLM provider
 */

const axios = require('axios');
const { spawn } = require('child_process');

const API_BASE_URL = 'http://localhost:3001';

async function testClaudeCodeCLIAvailability() {
  console.log('🔍 Testing Claude Code CLI availability...');
  
  return new Promise((resolve) => {
    const process = spawn('which', ['claude'], { stdio: 'pipe', shell: true });
    
    process.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Claude Code CLI is available');
        resolve(true);
      } else {
        console.log('❌ Claude Code CLI is NOT available');
        console.log('   Please install Claude Code CLI first: https://claude.ai/code');
        resolve(false);
      }
    });
    
    process.on('error', () => {
      console.log('❌ Error checking Claude Code CLI availability');
      resolve(false);
    });
  });
}

async function testAPIConnection() {
  console.log('🔍 Testing API connection...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ API is responding');
    return true;
  } catch (error) {
    console.log('❌ API is not responding');
    console.log('   Please ensure The New Fuse is running: bun run dev:full');
    return false;
  }
}

async function registerClaudeCodeCLI() {
  console.log('🔍 Registering Claude Code CLI as LLM provider...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/llm/providers/register-claude-code-cli`);
    
    if (response.data.success) {
      console.log('✅ Claude Code CLI registered successfully');
      console.log(`   Provider ID: ${response.data.provider.id}`);
      console.log(`   Model: ${response.data.provider.modelName}`);
      return response.data.provider;
    } else {
      console.log('❌ Failed to register Claude Code CLI');
      console.log(`   Reason: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Error registering Claude Code CLI');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function listLLMProviders() {
  console.log('🔍 Listing all LLM providers...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/llm/providers`);
    const providers = response.data;
    
    console.log(`✅ Found ${providers.length} LLM providers:`);
    providers.forEach((provider, index) => {
      const isLocal = provider.provider === 'local';
      const isDefault = provider.isDefault;
      const icon = isLocal ? '💻' : (isDefault ? '⭐' : '🤖');
      
      console.log(`   ${icon} ${provider.name} (${provider.modelName})`);
      if (isLocal) {
        console.log(`      🔗 Endpoint: ${provider.apiEndpoint}`);
      }
    });
    
    return providers;
  } catch (error) {
    console.log('❌ Error listing LLM providers');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

async function testMultiAgentChatAccess() {
  console.log('🔍 Testing multi-agent chat access...');
  
  try {
    // Test if the frontend is accessible
    const response = await axios.get('http://localhost:3000/multi-agent-chat');
    console.log('✅ Multi-agent chat page is accessible at http://localhost:3000/multi-agent-chat');
    return true;
  } catch (error) {
    console.log('❌ Multi-agent chat page is not accessible');
    console.log('   Please ensure the frontend is running');
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Claude Code CLI Integration Test\n');
  
  // Test 1: Check Claude Code CLI availability
  const isClaudeAvailable = await testClaudeCodeCLIAvailability();
  console.log('');
  
  // Test 2: Check API connection
  const isAPIConnected = await testAPIConnection();
  console.log('');
  
  if (!isAPIConnected) {
    console.log('❌ Cannot continue without API connection');
    process.exit(1);
  }
  
  // Test 3: Register Claude Code CLI (if available)
  if (isClaudeAvailable) {
    const provider = await registerClaudeCodeCLI();
    console.log('');
  }
  
  // Test 4: List all providers
  const providers = await listLLMProviders();
  console.log('');
  
  // Test 5: Check multi-agent chat access
  await testMultiAgentChatAccess();
  console.log('');
  
  // Summary
  console.log('📋 INTEGRATION TEST SUMMARY:');
  console.log(`   Claude Code CLI Available: ${isClaudeAvailable ? '✅' : '❌'}`);
  console.log(`   API Connected: ${isAPIConnected ? '✅' : '❌'}`);
  console.log(`   Total LLM Providers: ${providers.length}`);
  
  const localProviders = providers.filter(p => p.provider === 'local');
  console.log(`   Local LLM Providers: ${localProviders.length}`);
  
  if (localProviders.length > 0) {
    console.log('');
    console.log('🎉 SUCCESS! Claude Code CLI integration is working!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open http://localhost:3000/multi-agent-chat');
    console.log('2. Create a new agent');
    console.log('3. Select "Claude Code CLI (Local)" as the LLM provider');
    console.log('4. Test conversations with your local Claude Code CLI');
  } else if (isClaudeAvailable) {
    console.log('');
    console.log('⚠️  Claude Code CLI is available but not yet registered as a provider');
    console.log('   This might be due to database or configuration issues');
  } else {
    console.log('');
    console.log('❌ Claude Code CLI integration is not working');
    console.log('   Please install Claude Code CLI first');
  }
}

// Run the test
main().catch(console.error);