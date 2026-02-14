#!/usr/bin/env node

/**
 * TNF Copilot CLI
 *
 * A standalone CLI tool for the "Constant AI Copilot" - capturing context,
 * analyzing it with OpenClaw, and respecting user privacy/security directives.
 *
 * Usage:
 *   node tools/copilot-cli.js start [--interval 30] [--prompt "Your directive"]
 *   node tools/copilot-cli.js once
 *   node tools/copilot-cli.js help
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const util = require('util');

const execAsync = util.promisify(exec);

// Configuration Defaults
const CONFIG = {
  intervalMs: 30000,
  apiEndpoint: "http://127.0.0.1:18789/v1/chat/completions",
  model: "kilo/z-ai/glm-5:free",
  directives: "Extract key information regarding user activity, context, and potential needs from this screen.",
  cleanup: true,
  tempDir: os.tmpdir(),
};

// ANSI Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(type, msg) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  let color = colors.reset;
  let label = "INFO";

  switch(type) {
    case 'info': color = colors.blue; label = "INFO"; break;
    case 'success': color = colors.green; label = "DONE"; break;
    case 'warn': color = colors.yellow; label = "WARN"; break;
    case 'error': color = colors.red; label = "ERR "; break;
    case 'context': color = colors.cyan; label = "CXT "; break;
  }

  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}[${label}]${colors.reset} ${msg}`);
}

async function captureScreen(filePath) {
  try {
    // macOS specific screencapture
    // -x: no sound
    // -t png: format
    // -C: capture cursor
    await execAsync(`screencapture -x -C -t png "${filePath}"`);
    return true;
  } catch (error) {
    log('error', `Screenshot failed: ${error.message}`);
    return false;
  }
}

async function analyzeContext(imagePath, prompt) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;

    log('info', `Sending context to OpenClaw (${(imageBuffer.length / 1024).toFixed(2)} KB)...`);

    const payload = {
      model: CONFIG.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || CONFIG.directives },
            { type: "image_url", image_url: { url: dataUri } }
          ]
        }
      ],
      max_tokens: 500
    };

    const response = await fetch(CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    log('error', `Analysis failed: ${error.message}`);
    if (error.cause) log('error', `Cause: ${error.cause}`);
    return null;
  }
}

async function runCycle(isLoop = false) {
  const timestamp = Date.now();
  const filename = `tnf_copilot_cli_${timestamp}.png`;
  const filePath = path.join(CONFIG.tempDir, filename);

  log('info', `Capturing context...`);

  const captured = await captureScreen(filePath);
  if (!captured) return;

  const analysis = await analyzeContext(filePath, CONFIG.directives);

  // Security Wall: Immediate Cleanup
  if (CONFIG.cleanup && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    log('success', `Secure cleanup: Screenshot deleted.`);
  }

  if (analysis && analysis.choices && analysis.choices[0]) {
    const content = analysis.choices[0].message.content;
    log('context', `\n${colors.bright}Analysis Result:${colors.reset}\n${colors.dim}${content}${colors.reset}\n`);
  } else {
    log('warn', 'No analysis content received.');
  }

  if (isLoop) {
    log('info', `Sleeping for ${CONFIG.intervalMs / 1000}s...`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--interval' && args[i+1]) CONFIG.intervalMs = parseInt(args[i+1]) * 1000;
    if (args[i] === '--prompt' && args[i+1]) CONFIG.directives = args[i+1];
    if (args[i] === '--endpoint' && args[i+1]) CONFIG.apiEndpoint = args[i+1];
    if (args[i] === '--model' && args[i+1]) CONFIG.model = args[i+1];
    // Security flag to keep files (debug only)
    if (args[i] === '--no-cleanup') CONFIG.cleanup = false;
  }

  console.log(`${colors.bright}${colors.cyan}TNF COPILOT CLI${colors.reset}`);
  console.log(`${colors.dim}Endpoint: ${CONFIG.apiEndpoint}${colors.reset}`);
  console.log(`${colors.dim}Model:    ${CONFIG.model}${colors.reset}`);
  console.log(`${colors.dim}Security: ${CONFIG.cleanup ? 'Strict (Auto-delete)' : 'Relaxed (Keep files)'}${colors.reset}\n`);

  if (command === 'start') {
    log('info', `Starting continuous capture (Interval: ${CONFIG.intervalMs/1000}s)`);
    // Initial run
    await runCycle(true);
    // Interval run
    setInterval(() => runCycle(true), CONFIG.intervalMs);
  } else if (command === 'once') {
    log('info', 'Running single capture cycle...');
    await runCycle(false);
  } else {
    console.log(`
Usage:
  ${colors.green}node tools/copilot-cli.js start${colors.reset}    Start continuous loop
  ${colors.green}node tools/copilot-cli.js once${colors.reset}     Capture single context snapshot

Options:
  --interval [sec]   Set capture interval (default: 30)
  --prompt "..."     Set analysis directive
  --model "..."      Set Vision model
    `);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
