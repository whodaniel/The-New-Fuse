/**
 * Discovery Client Example
 *
 * Demonstrates how to query and discover agents using the discovery API
 */

import axios from 'axios';
import {
  DiscoveryQuery,
  DiscoveryQueryResult,
  AgentStatus,
} from '../../packages/api/src/types/agent-discovery.types';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Example 1: Find agents that can review Python code
 */
async function findPythonCodeReviewers() {
  console.log('\n=== Finding Python Code Reviewers ===\n');

  const query: DiscoveryQuery = {
    capability: 'code-review',
    languages: ['python'],
    minConfidence: 0.8,
    status: [AgentStatus.ONLINE, AgentStatus.IDLE],
    sortBy: 'successRate',
    limit: 5,
  };

  try {
    const response = await axios.post<{ data: DiscoveryQueryResult }>(
      `${API_BASE_URL}/agents/discover`,
      query
    );

    const result = response.data.data;

    console.log(`Found ${result.total} matching agents (query time: ${result.queryTime}ms)\n`);

    for (const agent of result.agents) {
      console.log(`Agent: ${agent.registration.name}`);
      console.log(`  ID: ${agent.registration.agentId}`);
      console.log(`  Status: ${agent.status}`);
      console.log(`  Load: ${(agent.load * 100).toFixed(1)}%`);
      console.log(`  Success Rate: ${(agent.metrics.successRate * 100).toFixed(1)}%`);
      console.log(`  Avg Response: ${agent.metrics.avgResponseTime}ms`);
      console.log(`  Capabilities: ${agent.registration.capabilities.map((c) => c.name).join(', ')}`);
      console.log('');
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('Load Balancing Recommendations:');
      for (const rec of result.recommendations) {
        console.log(`  ${rec.agentId}: ${rec.reason} (score: ${rec.score.toFixed(2)})`);
      }
      console.log('');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 2: Find agents with low CPU usage
 */
async function findLowCpuAgents() {
  console.log('\n=== Finding Agents with <20% CPU Usage ===\n');

  const query: DiscoveryQuery = {
    maxCpuUsage: 20,
    status: [AgentStatus.ONLINE, AgentStatus.IDLE],
    sortBy: 'load',
  };

  try {
    const response = await axios.post<{ data: DiscoveryQueryResult }>(
      `${API_BASE_URL}/agents/discover`,
      query
    );

    const result = response.data.data;

    console.log(`Found ${result.total} agents with low CPU usage\n`);

    for (const agent of result.agents) {
      console.log(`${agent.registration.name}: CPU ${agent.metrics.cpuUsage.toFixed(1)}%, Load ${(agent.load * 100).toFixed(1)}%`);
    }
    console.log('');
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 3: Find agents in 'data-science' group
 */
async function findDataScienceAgents() {
  console.log('\n=== Finding Data Science Agents ===\n');

  const query: DiscoveryQuery = {
    groups: ['data-science'],
    sortBy: 'uptime',
  };

  try {
    const response = await axios.post<{ data: DiscoveryQueryResult }>(
      `${API_BASE_URL}/agents/discover`,
      query
    );

    const result = response.data.data;

    console.log(`Found ${result.total} data science agents\n`);

    for (const agent of result.agents) {
      console.log(`${agent.registration.name}:`);
      console.log(`  Groups: ${agent.registration.groups?.join(', ')}`);
      console.log(`  Uptime: ${Math.floor(agent.metrics.uptime / 3600)}h ${Math.floor((agent.metrics.uptime % 3600) / 60)}m`);
      console.log('');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 4: Semantic search for capabilities
 */
async function semanticCapabilitySearch() {
  console.log('\n=== Semantic Search: "analyze statistical data" ===\n');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/agents/discovery/match`,
      {
        query: 'analyze statistical data',
        minScore: 0.5,
        maxResults: 5,
        preferLowLoad: true,
      }
    );

    const matches = response.data.data.matches;

    console.log(`Found ${matches.length} capability matches\n`);

    for (const match of matches) {
      console.log(`Agent: ${match.agent.registration.name}`);
      console.log(`  Capability: ${match.capability.name}`);
      console.log(`  Score: ${(match.score * 100).toFixed(1)}%`);
      console.log(`  Reasons: ${match.matchReasons.join(', ')}`);
      console.log(`  Confidence: ${(match.capability.confidence * 100).toFixed(0)}%`);
      console.log('');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 5: Compose capabilities across multiple agents
 */
async function composeCapabilities() {
  console.log('\n=== Composing Capabilities: Data Cleaning → Analysis → Visualization ===\n');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/agents/discovery/compose`,
      {
        capabilities: ['data-cleaning', 'statistical-analysis', 'data-visualization'],
        maxChainLength: 5,
        preferReliable: true,
        maxCost: 0.5,
      }
    );

    const compositions = response.data.data.compositions;

    console.log(`Found ${compositions.length} possible compositions\n`);

    for (let i = 0; i < Math.min(3, compositions.length); i++) {
      const comp = compositions[i];
      console.log(`Composition ${i + 1}:`);
      console.log(`  Name: ${comp.composition.name}`);
      console.log(`  Agent Chain: ${comp.composition.agentChain.join(' → ')}`);
      console.log(`  Score: ${comp.score.toFixed(3)}`);
      console.log(`  Reliability: ${(comp.reliability * 100).toFixed(1)}%`);
      if (comp.composition.totalCost) {
        console.log(`  Total Cost: $${comp.composition.totalCost.toFixed(4)}`);
      }
      if (comp.composition.estimatedTime) {
        console.log(`  Estimated Time: ${comp.composition.estimatedTime}ms`);
      }
      console.log('');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 6: Get all agents and system health
 */
async function getSystemHealth() {
  console.log('\n=== System Health ===\n');

  try {
    const response = await axios.get(`${API_BASE_URL}/agents/discovery/system/health`);
    const health = response.data.data;

    console.log('System Status:');
    console.log(`  Healthy: ${health.system.healthy ? 'Yes' : 'No'}`);
    console.log(`  Timestamp: ${new Date(health.system.timestamp).toLocaleString()}`);
    console.log('');

    console.log('Agent Statistics:');
    console.log(`  Total Agents: ${health.agents.total}`);
    console.log(`  Online: ${health.agents.online}`);
    console.log(`  Healthy: ${health.agents.healthy}`);
    console.log(`  Average Load: ${(health.agents.avgLoad * 100).toFixed(1)}%`);
    console.log(`  Average Success Rate: ${(health.agents.avgSuccessRate * 100).toFixed(1)}%`);
    console.log('');
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 7: Advanced query with multiple filters
 */
async function advancedQuery() {
  console.log('\n=== Advanced Query: High-Quality Python Agents ===\n');

  const query: DiscoveryQuery = {
    capability: 'code',
    languages: ['python'],
    minConfidence: 0.85,
    minSuccessRate: 0.9,
    maxCpuUsage: 50,
    maxLoad: 0.6,
    status: [AgentStatus.ONLINE, AgentStatus.IDLE],
    semanticSearch: true,
    sortBy: 'successRate',
    limit: 5,
  };

  try {
    const response = await axios.post(
      `${API_BASE_URL}/agents/discovery/query/advanced`,
      query
    );

    const result = response.data.data;

    console.log(`Found ${result.total} high-quality Python agents\n`);

    for (const agent of result.agents) {
      console.log(`${agent.registration.name}:`);
      console.log(`  Success Rate: ${(agent.metrics.successRate * 100).toFixed(1)}%`);
      console.log(`  CPU: ${agent.metrics.cpuUsage.toFixed(1)}%`);
      console.log(`  Load: ${(agent.load * 100).toFixed(1)}%`);
      console.log(`  Response Time: ${agent.metrics.avgResponseTime}ms`);

      // Show best matching capability
      const pythonCaps = agent.registration.capabilities.filter(
        (cap) => cap.languages?.includes('python')
      );
      if (pythonCaps.length > 0) {
        const best = pythonCaps.sort((a, b) => b.confidence - a.confidence)[0];
        console.log(`  Best Python Capability: ${best.name} (${(best.confidence * 100).toFixed(0)}%)`);
      }
      console.log('');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Run all examples
 */
async function main() {
  console.log('========================================');
  console.log('   Agent Discovery System Examples');
  console.log('========================================');

  try {
    await getSystemHealth();
    await findPythonCodeReviewers();
    await findLowCpuAgents();
    await findDataScienceAgents();
    await semanticCapabilitySearch();
    await composeCapabilities();
    await advancedQuery();

    console.log('\n========================================');
    console.log('   All examples completed!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Failed to run examples:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {
  findPythonCodeReviewers,
  findLowCpuAgents,
  findDataScienceAgents,
  semanticCapabilitySearch,
  composeCapabilities,
  getSystemHealth,
  advancedQuery,
};
