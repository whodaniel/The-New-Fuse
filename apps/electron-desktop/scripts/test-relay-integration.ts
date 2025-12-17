import fs from 'fs';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';
import { BrowserContext, chromium } from 'playwright';

const EXTENSION_PATH = path.resolve(__dirname, '../../chrome-extension');
const RELAY_URL = 'http://localhost:3000';

async function main() {
  console.log(`Starting Final Relay Integration Verification...`);

  // Create temp user data dir for clean profile
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-user-data-'));
  let context: BrowserContext;

  try {
    console.log(`Launching browser with extension...`);
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });

    // Wait for extension to initialize and auto-connect
    console.log('Waiting 10s for extension to auto-connect...');
    await new Promise((r) => setTimeout(r, 10000));

    // Check Relay for Agents
    console.log('Fetching connected agents from Relay...');
    const agentsRes = await fetch(`${RELAY_URL}/agents`);
    const agentsData: any = await agentsRes.json();

    // Handle array response
    const agentsList = Array.isArray(agentsData) ? agentsData : agentsData.agents || [];
    console.log(`Relay reports ${agentsList.length} connected agents.`);

    const chromeAgent = agentsList.find((a: any) => a.type === 'browser-bridge');

    if (chromeAgent) {
      console.log('✅ PASS: Found Chrome Extension agent!');
      console.log(`   ID: ${chromeAgent.id}`);
      console.log(`   Type: ${chromeAgent.type}`);
      console.log(`   Registered At: ${chromeAgent.registeredAt}`);
    } else {
      console.error('❌ FAIL: Chrome Extension agent NOT found in relay list.');
      console.error('Current Agents:', JSON.stringify(agentsList, null, 2));
      process.exit(1);
    }
  } catch (e) {
    console.error('Test execution failed:', e);
    process.exit(1);
  } finally {
    if (context!) await context.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main();
