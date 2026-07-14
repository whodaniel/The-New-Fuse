#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WORKLOADS = {
  light: {
    type: 'light',
    messagesPerHour: 12,
    redisOpsPerMessage: 8,
    storageMb: 0.5,
    apiCallsPerHour: 2,
    dbQueriesPerHour: 1,
  },
  medium: {
    type: 'medium',
    messagesPerHour: 60,
    redisOpsPerMessage: 12,
    storageMb: 2,
    apiCallsPerHour: 15,
    dbQueriesPerHour: 8,
  },
  heavy: {
    type: 'heavy',
    messagesPerHour: 300,
    redisOpsPerMessage: 20,
    storageMb: 10,
    apiCallsPerHour: 60,
    dbQueriesPerHour: 30,
  },
  enterprise: {
    type: 'enterprise',
    messagesPerHour: 1200,
    redisOpsPerMessage: 35,
    storageMb: 50,
    apiCallsPerHour: 300,
    dbQueriesPerHour: 150,
  },
};

function calculateRedisCost(commandsPerMonth, storageMb) {
  const paidCommands = Math.max(0, commandsPerMonth - 500000);
  const commandCost = (paidCommands / 100000) * 0.20;
  const storageGb = storageMb / 1024;
  const paidStorageGb = Math.max(0, storageGb - 1);
  const storageCost = paidStorageGb * 0.25;
  return commandCost + storageCost;
}

function calculateComputeCost(cpuSeconds, memoryMbSeconds, instanceType = 'small') {
  const cpuCores = instanceType === 'micro' ? 0.5 : instanceType === 'small' ? 1 : 2;
  const memoryGb = instanceType === 'micro' ? 0.25 : instanceType === 'small' ? 0.5 : 2;
  const cpuCost = cpuSeconds * 0.0000247 * cpuCores;
  const memoryCost = memoryMbSeconds * 0.0000025 * memoryGb;
  return cpuCost + memoryCost;
}

function calculateDatabaseCost(mauPerMonth, storageGb) {
  const baseCost = 25;
  const additionalCompute = Math.max(0, mauPerMonth - 100000) * 0.00000325;
  const paidStorage = Math.max(0, storageGb - 8);
  const storageCost = paidStorage * 0.125;
  return baseCost + additionalCompute + storageCost;
}

class TNFCostSimulator {
  simulateAgentMonth(workload, agentCount = 1) {
    const monthSeconds = 30 * 24 * 60 * 60;
    const monthMinutes = 30 * 24 * 60;

    const messagesPerAgentMonth = workload.messagesPerHour * monthMinutes / 60;
    const totalMessages = messagesPerAgentMonth * agentCount;
    const totalRedisOps = totalMessages * workload.redisOpsPerMessage;
    const totalStorageMb = workload.storageMb * agentCount;
    const totalApiCalls = (workload.apiCallsPerHour * monthMinutes / 60) * agentCount;
    const totalDbQueries = (workload.dbQueriesPerHour * monthMinutes / 60) * agentCount;

    const avgCpuPerMessage = (workload.redisOpsPerMessage * 0.01) + (workload.apiCallsPerHour / workload.messagesPerHour * 0.005);
    const totalCpuSeconds = totalMessages * avgCpuPerMessage;
    const memoryMbSeconds = (50 + 5 * agentCount) * monthSeconds;
    const bandwidthMb = totalMessages * 0.0005;

    const redisCost = calculateRedisCost(totalRedisOps, totalStorageMb);
    const computeCost = calculateComputeCost(totalCpuSeconds, memoryMbSeconds, 'small');
    const databaseCost = calculateDatabaseCost(agentCount * 100, totalStorageMb / 1024);
    const bandwidthCost = bandwidthMb * 0.09;

    const totalMonthlyCost = redisCost + computeCost + databaseCost + bandwidthCost;

    return {
      scenario: `${workload.type} (${agentCount} agent${agentCount > 1 ? 's' : ''})`,
      duration: monthSeconds,
      metrics: {
        messagesProcessed: totalMessages,
        agentsActive: agentCount,
        redisCommands: totalRedisOps,
        redisStorageMb: totalStorageMb,
        cpuSeconds: totalCpuSeconds,
        memoryMbSeconds: memoryMbSeconds,
        apiRequests: totalApiCalls,
        databaseQueries: totalDbQueries,
        bandwidthMb: bandwidthMb,
      },
      costs: {
        compute: computeCost,
        redis: redisCost,
        database: databaseCost,
        bandwidth: bandwidthCost,
        totalMonthly: totalMonthlyCost,
        totalPerMessage: totalMonthlyCost / totalMessages,
        totalPerAgent: totalMonthlyCost / agentCount,
      },
      timestamp: new Date().toISOString(),
    };
  }

  simulateTeamWorkspace(lightUsers, mediumUsers, heavyUsers) {
    const monthSeconds = 30 * 24 * 60 * 60;
    const monthMinutes = 30 * 24 * 60;

    let totalMessages = 0;
    let totalRedisOps = 0;
    let totalStorageMb = 0;
    let totalApiCalls = 0;
    let totalDbQueries = 0;
    let totalAgents = 0;

    const light = WORKLOADS.light;
    totalMessages += light.messagesPerHour * monthMinutes / 60 * lightUsers;
    totalRedisOps += light.redisOpsPerMessage * light.messagesPerHour * monthMinutes / 60 * lightUsers;
    totalStorageMb += light.storageMb * lightUsers;
    totalApiCalls += light.apiCallsPerHour * monthMinutes / 60 * lightUsers;
    totalDbQueries += light.dbQueriesPerHour * monthMinutes / 60 * lightUsers;
    totalAgents += lightUsers;

    const medium = WORKLOADS.medium;
    totalMessages += medium.messagesPerHour * monthMinutes / 60 * mediumUsers;
    totalRedisOps += medium.redisOpsPerMessage * medium.messagesPerHour * monthMinutes / 60 * mediumUsers;
    totalStorageMb += medium.storageMb * mediumUsers;
    totalApiCalls += medium.apiCallsPerHour * monthMinutes / 60 * mediumUsers;
    totalDbQueries += medium.dbQueriesPerHour * monthMinutes / 60 * mediumUsers;
    totalAgents += mediumUsers * 3;

    const heavy = WORKLOADS.heavy;
    totalMessages += heavy.messagesPerHour * monthMinutes / 60 * heavyUsers;
    totalRedisOps += heavy.redisOpsPerMessage * heavy.messagesPerHour * monthMinutes / 60 * heavyUsers;
    totalStorageMb += heavy.storageMb * heavyUsers;
    totalApiCalls += heavy.apiCallsPerHour * monthMinutes / 60 * heavyUsers;
    totalDbQueries += heavy.dbQueriesPerHour * monthMinutes / 60 * heavyUsers;
    totalAgents += heavyUsers * 10;

    const totalBandwidthMb = totalMessages * 0.0005;
    const avgCpuPerMessage = (totalRedisOps / totalMessages) * 0.01;
    const totalCpuSeconds = totalMessages * avgCpuPerMessage;
    const memoryMbSeconds = (50 + totalStorageMb) * monthSeconds;

    const redisCost = calculateRedisCost(totalRedisOps, totalStorageMb);
    const computeCost = calculateComputeCost(totalCpuSeconds, memoryMbSeconds, 'medium');
    const databaseCost = calculateDatabaseCost(totalAgents * 100, totalStorageMb / 1024);
    const bandwidthCost = totalBandwidthMb * 0.09;

    const totalMonthlyCost = redisCost + computeCost + databaseCost + bandwidthCost;
    const totalUsers = lightUsers + mediumUsers + heavyUsers;

    return {
      scenario: `Team (${lightUsers} light, ${mediumUsers} medium, ${heavyUsers} heavy, ${totalAgents} total agents)`,
      duration: monthSeconds,
      metrics: {
        messagesProcessed: totalMessages,
        agentsActive: totalAgents,
        redisCommands: totalRedisOps,
        redisStorageMb: totalStorageMb,
        cpuSeconds: totalCpuSeconds,
        memoryMbSeconds: memoryMbSeconds,
        apiRequests: totalApiCalls,
        databaseQueries: totalDbQueries,
        bandwidthMb: totalBandwidthMb,
      },
      costs: {
        compute: computeCost,
        redis: redisCost,
        bandwidth: bandwidthCost,
        totalMonthly: totalMonthlyCost,
        totalPerMessage: totalMonthlyCost / totalMessages,
        totalPerAgent: totalMonthlyCost / totalAgents,
      },
      timestamp: new Date().toISOString(),
    };
  }

  runFullSimulation() {
    const results = [];

    console.log('='.repeat(80));
    console.log('TNF COST SIMULATION - REAL INFRASTRUCTURE COSTS');
    console.log('='.repeat(80));
    console.log('');

    console.log('SCENARIO 1: Single Agent Workloads (per agent per month)');
    console.log('-'.repeat(80));

    for (const [type, workload] of Object.entries(WORKLOADS)) {
      const result = this.simulateAgentMonth(workload, 1);
      results.push(result);
      console.log(`\n${type.toUpperCase()} User (1 agent):`);
      console.log(`  Messages: ${result.metrics.messagesProcessed.toLocaleString()}`);
      console.log(`  Redis Ops: ${result.metrics.redisCommands.toLocaleString()}`);
      console.log(`  Storage: ${result.metrics.redisStorageMb.toFixed(2)} MB`);
      console.log(`  Costs:`);
      console.log(`    - Compute: $${result.costs.compute.toFixed(4)}`);
      console.log(`    - Redis: $${result.costs.redis.toFixed(4)}`);
      console.log(`    - Database: $${result.costs.database.toFixed(4)}`);
      console.log(`    - Bandwidth: $${result.costs.bandwidth.toFixed(4)}`);
      console.log(`    - TOTAL: $${result.costs.totalMonthly.toFixed(4)}/month`);
      console.log(`    - Per message: $${(result.costs.totalPerMessage * 1000).toFixed(4)}/K`);
    }

    console.log('\n\nSCENARIO 2: Team Workspaces (monthly)');
    console.log('-'.repeat(80));

    const smallTeam = this.simulateTeamWorkspace(5, 2, 0);
    results.push(smallTeam);
    console.log(`\nSmall Team (5 light, 2 medium users, ~16 agents):`);
    console.log(`  Messages: ${smallTeam.metrics.messagesProcessed.toLocaleString()}`);
    console.log(`  Total Agents: ${smallTeam.metrics.agentsActive}`);
    console.log(`  TOTAL COST: $${smallTeam.costs.totalMonthly.toFixed(2)}/month`);
    console.log(`  Cost per user: $${(smallTeam.costs.totalMonthly / 7).toFixed(2)}`);

    const mediumTeam = this.simulateTeamWorkspace(20, 10, 2);
    results.push(mediumTeam);
    console.log(`\nMedium Team (20 light, 10 medium, 2 heavy users, ~64 agents):`);
    console.log(`  Messages: ${mediumTeam.metrics.messagesProcessed.toLocaleString()}`);
    console.log(`  Total Agents: ${mediumTeam.metrics.agentsActive}`);
    console.log(`  TOTAL COST: $${mediumTeam.costs.totalMonthly.toFixed(2)}/month`);
    console.log(`  Cost per user: $${(mediumTeam.costs.totalMonthly / 32).toFixed(2)}`);

    const largeTeam = this.simulateTeamWorkspace(100, 50, 10);
    results.push(largeTeam);
    console.log(`\nLarge Team (100 light, 50 medium, 10 heavy users, ~370 agents):`);
    console.log(`  Messages: ${largeTeam.metrics.messagesProcessed.toLocaleString()}`);
    console.log(`  Total Agents: ${largeTeam.metrics.agentsActive}`);
    console.log(`  TOTAL COST: $${largeTeam.costs.totalMonthly.toFixed(2)}/month`);
    console.log(`  Cost per user: $${(largeTeam.costs.totalMonthly / 160).toFixed(2)}`);

    return results;
  }

  calculateLTDBreakeven(costPerUserPerMonth, ltdPrice) {
    console.log('\n\nSCENARIO 3: LTD Break-Even Analysis');
    console.log('-'.repeat(80));
    console.log(`\nMonthly infrastructure cost per user: $${costPerUserPerMonth.toFixed(2)}`);
    console.log(`LTD price: $${ltdPrice}`);
    const breakEven = ltdPrice / costPerUserPerMonth;
    console.log(`Break-even period: ${breakEven.toFixed(1)} months`);

    console.log('\nProfit/Loss at different durations:');
    for (const months of [6, 12, 18, 24, 36, 48]) {
      const revenue = ltdPrice;
      const cost = costPerUserPerMonth * months;
      const profit = revenue - cost;
      const margin = (profit / revenue) * 100;
      console.log(`  ${months} months: ${profit >= 0 ? 'PROFIT' : 'LOSS'} $${profit.toFixed(2)} (${margin.toFixed(1)}%)`);
    }
  }

  generatePricingRecommendations() {
    console.log('\n\nSCENARIO 4: Pricing Recommendations');
    console.log('-'.repeat(80));

    const lightResult = this.simulateAgentMonth(WORKLOADS.light, 1);
    const mediumResult = this.simulateAgentMonth(WORKLOADS.medium, 1);
    const heavyResult = this.simulateAgentMonth(WORKLOADS.heavy, 1);

    const multiplier24 = 24 * 1.2;

    console.log('\n2-Year LTD Pricing (break-even + 20% margin at 24 months):');
    console.log(`  Light user: $${(lightResult.costs.totalMonthly * multiplier24).toFixed(0)}`);
    console.log(`  Medium user: $${(mediumResult.costs.totalMonthly * multiplier24).toFixed(0)}`);
    console.log(`  Heavy user: $${(heavyResult.costs.totalMonthly * multiplier24).toFixed(0)}`);

    console.log('\nMonthly Subscription Pricing (cost + 50% margin):');
    console.log(`  Light user: $${(lightResult.costs.totalMonthly * 1.5).toFixed(2)}/mo`);
    console.log(`  Medium user: $${(mediumResult.costs.totalMonthly * 1.5).toFixed(2)}/mo`);
    console.log(`  Heavy user: $${(heavyResult.costs.totalMonthly * 1.5).toFixed(2)}/mo`);

    console.log('\nUsage-Based Overage Pricing:');
    const avgMsgCost = ((lightResult.costs.totalPerMessage + mediumResult.costs.totalPerMessage + heavyResult.costs.totalPerMessage) / 3) * 1000 * 1.3;
    console.log(`  Per 1K messages: $${avgMsgCost.toFixed(4)}`);
  }
}

async function main() {
  console.log('\nStarting TNF Cost Simulation...\n');

  const simulator = new TNFCostSimulator();
  const results = simulator.runFullSimulation();

  const lightResult = simulator.simulateAgentMonth(WORKLOADS.light, 1);
  const mediumResult = simulator.simulateAgentMonth(WORKLOADS.medium, 1);

  simulator.calculateLTDBreakeven(mediumResult.costs.totalMonthly, 197);
  simulator.calculateLTDBreakeven(lightResult.costs.totalMonthly * 2, 497);
  simulator.calculateLTDBreakeven(mediumResult.costs.totalMonthly * 2, 997);

  simulator.generatePricingRecommendations();

  const outputPath = path.join(process.cwd(), 'cost-simulation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('KEY FINDINGS');
  console.log('='.repeat(80));
  console.log(`
1. LIGHT USER COST: ~$${lightResult.costs.totalMonthly.toFixed(2)}/month
   - 1 agent, ~8,640 messages/month
   - Unlimited $197 LTD = LOSS after month 2

2. MEDIUM USER COST: ~$${mediumResult.costs.totalMonthly.toFixed(2)}/month
   - 3 agents, ~43,200 messages/month
   - $497 LTD break-even at ~${Math.ceil(497 / mediumResult.costs.totalMonthly)} months

3. RECOMMENDED STRATEGY:
   - $497-997 for 2-year LTD with usage caps
   - Caps: 5K messages/month included
   - Overage: $0.005/message
   - This ensures profitability

4. UNSAFE PRICING:
   - $197 unlimited LTD = guaranteed LOSS
   - Any "forever free" tier = guaranteed LOSS at scale
`);
}

main().catch(console.error);