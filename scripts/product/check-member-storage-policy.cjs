#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY_PATH = path.join(ROOT, 'data/product/member-storage-policy.json');
const BOUNDARY_DOC = path.join(ROOT, 'docs/product/TNF_MEMBER_DATA_STORAGE_BOUNDARY.md');
const PRODUCT_BOUNDARY_DOC = path.join(ROOT, 'docs/product/TNF_PRODUCT_BOUNDARY.md');
const SUPABASE_DOC = path.join(ROOT, 'docs/integrations/supabase.md');
const MULTI_TENANT_DOC = path.join(ROOT, 'docs/architecture/MULTI_TENANT_ACCOUNTS.md');
const BACKEND_POLICY = path.join(ROOT, 'apps/backend/src/modules/files/storage-policy.ts');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fail(message) {
  console.error(`[member-storage-policy] FAIL ${message}`);
  process.exitCode = 1;
}

const policy = JSON.parse(read(POLICY_PATH));
const boundaryDoc = read(BOUNDARY_DOC);
const productBoundaryDoc = read(PRODUCT_BOUNDARY_DOC);
const supabaseDoc = read(SUPABASE_DOC);
const multiTenantDoc = read(MULTI_TENANT_DOC);
const backendPolicy = read(BACKEND_POLICY);

if (policy.directUploadMaxBytes !== 10 * 1024 * 1024) {
  fail('directUploadMaxBytes must remain 10 MB until storage economics are redesigned');
}

for (const required of ['member_cloud_drive', 'raw_media_libraries', 'large_documents_or_archives']) {
  if (!policy.supabaseBoundary?.forbidden?.includes(required)) {
    fail(`supabaseBoundary.forbidden missing ${required}`);
  }
}

for (const tier of ['STARTER', 'PRO', 'ENTERPRISE']) {
  if (!policy.tiers?.[tier]) fail(`missing tier policy for ${tier}`);
}

if (!boundaryDoc.includes('data/product/member-storage-policy.json')) {
  fail('member storage boundary doc must link the machine-readable policy');
}

if (!productBoundaryDoc.includes('TNF_MEMBER_DATA_STORAGE_BOUNDARY.md')) {
  fail('product boundary doc must link member storage boundary');
}

if (!supabaseDoc.includes('not a member cloud drive')) {
  fail('Supabase integration doc must state the member cloud-drive boundary');
}

if (/Storage\s+\|\s+∞/.test(multiTenantDoc)) {
  fail('multi-tenant account doc must not promise infinite hosted storage');
}

if (!backendPolicy.includes(String(policy.directUploadMaxBytes))) {
  fail('backend storage-policy.ts must use the policy directUploadMaxBytes value');
}

if (process.exitCode) process.exit(process.exitCode);

console.log('[member-storage-policy] OK');
console.log(`directUploadMaxBytes=${policy.directUploadMaxBytes}`);
console.log(`tiers=${Object.keys(policy.tiers || {}).join(',')}`);
