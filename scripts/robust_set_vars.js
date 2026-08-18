#!/usr/bin/env node
/**
 * robust_set_vars.js — retired Railway/cloud_runtime variable setter.
 * Use gcloud run services update --env-vars-file=... instead.
 */
console.error(
  'ERROR: robust_set_vars.js invoked the dead cloud_runtime CLI.\n' +
    'TNF now uses GCP Cloud Run. Example:\n' +
    '  gcloud run services update api-server \\\n' +
    '    --project=the-new-fuse-2025 --region=us-central1 \\\n' +
    '    --env-vars-file=env.yaml\n' +
    'Helper: scripts/lib/tnf-cloud-run.sh (tnf_cloud_run_update_env)\n' +
    'Deploy: scripts/deployment/gcp-deploy.sh'
);
process.exit(1);
