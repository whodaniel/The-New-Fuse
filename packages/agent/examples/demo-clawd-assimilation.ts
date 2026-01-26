import * as fs from 'fs';
import * as path from 'path';
import { ClawdEngine } from '../src/implementations/ClawdEngine';

async function runDemo() {
  const testRoot = path.join(__dirname, '.clawd-demo');
  const skillsPath = path.join(testRoot, 'clawd', 'skills');

  console.log('--- Starting Clawd Assimilation Demo ---');

  // 1. Setup Environment
  if (fs.existsSync(testRoot)) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(skillsPath, { recursive: true });

  // 2. Create a Mock Clawdbot Skill (Markdown format)
  const skillContent = `
---
name: morning-briefing
description: Summarize unread notifications and calendar events.
triggers: [cron:0 8 * * *]
---

# Morning Briefing Skill

## Implementation
\`\`\`js
console.log("Good morning! Checking your unread messages...");
console.log("System status: ONLINE");
return { status: "Briefing Sent" };
\`\`\`
  `;

  fs.writeFileSync(path.join(skillsPath, 'morning-briefing.md'), skillContent);
  console.log(`[Demo] Created mock skill at ${path.join(skillsPath, 'morning-briefing.md')}`);

  // 3. Initialize Assimilated Engine
  // We use the testRoot as the "User Home"
  const engine = new ClawdEngine(testRoot);

  // Give it a moment to scan
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 4. Test Protocol: List Skills
  const listReq = {
    type: 'req' as const,
    id: 'req-1',
    method: 'node.listSkills',
  };

  console.log(`[Demo] Sending Req: ${JSON.stringify(listReq)}`);
  const listRes = await engine.handleRequest(listReq);
  console.log(`[Demo] Received Res: ${JSON.stringify(listRes, null, 2)}`);

  // 5. Test Protocol: Invoke Skill
  const invokeReq = {
    type: 'req' as const,
    id: 'req-2',
    method: 'node.invoke',
    params: {
      skillName: 'morning-briefing',
      args: {},
    },
  };

  console.log(`[Demo] Sending Invoke Req: ${JSON.stringify(invokeReq)}`);
  const invokeRes = await engine.handleRequest(invokeReq);
  console.log(`[Demo] Invoke Res: ${JSON.stringify(invokeRes, null, 2)}`);

  console.log('--- Assimilation Demo Complete ---');
}

runDemo().catch(console.error);
