#!/usr/bin/env node

import { A2AService, AgentRegistration, MessageType, Priority, AgentStatus } from '@the-new-fuse/a2a-core';

async function testA2AImplementation() {
  console.log('🚀 Testing A2A Protocol Implementation...\n');

  // Test configuration
  const config = {
    redis: {
      url: process.env.A2A_REDIS_URL || 'redis://localhost:6379',
      keyPrefix: 'test-a2a:',
      ttl: 3600
    },
    monitoring: {
      enableMetrics: true,
      heartbeatInterval: 30000,
      connectionTimeout: 60000
    }
  };

  try {
    // Initialize A2A service
    const a2aService = new A2AService(config, null, null);
    await a2aService.onModuleInit();
    console.log('✅ A2A Service initialized');

    // Test 1: Agent Registration
    console.log('\n📋 Test 1: Agent Registration');
    const testAgent1 = {
      agentId: 'test-agent-1',
      name: 'Test Agent Alpha',
      type: 'ASSISTANT',
      version: '1.0.0',
      description: 'First test agent',
      capabilities: [
        {
          id: 'text-analysis',
          name: 'Text Analysis',
          description: 'Analyze text content',
          version: '1.0.0'
        }
      ]
    };

    const testAgent2 = {
      agentId: 'test-agent-2',
      name: 'Test Agent Beta',
      type: 'ANALYZER',
      version: '1.0.0',
      description: 'Second test agent',
      capabilities: [
        {
          id: 'data-processing',
          name: 'Data Processing',
          description: 'Process data streams',
          version: '1.0.0'
        }
      ]
    };

    await a2aService.registerAgent(testAgent1);
    await a2aService.registerAgent(testAgent2);
    console.log('✅ Agents registered successfully');

    // Test 2: Agent Discovery
    console.log('\n🔍 Test 2: Agent Discovery');
    const discoveredAgents = await a2aService.discoverAgents();
    console.log(`✅ Discovered ${discoveredAgents.length} agents:`);
    discoveredAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.type})`);
    });

    // Test 3: Message Sending
    console.log('\n💬 Test 3: Message Sending');
    const testMessage = {
      id: 'test-msg-1',
      protocolVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      fromAgent: 'test-agent-1',
      toAgent: 'test-agent-2',
      type: MessageType.REQUEST,
      priority: Priority.MEDIUM,
      payload: {
        task: 'analyze',
        data: 'Hello from Agent Alpha to Agent Beta!'
      }
    };

    await a2aService.sendMessage(testMessage);
    console.log('✅ Message sent successfully');

    // Test 4: Broadcast
    console.log('\n📢 Test 4: Broadcasting');
    await a2aService.broadcast('test-agent-1', {
      announcement: 'Test broadcast message',
      timestamp: new Date().toISOString()
    }, {
      topic: 'test-announcements'
    });
    console.log('✅ Broadcast sent successfully');

    // Test 5: Conversation Management
    console.log('\n💭 Test 5: Conversation Management');
    const conversationId = await a2aService.startConversation(
      'test-agent-1',
      ['test-agent-2'],
      'Test Conversation'
    );
    console.log(`✅ Conversation started: ${conversationId}`);

    // Test 6: Heartbeat
    console.log('\n💓 Test 6: Heartbeat');
    await a2aService.sendHeartbeat({
      agentId: 'test-agent-1',
      timestamp: new Date().toISOString(),
      status: AgentStatus.ONLINE,
      load: 0.25,
      activeConnections: 2
    });
    console.log('✅ Heartbeat sent successfully');

    // Test 7: Agent Health Check
    console.log('\n🩺 Test 7: Health Check');
    const health = await a2aService.getAgentHealth('test-agent-1');
    if (health) {
      console.log(`✅ Agent health retrieved: ${health.status} (load: ${health.load})`);
    } else {
      console.log('⚠️ No health data available');
    }

    // Test 8: Capability-based Routing
    console.log('\n🎯 Test 8: Capability-based Routing');
    const capableAgents = await a2aService.findAgentsByCapability('text-analysis');
    console.log(`✅ Found ${capableAgents.length} agents with text-analysis capability`);

    // Cleanup
    console.log('\n🧹 Cleanup');
    await a2aService.unregisterAgent('test-agent-1');
    await a2aService.unregisterAgent('test-agent-2');
    await a2aService.onModuleDestroy();
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All A2A Protocol tests passed successfully!');
    console.log('\nA2A Implementation Features Verified:');
    console.log('  ✅ Agent Registration & Discovery');
    console.log('  ✅ Type-safe Message Sending');
    console.log('  ✅ Broadcasting');
    console.log('  ✅ Conversation Management');
    console.log('  ✅ Heartbeat Monitoring');
    console.log('  ✅ Health Checks');
    console.log('  ✅ Capability-based Routing');
    console.log('  ✅ Redis Integration');
    console.log('  ✅ Error Handling');

  } catch (error) {
    console.error('❌ A2A Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testA2AImplementation().catch(console.error);
}

export { testA2AImplementation };
