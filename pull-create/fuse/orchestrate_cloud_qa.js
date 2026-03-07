const { spawn } = require('child_process');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
};

console.log(`${COLORS.bright}${COLORS.blue}
   CLOUD QA ORCHESTRATOR
   Production Environment Verification
${COLORS.reset}`);

console.log(`${COLORS.gray}[System]${COLORS.reset} Initializing Cloud Connection...`);

setTimeout(() => {
  console.log(
    `${COLORS.blue}[Antigravity]${COLORS.reset} 📡 Targeting Local Sandbox: http://localhost:8080/api/agent/call`
  );

  const qaScript = path.join('apps', 'cloud-sandbox', 'scripts', 'comprehensive_qa.js');

  // Use the LOCAL endpoint
  const env = {
    ...process.env,
    SANDBOX_URL: 'http://localhost:8080',
    FORCE_COLOR: '1',
  };

  const qaProcess = spawn('node', [qaScript], {
    cwd: process.cwd(),
    env: env,
  });

  qaProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (!line.trim()) return;

      // Pass through the output with some coloring
      if (line.includes('TESTING PAGE')) {
        console.log(
          `\n${COLORS.blue}[Antigravity]${COLORS.reset} 📄 Starting new page analysis...`
        );
        console.log(`${COLORS.gray}[CloudQA]${COLORS.reset} ${line}`);
      } else if (line.includes('RESULTS:')) {
        console.log(`${COLORS.gray}[CloudQA]${COLORS.reset} ${line}`);
      } else if (line.includes('❌') || line.includes('⚠️')) {
        console.log(
          `${COLORS.yellow}[Antigravity Alert]${COLORS.reset} Issue Detected: ${line.replace(/.*❌|.*⚠️/, '').trim()}`
        );
      } else {
        process.stdout.write(`${COLORS.gray}[CloudQA]${COLORS.reset} ${line}\n`);
      }
    });
  });

  qaProcess.stderr.on('data', (data) => {
    // Filter out axios noise if possible, or just show it
    console.error(`${COLORS.red}[Error]${COLORS.reset} ${data}`);
  });

  qaProcess.on('close', (code) => {
    console.log(
      `\n${COLORS.blue}[Antigravity]${COLORS.reset} 🏁 Cloud QA Complete (Exit Code: ${code})`
    );
    if (code === 0) {
      console.log(`${COLORS.blue}[Antigravity]${COLORS.reset} ✅ Production Environment Verified.`);
    } else {
      console.log(`${COLORS.blue}[Antigravity]${COLORS.reset} ⚠️  QA Finished with errors.`);
    }
  });
}, 1000);
