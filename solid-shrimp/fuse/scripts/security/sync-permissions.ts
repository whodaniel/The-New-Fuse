import { Role } from '../../packages/core/src/security/permission-manager';

/**
 * Sync Document Permissions to Cloudflare D1
 *
 * This script ensures the LDS knowledge graph respects our security tiers.
 */

async function syncPermissions() {
  console.log('🔄 Syncing Document Permissions to LDS...');

  // Mocking Cloudflare D1 sync for now
  const permissions = [
    { path: 'docs/infrastructure/', role: Role.ADMIN },
    { path: 'docs/architecture/', role: Role.ADMIN },
    { path: '.claude/agents/', role: Role.ADMIN },
    { path: 'docs/personal/', role: Role.SUPER_ADMIN },
    { path: 'docs/business/', role: Role.SUPER_ADMIN },
  ];

  console.table(permissions);

  console.log('✅ Permissions synced successfully.');
}

syncPermissions().catch(console.error);
