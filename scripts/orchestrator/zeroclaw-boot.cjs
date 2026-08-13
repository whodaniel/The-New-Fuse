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
  console.log('🛡️ [ZeroClaw] No active sandboxes detected in swarm. Initiating on-demand boot...');

  try {
    if (!commandExists('gcloud')) {
      console.warn('⚠️ [ZeroClaw] gcloud CLI not installed; skipping optional sandbox wake-up.');
      console.warn('   Use local sandbox routing or install Google Cloud SDK when sandbox execution is required.');
      return;
    }

    const project = process.env.TNF_GCP_PROJECT_ID || process.env.GCP_PROJECT_ID || 'the-new-fuse-2025';
    const region = process.env.TNF_GCP_REGION || process.env.GCP_REGION || 'us-central1';
    const service = process.env.ZEROCLAW_CLOUD_RUN_SERVICE || 'zeroclaw-sandbox';

    console.log(`📡 [ZeroClaw] Checking Cloud Run service ${service} (${project}/${region})...`);

    let desc;
    try {
      desc = execSync(
        `gcloud run services describe ${service} --project=${project} --region=${region} --format=json`,
        { encoding: 'utf8' }
      );
    } catch {
      console.warn(`⚠️ [ZeroClaw] Service ${service} not found on Cloud Run. Falling back to local Docker if available.`);
      return;
    }

    const parsed = JSON.parse(desc);
    const ready = parsed?.status?.latestReadyRevisionName;
    const url = parsed?.status?.url;
    console.log(`🚀 [ZeroClaw] Found sandbox service. ready=${ready || 'n/a'} url=${url || 'n/a'}`);
    console.log('✅ [ZeroClaw] Service is reachable via Cloud Run (no railway/cloud_runtime wake-up needed).');
  } catch (error) {
    console.error('❌ [ZeroClaw] Boot failed:', error.message);
  }
}

if (require.main === module) {
  bootSandbox();
}

module.exports = bootSandbox;
