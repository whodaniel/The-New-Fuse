#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY_PATH = path.join(ROOT, 'data/product/personal-data-location-policy.json');
const REGISTRY_DOC = path.join(ROOT, 'docs/product/TNF_PERSONAL_DATA_LOCATION_REGISTRY.md');
const MEMBER_STORAGE_DOC = path.join(ROOT, 'docs/product/TNF_MEMBER_DATA_STORAGE_BOUNDARY.md');
const PRODUCT_BOUNDARY_DOC = path.join(ROOT, 'docs/product/TNF_PRODUCT_BOUNDARY.md');
const SUPABASE_DOC = path.join(ROOT, 'docs/integrations/supabase.md');
const README_DOC = path.join(ROOT, 'README.md');
const SCHEMA_PATH = path.join(ROOT, 'packages/database/src/drizzle/schema/personal-data-locations.ts');
const SCHEMA_INDEX_PATH = path.join(ROOT, 'packages/database/src/drizzle/schema/index.ts');
const MIGRATION_PATH = path.join(
  ROOT,
  'packages/database/migrations/20260813000100_add_user_data_locations.sql'
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fail(message) {
  console.error(`[personal-data-location-policy] FAIL ${message}`);
  process.exitCode = 1;
}

function requireIncludes(content, needle, label) {
  if (!content.includes(needle)) {
    fail(`${label} missing ${needle}`);
  }
}

function compactWhitespace(content) {
  return content.replace(/\s+/g, ' ');
}

const policy = JSON.parse(read(POLICY_PATH));
const registryDoc = read(REGISTRY_DOC);
const memberStorageDoc = read(MEMBER_STORAGE_DOC);
const productBoundaryDoc = read(PRODUCT_BOUNDARY_DOC);
const supabaseDoc = read(SUPABASE_DOC);
const readmeDoc = read(README_DOC);
const compactRegistryDoc = compactWhitespace(registryDoc);
const compactSupabaseDoc = compactWhitespace(supabaseDoc);
const schema = read(SCHEMA_PATH);
const schemaIndex = read(SCHEMA_INDEX_PATH);
const migration = read(MIGRATION_PATH);

if (policy.defaultPreferredProvider !== 'google_drive') {
  fail('defaultPreferredProvider must remain google_drive unless product strategy changes');
}

for (const provider of [
  'google_drive',
  'dropbox',
  'box',
  'onedrive',
  'customer_s3_or_r2',
  'private_github_repo',
  'local_device_reference',
  'other_url',
]) {
  if (!policy.allowedProviders?.includes(provider)) {
    fail(`allowedProviders missing ${provider}`);
  }
  requireIncludes(schema, provider, 'schema provider enum');
  requireIncludes(migration, provider, 'migration provider enum');
}

for (const forbidden of [
  'oauth_access_token',
  'oauth_refresh_token',
  'raw_file_bytes',
  'raw_file_content',
  'entire_drive_mirror',
]) {
  if (!policy.forbiddenRegistryFields?.includes(forbidden)) {
    fail(`forbiddenRegistryFields missing ${forbidden}`);
  }
}

for (const unsafeField of [
  'oauthAccessToken',
  'oauthRefreshToken',
  'accessToken',
  'refreshToken',
  'rawFileBytes',
  'rawFileContent',
  'fileBytes',
  'fileContent',
  'driveMirror',
]) {
  if (schema.includes(unsafeField)) {
    fail(`schema must not include unsafe registry field ${unsafeField}`);
  }
}

requireIncludes(registryDoc, 'data/product/personal-data-location-policy.json', 'registry doc');
requireIncludes(registryDoc, 'user_data_locations', 'registry doc');
requireIncludes(compactRegistryDoc, 'OAuth tokens', 'registry doc');
requireIncludes(
  compactRegistryDoc,
  'Google Drive is the default preferred provider',
  'registry doc'
);

requireIncludes(memberStorageDoc, 'TNF_PERSONAL_DATA_LOCATION_REGISTRY.md', 'member storage doc');
requireIncludes(productBoundaryDoc, 'TNF_PERSONAL_DATA_LOCATION_REGISTRY.md', 'product boundary doc');
requireIncludes(readmeDoc, 'TNF_PERSONAL_DATA_LOCATION_REGISTRY.md', 'README');
requireIncludes(supabaseDoc, 'user_data_locations', 'Supabase doc');
requireIncludes(compactSupabaseDoc, 'OAuth access tokens', 'Supabase doc');

requireIncludes(schema, "pgTable(\n  'user_data_locations'", 'schema');
requireIncludes(schema, 'oauthSecretRef', 'schema');
requireIncludes(schema, 'lastVerifiedAt', 'schema');
requireIncludes(schema, 'hashAndProvenanceMetadata', 'schema');
requireIncludes(schemaIndex, "export * from './personal-data-locations.js';", 'schema index');

requireIncludes(migration, 'CREATE TABLE IF NOT EXISTS "user_data_locations"', 'migration');
requireIncludes(migration, '"oauth_secret_ref" varchar(255)', 'migration');
requireIncludes(migration, 'raw file contents', 'migration safety comment');

if (process.exitCode) process.exit(process.exitCode);

console.log('[personal-data-location-policy] OK');
console.log(`providers=${policy.allowedProviders.join(',')}`);
console.log(`defaultPreferredProvider=${policy.defaultPreferredProvider}`);
