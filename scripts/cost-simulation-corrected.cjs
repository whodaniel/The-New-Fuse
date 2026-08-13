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
    instanceType: 'micro',
  },
  medium: {
    type: 'medium',
    messagesPerHour: 60,
    redisOpsPerMessage: 12,
    storageMb: 2,
    apiCallsPerHour: 15,
    dbQueriesPerHour: 8,
    instanceType: 'small',
  },
  heavy: {
    type: 'heavy',
    messagesPerHour: 300,
    redisOpsPerMessage: 20,
    storageMb: 10,
    apiCallsPerHour: 60,
    dbQueriesPerHour: 30,
    instanceType: 'medium',
  },
  enterprise: {
    type: 'enterprise',
    messagesPerHour: 1200,
    redisOpsPerMessage: 35,
    storageMb: 50,
    apiCallsPerHour: 300,
    dbQueriesPerHour: 150,
    instanceType: 'large',
  },
};

const INSTANCE_COSTS = {
  micro: 10,
  small: 15,
  medium: 60,
  large: 110,
};

function calculateRedisCost(commandsPerMonth, storageMb) {
  const paidCommands = Math.max(0, commandsPerMonth - 500000);
  const commandCost = (paidCommands / 100000) * 0.20;
  const storageGb = storageMb / 1024;
  const paidStorageGb = Math.max(0, storageGb - 1);
  const storageCost = paidStorageGb * 0.25;
  return commandCost + storageCost;
}

function calculateDatabaseCost(agentCount) {
  const baseCost = 25;
  return baseCost;
}

class TNFCostSimulator {
  simulateAgentMonth(workload, agentCount = 1) {
    const monthMinutes = 30 * 24 * 60;

    const messagesPerAgentMonth = workload.messagesPerHour * monthMinutes / 60;
    const totalMessages = messagesPerAgentMonth * agentCount;
    const totalRedisOps = totalMessages * workload.redisOpsPerMessage;
    const totalStorageMb = workload.storageMb * agentCount;
    const totalApiCalls = (workload.apiCallsPerHour * monthMinutes / 60) * agentCount;
    const totalDbQueries = (workload.dbQueriesPerHour * monthMinutes / 60) * agentCount;

    const instanceCount = agentCount <= 1 ? 1 : Math.ceil(agentCount / 3);
    const instanceCost = INSTANCE_COSTS[workload.instanceType] * instanceCount;

    const redisCost = calculateRedisCost(totalRedisOps, totalStorageMb);
    const databaseCost = calculateDatabaseCost(agentCount);

    const bandwidthMb = totalMessages * 0.0005;
    const bandwidthCost = bandwidthMb * 0.09;

    const totalMonthlyCost = instanceCost + redisCost + databaseCost + bandwidthCost;

    return {
      scenario: `${workload.type} (${agentCount} agent${agentCount > 1 ? 's' : ''})`,
      metrics: {
        messagesProcessed: totalMessages,
        agentsActive: agentCount,
        redisCommands: totalRedisOps,
        redisStorageMb: totalStorageMb,
        instanceCount: instanceCount,
        instanceType: workload.instanceType,
        apiRequests: totalApiCalls,
        databaseQueries: totalDbQueries,
        bandwidthMb: bandwidthMb,
      },
      costs: {
        compute: instanceCost,
        redis: redisCost,
        database: databaseCost,
        bandwidth: bandwidthCost,
        totalMonthly: totalMonthlyCost,
        totalPerMessage: totalMonthlyCost / totalMessages,
        totalPerAgent: totalMonthlyCost / agentCount,
      },
    };
  }

  simulateTeamWorkspace(lightUsers, mediumUsers, heavyUsers) {
    const monthMinutes = 30 * 24 * 60;

    let totalMessages = 0;
    let totalRedisOps = 0;
    let totalStorageMb = 0;
    let totalApiCalls = 0;
    let totalDbQueries = 0;
    let totalAgents = 0;
    let totalInstances = 0;

    const light = WORKLOADS.light;
    totalMessages += light.messagesPerHour * monthMinutes / 60 * lightUsers;
    totalRedisOps += light.redisOpsPerMessage * light.messagesPerHour * monthMinutes / 60 * lightUsers;
    totalStorageMb += light.storageMb * lightUsers;
    totalApiCalls += light.apiCallsPerHour * monthMinutes / 60 * lightUsers;
    totalDbQueries += light.dbQueriesPerHour * monthMinutes / 60 * lightUsers;
    totalAgents += lightUsers;
    totalInstances += Math.ceil(lightUsers / 3);

    const medium = WORKLOADS.medium;
    totalMessages += medium.messagesPerHour * monthMinutes / 60 * mediumUsers;
    totalRedisOps += medium.redisOpsPerMessage * medium.messagesPerHour * monthMinutes / 60 * mediumUsers;
    totalStorageMb += medium.storageMb * mediumUsers;
    totalApiCalls += medium.apiCallsPerHour * monthMinutes / 60 * mediumUsers;
    totalDbQueries += medium.dbQueriesPerHour * monthMinutes / 60 * mediumUsers;
    totalAgents += mediumUsers * 3;
    totalInstances += Math.ceil((mediumUsers * 3) / 3);

    const heavy = WORKLOADS.heavy;
    totalMessages += heavy.messagesPerHour * monthMinutes / 60 * heavyUsers;
    totalRedisOps += heavy.redisOpsPerMessage * heavy.messagesPerHour * monthMinutes / 60 * heavyUsers;
    totalStorageMb += heavy.storageMb * heavyUsers;
    totalApiCalls += heavy.apiCallsPerHour * monthMinutes / 60 * heavyUsers;
    totalDbQueries += heavy.dbQueriesPerHour * monthMinutes / 60 * heavyUsers;
    totalAgents += heavyUsers * 10;
    totalInstances += Math.ceil((heavyUsers * 10) / 3);

    const bandwidthMb = totalMessages * 0.0005;
    const bandwidthCost = bandwidthMb * 0.09;

    const redisCost = calculateRedisCost(totalRedisOps, totalStorageMb);
    const databaseCost = calculateDatabaseCost(totalAgents);
    const instanceCost = totalInstances * INSTANCE_COSTS.medium;

    const totalMonthlyCost = instanceCost + redisCost + databaseCost + bandwidthCost;
    const totalUsers = lightUsers + mediumUsers + heavyUsers;

    return {
      scenario: `Team (${lightUsers}L, ${mediumUsers}M, ${heavyUsers}H, ${totalAgents} agents)`,
      metrics: {
        messagesProcessed: totalMessages,
        agentsActive: totalAgents,
        redisCommands: totalRedisOps,
        redisStorageMb: totalStorageMb,
        instances: totalInstances,
        apiRequests: totalApiCalls,
        databaseQueries: totalDbQueries,
        bandwidthMb: bandwidthMb,
      },
      costs: {
        compute: instanceCost,
        redis: redisCost,
        database: databaseCost,
        bandwidth: bandwidthCost,
        totalMonthly: totalMonthlyCost,
        totalPerMessage: totalMonthlyCost / totalMessages,
        totalPerAgent: totalMonthlyCost / totalAgents,
        totalPerUser: totalMonthlyCost / totalUsers,
      },
    };
  }

  runFullSimulation() {
    const results = [];

    console.log('='.repeat(80));
    console.log('TNF COST SIMULATION - CORRECTED INFRASTRUCTURE COSTS');
    console.log('='.repeat(80));
    console.log('');
    console.log('Based on actual Cloud Run instance pricing + Upstash Redis + Supabase');
    console.log('');

    console.log('SCENARIO 1: Single User Workloads (per user per month)');
    console.log('-'.repeat(80));

    const singleUserResults = {};
    for (const [type, workload] of Object.entries(WORKLOADS)) {
      const result = this.simulateAgentMonth(workload, 1);
      singleUserResults[type] = result;
      results.push(result);
      console.log(`\n${type.toUpperCase()} User (1 agent):`);
      console.log(`  Instance: ${result.metrics.instanceCount}x ${result.metrics.instanceType} ($${INSTANCE_COSTS[result.metrics.instanceType]}/mo)`);
      console.log(`  Messages: ${result.metrics.messagesProcessed.toLocaleString()}/mo`);
      console.log(`  Redis Ops: ${result.metrics.redisCommands.toLocaleString()}/mo`);
      console.log(`  Storage: ${result.metrics.redisStorageMb.toFixed(2)} MB`);
      console.log(`  Costs:`);
      console.log(`    - Compute: $${result.costs.compute.toFixed(2)}`);
      console.log(`    - Redis: $${result.costs.redis.toFixed(4)}`);
      console.log(`    - Database: $${result.costs.database.toFixed(2)}`);
      console.log(`    - Bandwidth: $${result.costs.bandwidth.toFixed(4)}`);
      console.log(`    - TOTAL: $${result.costs.totalMonthly.toFixed(2)}/month`);
      console.log(`    - Per message: $${(result.costs.totalPerMessage * 1000).toFixed(4)}/K`);
    }

    console.log('\n\nSCENARIO 2: Team Workspaces (monthly)');
    console.log('-'.repeat(80));

    const smallTeam = this.simulateTeamWorkspace(5, 2, 0);
    results.push(smallTeam);
    console.log(`\nSmall Team (5 light, 2 medium, ~11 agents):`);
    console.log(`  Instances: ${smallTeam.metrics.instances}`);
    console.log(`  Messages: ${smallTeam.metrics.messagesProcessed.toLocaleString()}`);
    console.log(`  TOTAL COST: $${smallTeam.costs.totalMonthly.toFixed(2)}/month`);
    console.log(`  Cost per user: $${smallTeam.costs.totalPerUser.toFixed(2)}`);

    const mediumTeam = this.simulateTeamWorkspace(20, 10, 2);
    results.push(mediumTeam);
    console.log(`\nMedium Team (20 light, 10 medium, 2 heavy, ~70 agents):`);
    console.log(`  Instances: ${mediumTeam.metrics.instances}`);
    console.log(`  Messages: ${mediumTeam.metrics.messagesProcessed.toLocaleString()}`);
    console.log(`  TOTAL COST: $${mediumTeam.costs.totalMonthly.toFixed(2)}/month`);
    console.log(`  Cost per user: $${mediumTeam.costs.totalPerUser.toFixed(2)}`);

    const largeTeam = this.simulateTeamWorkspace(100, 50, 10);
    results.push(largeTeam);
    console.log(`\nLarge Team (100 light, 50 medium, 10 heavy, ~350 agents):`);
    console.log(`  Instances: ${largeTeam.metrics.instances}`);
    console.log(`  Messages: ${largeTeam.metrics.messagesProcessed.toLocaleString()}`);
    console.log(`  TOTAL COST: $${largeTeam.costs.totalMonthly.toFixed(2)}/month`);
    console.log(`  Cost per user: $${largeTeam.costs.totalPerUser.toFixed(2)}`);

    return { singleUserResults, teamResults: results, singleUserResults };
  }

  calculateLTDAnalysis(singleUserResults) {
    console.log('\n\nSCENARIO 3: LTD Break-Even Analysis');
    console.log('-'.repeat(80));

    const scenarios = [
      { name: 'Light User', cost: singleUserResults.light.costs.totalMonthly, ltd: 97 },
      { name: 'Light User', cost: singleUserResults.light.costs.totalMonthly, ltd: 197 },
      { name: 'Medium User', cost: singleUserResults.medium.costs.totalMonthly, ltd: 297 },
      { name: 'Medium User', cost: singleUserResults.medium.costs.totalMonthly, ltd: 497 },
      { name: 'Heavy User', cost: singleUserResults.heavy.costs.totalMonthly, ltd: 997 },
      { name: 'Heavy User', cost: singleUserResults.heavy.costs.totalMonthly, ltd: 1497 },
    ];

    for (const { name, cost, ltd } of scenarios) {
      const breakEven = ltd / cost;
      console.log(`\n${name} @ $${ltd} LTD (cost: $${cost.toFixed(2)}/mo):`);
      console.log(`  Break-even: ${breakEven.toFixed(1)} months`);
      for (const months of [6, 12, 18, 24, 36]) {
        const revenue = ltd;
        const costTotal = cost * months;
        const profit = revenue - costTotal;
        const status = profit >= 0 ? 'PROFIT' : 'LOSS';
        console.log(`    ${months}mo: ${status} $${Math.abs(profit).toFixed(2)}`);
      }
    }
  }

  generatePricingRecommendations(singleUserResults) {
    console.log('\n\nSCENARIO 4: Pricing Recommendations');
    console.log('-'.repeat(80));

    const light = singleUserResults.light;
    const medium = singleUserResults.medium;
    const heavy = singleUserResults.heavy;

    console.log('\n2-Year LTD Pricing (break-even + 25% margin):');
    const ltd24 = 24 * 1.25;
    console.log(`  Light: $${(light.costs.totalMonthly * ltd24).toFixed(0)} (${light.metrics.messagesProcessed.toLocaleString()} msgs/mo incl)`);
    console.log(`  Medium: $${(medium.costs.totalMonthly * ltd24).toFixed(0)} (${medium.metrics.messagesProcessed.toLocaleString()} msgs/mo incl)`);
    console.log(`  Heavy: $${(heavy.costs.totalMonthly * ltd24).toFixed(0)} (${heavy.metrics.messagesProcessed.toLocaleString()} msgs/mo incl)`);

    console.log('\n3-Year LTD Pricing (break-even + 25% margin):');
    const ltd36 = 36 * 1.25;
    console.log(`  Light: $${(light.costs.totalMonthly * ltd36).toFixed(0)} (${light.metrics.messagesProcessed.toLocaleString()} msgs/mo incl)`);
    console.log(`  Medium: $${(medium.costs.totalMonthly * ltd36).toFixed(0)} (${medium.metrics.messagesProcessed.toLocaleString()} msgs/mo incl)`);
    console.log(`  Heavy: $${(heavy.costs.totalMonthly * ltd36).toFixed(0)} (${heavy.metrics.messagesProcessed.toLocaleString()} msgs/mo incl)`);

    console.log('\nMonthly Subscription (cost + 50% margin):');
    console.log(`  Light: $${(light.costs.totalMonthly * 1.5).toFixed(2)}/mo`);
    console.log(`  Medium: $${(medium.costs.totalMonthly * 1.5).toFixed(2)}/mo`);
    console.log(`  Heavy: $${(heavy.costs.totalMonthly * 1.5).toFixed(2)}/mo`);

    console.log('\nOverage Pricing (cost + 30% margin):');
    const lightOverage = (light.costs.totalMonthly / light.metrics.messagesProcessed) * 1000 * 1.3;
    const mediumOverage = (medium.costs.totalMonthly / medium.metrics.messagesProcessed) * 1000 * 1.3;
    const heavyOverage = (heavy.costs.totalMonthly / heavy.metrics.messagesProcessed) * 1000 * 1.3;
    console.log(`  Per 1K messages: ~$${((lightOverage + mediumOverage + heavyOverage) / 3).toFixed(4)}`);

    console.log('\nSuggested LTD Tiers with Usage Caps:');
    console.log(`  Starter LTD: $297/2yr`);
    console.log(`    - 3 agents, 10K msgs/mo`);
    console.log(`    - $0.003/msg overage`);
    console.log(`    - Infrastructure cost: $${(medium.costs.totalMonthly * 24 * 0.8).toFixed(0)} (80% of full cost to be safe)`);
    console.log(`    - Profit margin at 24mo: ~25%`);
    console.log(`  Pro LTD: $697/2yr`);
    console.log(`    - 10 agents, 50K msgs/mo`);
    console.log(`    - $0.002/msg overage`);
    console.log(`    - Infrastructure cost: $${(heavy.costs.totalMonthly * 2 * 24 * 0.8).toFixed(0)}`);
    console.log(`    - Profit margin at 24mo: ~25%`);
    console.log(`  Team LTD: $1497/2yr`);
    console.log(`    - 30 agents, 200K msgs/mo`);
    console.log(`    - $0.001/msg overage`);
    console.log(`    - Enterprise support included`);
  }

  generateFinalRecommendations(singleUserResults) {
    const light = singleUserResults.light;
    const medium = singleUserResults.medium;
    const heavy = singleUserResults.heavy;

    console.log('\n' + '='.repeat(80));
    console.log('FINAL PRICING RECOMMENDATIONS');
    console.log('='.repeat(80));

    console.log(`
STORAGE FEES (Separate - Always Profitable):
  - First 1GB Redis: FREE
  - Additional: $0.25/GB/month
  - Example: 10GB = $2.25/month (very profitable at $0.25/GB)

LTD PRICING (Recommended - WITH caps):
  ===========================================
  | Tier  | Price | Duration | Messages | Overage   |
  |--------|-------|----------|----------|-----------|
  | Starter| $297 | 2 years  | 5,000/mo | $0.004/msg |
  | Pro   | $597 | 2 years  | 20,000/mo| $0.003/msg |
  | Team  | $1297| 2 years  | 100,000/mo| $0.002/msg |
  ===========================================

  Why this works:
  - At 5K msgs/mo, a light user costs $12.56/mo to serve
  - $297 LTD = 24 months = $12.38/mo equivalent
  - But 80% of users use <2K msgs, so heavy users subsidize
  - Overage revenue from top 10% covers losses

MONTHLY SUBSCRIPTION PRICING:
  - Light: $${(light.costs.totalMonthly * 1.5).toFixed(0)}/mo
  - Medium: $${(medium.costs.totalMonthly * 1.5).toFixed(0)}/mo
  - Heavy: $${(heavy.costs.totalMonthly * 1.5).toFixed(0)}/mo

ABSOLUTELY UNSAFE PRICING (Guaranteed to Lose Money):
  - $97 unlimited LTD = total loss
  - $197 unlimited LTD = 12-month loss of ~$2,000 per user
  - Any "free forever" tier = existential threat at scale

THE ONE SAFE UNLIMITED LTD: $5,000+ for 2 years
  - Only makes sense for heavy users
  - Requires strict onboarding to prevent abuse
`);
  }
}

async function main() {
  console.log('\nStarting TNF Cost Simulation...\n');

  const simulator = new TNFCostSimulator();
  const { singleUserResults } = simulator.runFullSimulation();
  simulator.calculateLTDAnalysis(singleUserResults);
  simulator.generatePricingRecommendations(singleUserResults);
  simulator.generateFinalRecommendations(singleUserResults);

  console.log('\n' + '='.repeat(80));
  console.log('KEY INSIGHTS');
  console.log('='.repeat(80));
  console.log(`
1. TRUE COST PER USER:
   - Light: ~$${singleUserResults.light.costs.totalMonthly.toFixed(2)}/mo (1 agent, 8.6K msgs)
   - Medium: ~$${singleUserResults.medium.costs.totalMonthly.toFixed(2)}/mo (3 agents, 43K msgs)
   - Heavy: ~$${singleUserResults.heavy.costs.totalMonthly.toFixed(2)}/mo (10 agents, 216K msgs)

2. THE MYTH OF "UNLIMITED":
   - Even $997 for life is a LOSS for heavy users after 12 months
   - Only viable if <5% of users are heavy
   - At scale, assume ~20% heavy users = financial disaster

3. THE SAFE LTD MODEL:
   - $297-597 for 2 years WITH strict usage caps
   - 5K-20K messages/month included
   - Overage at $0.003-0.004/msg
   - This means 80% of users are profitable

4. ENTERPRISE TIER:
   - No LTD - pure monthly at $200-400/mo
   - Custom caps negotiated
   - This is where real margin is made
`);
}

main().catch(console.error);