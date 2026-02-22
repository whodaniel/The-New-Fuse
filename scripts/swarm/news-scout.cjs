const fs = require('fs');
const path = require('path');
const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');

/**
 * AI News Scout Script (v3.0 - ZERO MOCKS)
 * 
 * Objectives:
 * 1. Read real market intelligence from 'scout_findings.json'.
 * 2. Generate a markdown report.
 * 3. Dispatch real tasks to the swarm.
 */

const FINDINGS_PATH = path.resolve(__dirname, '../../.agent/landscape/scout_findings.json');
const REPORT_PATH = path.resolve(__dirname, '../../.agent/landscape/DAILY_NEWS.md');

async function runScout() {
  console.log('🕵️ News Scout: Syncing latest market intelligence...');

  const client = new RedisAgentClient();
  try {
    await client.initialize();
    await client.register('News-Scout', 'worker', 'scout', ['web-search', 'market-analysis']);
  } catch (e) {
    console.warn('⚠️ Redis not available. Running in offline reporting mode.');
  }

  if (!fs.existsSync(FINDINGS_PATH)) {
    console.error(`❌ Findings file not found at ${FINDINGS_PATH}.`);
    process.exit(1);
  }

  const news = JSON.parse(fs.readFileSync(FINDINGS_PATH, 'utf-8'));

  // Generate Report
  const timestamp = new Date().toISOString();
  let markdown = `# AI Landscape Report - ${new Date().toLocaleDateString()}\n\n`;
  markdown += `*Generated at: ${timestamp}*\n\n`;
  markdown += `## 🚀 Latest Verified Trends\n\n`;

  news.forEach(item => {
    markdown += `### ${item.title}\n`;
    markdown += `- **Source**: ${item.source}\n`;
    markdown += `- **Impact**: ${item.threat}\n`;
    markdown += `- **Details**: ${item.details}\n`;
    if (item.link) markdown += `- **Link**: [View Source](${item.link})\n`;
    markdown += `\n`;
  });

  markdown += `\n## 🎯 Swarm Action Items\n\n`;
  
  for (const item of news) {
    if (item.threat === 'High' || item.threat === 'Medium') {
      const taskTitle = `Assimilation: ${item.title}`;
      markdown += `- [ ] **PRIORITY**: ${taskTitle}\n`;
      
      if (client.publisher) {
        console.log(`📢 Signaling Swarm: Dispatching task "${taskTitle}"`);
        const taskPayload = {
          id: `task_scout_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: taskTitle,
          description: `Strategic trend detected: ${item.title}. Source: ${item.source}. Details: ${item.details}`,
          priority: item.threat === 'High' ? 'high' : 'normal',
          status: 'queued',
          source: 'news-scout',
          itinerary: {
            lane: 'realtime_broker_routing',
            horizon: 'realtime'
          }
        };
        
        await client.publisher.lpush('tnf:master:tasks:planning', JSON.stringify(taskPayload));
      }
    }
  }

  fs.writeFileSync(REPORT_PATH, markdown);
  console.log(`✅ News Scout: Real report written to ${REPORT_PATH}`);
  
  if (client) await client.cleanup();
}

runScout().catch(err => {
  console.error('❌ News Scout failed:', err);
  process.exit(1);
});
