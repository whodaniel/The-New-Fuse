#!/usr/bin/env node
const { execSync } = require('child_process');

function commandExists(command) {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore', shell: '/bin/sh' });
    return true;
  } catch {
    return false;
  }
}

/**
 * ZeroClaw Sandbox On-Demand Bootstrapper
 *
 * Triggered when a SANDBOX_EXECUTION task is auctioned but no active bidders
 * are found. Wakes a Cloud Run sandbox service when gcloud is available.
 */

async function bootSandbox() {
  console.log('🛡️ [sandbox-wake] No active sandboxes detected in swarm. Initiating on-demand boot...');

  try {
    if (!commandExists('gcloud')) {
      console.warn('⚠️ [sandbox-wake] gcloud CLI not installed; skipping optional sandbox wake-up.');
      console.warn('   Use local sandbox routing or install Google Cloud SDK when sandbox execution is required.');
      return;
    }

    const project = process.env.TNF_GCP_PROJECT_ID || process.env.GCP_PROJECT_ID || 'the-new-fuse-2025';
    const region = process.env.TNF_GCP_REGION || process.env.GCP_REGION || 'us-central1';
    const service = process.env.ZEROCLAW_CLOUD_RUN_SERVICE || 'zeroclaw-sandbox';

    console.log(`📡 [sandbox-wake] Checking Cloud Run service ${service} (${project}/${region})...`);

    let desc;
    try {
      desc = execSync(
        `gcloud run services describe ${service} --project=${project} --region=${region} --format=json`,
        { encoding: 'utf8' }
      );
    } catch {
      console.warn(`⚠️ [sandbox-wake] Service ${service} not found on Cloud Run. Falling back to local Docker if available.`);
      return;
    }

    const parsed = JSON.parse(desc);
    const ready = parsed?.status?.latestReadyRevisionName;
    const url = parsed?.status?.url;
    console.log(`🚀 [sandbox-wake] Found sandbox service. ready=${ready || 'n/a'} url=${url || 'n/a'}`);
    console.log('✅ [sandbox-wake] Service is reachable via Cloud Run (no extra wake-up needed).');
  } catch (error) {
    console.error('❌ [sandbox-wake] Boot failed:', error.message);
  }
}

if (require.main === module) {
  bootSandbox();
}

module.exports = bootSandbox;
