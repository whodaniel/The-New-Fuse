#!/usr/bin/env node
/**
 * This script fixes specific files based on the error output
 */

const fs = require('fs');
const path = require('path');

// Create backup directory
const BACKUP_DIR = path.join(process.cwd(), 'backups', `file_fixes_${new Date().toISOString().replace(/:/g, '-')}`);
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Files with known issues from the error output
const problematicFiles = [
  'packages/api-client/src/integrations/twitter.ts',
  'packages/api-client/src/integrations/n8n.ts',
  'packages/api-client/src/integrations/ai/stability-ai.ts',
  'packages/api-client/src/integrations/ai/anthropic.ts',
  'packages/api-client/src/integrations/ai/huggingface.ts',
  'packages/api-client/src/integrations/ai/openai.ts',
  'packages/api-client/src/integrations/ai/stability.ts',
  'packages/api-client/src/integrations/registry.ts',
  'packages/api-client/src/integrations/automation/make.ts',
  'packages/api-client/src/integrations/automation/zapier.ts',
  'packages/api-client/src/integrations/automation/pabbly.ts',
  'packages/api-client/src/integrations/zapier.ts',
  'packages/api-client/src/client/ApiClient.ts',
  'packages/api-client/src/services/BaseService.ts',
  'packages/api-client/src/services/auth.service.ts',
  'packages/api-client/src/services/AgentService.ts',
  'packages/api-client/src/services/agent.service.ts',
  'packages/api-client/src/services/user.service.ts',
  'packages/api-client/src/services/UserService.ts',
  'packages/api-client/src/services/workflow.service.ts',
  'packages/api-client/src/services/WorkflowService.ts',
  'packages/hooks/src/mocks/api-client.ts',
  'packages/hooks/src/types/index.ts',
  'packages/hooks/src/api/useAgents.ts',
  'packages/hooks/src/api/useAuth.ts',
  'packages/hooks/src/api/useWorkflows.ts',
  'packages/db/src/services/redis.service.tsx',
  'packages/db/src/services/redis.service.ts',
  'packages/api/src/utils/response.util.ts',
  'packages/api/src/utils/logger.ts',
  'packages/api/src/utils/index.ts',
  'packages/api/src/utils/error.ts',
  'packages/api/src/mcp/services/mcp-broker.service.ts',
  'packages/api/src/modules/repositories/agent.repository.ts',
  'packages/api/src/modules/mcp/mcp-registry.server.ts',
  'packages/api/src/modules/mcp/mcp-registry.service.ts',
  'packages/api/src/modules/controllers/agent.controller.ts',
  'packages/api/src/modules/controllers/workflow.controller.ts',
  'packages/api/src/modules/controllers/base.controller.ts',
  'packages/api/src/modules/services/agent.service.ts',
  'packages/api/src/modules/services/workflow.service.ts',
  'packages/api/src/modules/services/base.service.ts',
  'packages/api/src/modules/entities/entity.service.ts',
  'packages/api/src/modules/entities/entity.controller.ts',
  'packages/api/src/services/event.service.ts',
  'packages/api/src/services/agent.service.ts',
  'packages/api/src/services/health.service.ts',
  'packages/api/src/services/base.service.ts',
  'packages/api/src/services/index.ts',
  'packages/communication/src/websocket/WebSocketService.tsx',
  'packages/monitoring/src/error-tracking.service.tsx',
  'packages/monitoring/src/monitoring.service.tsx',
  'packages/monitoring/src/alerts/alert.service.tsx',
  'packages/monitoring/src/security-logging.service.tsx',
  'packages/monitoring/src/MonitoringService.tsx',
  'packages/monitoring/src/performance-monitoring.service.tsx',
  'packages/monitoring/src/dashboards/monitoring-dashboard.service.tsx',
  'packages/monitoring/src/MetricsCollector.tsx'
];

// Fix patterns
const fixPatterns = [
  // Fix spaces after colon in parameter definitions
  { pattern: /(\w+):((?!\s)[^,\)\s]+)/g, replacement: '$1: $2' },
  
  // Fix malformed Promise<void> declarations
  { pattern: /(Promise<void>\s*){2,}/g, replacement: 'Promise<void>' },
  
  // Fix malformed Promise return types
  { pattern: /:\s*Promise<([^>]+)>\s*{([^:]+):/g, replacement: ': Promise<$1> ($2:' },
  
  // Fix return types with missing space after colon
  { pattern: /\):(Promise<[^>]+>)/g, replacement: '): $1' },
  
  // Fix malformed parameter lists with missing spaces after commas
  { pattern: /,(\w+):/g, replacement: ', $1:' },
  
  // Fix malformed if/switch/for/while statements
  { pattern: /if\(([^)]+)\)/g, replacement: 'if ($1)' },
  { pattern: /switch\(([^)]+)\)/g, replacement: 'switch ($1)' },
  { pattern: /for\(([^)]+)\)/g, replacement: 'for ($1)' },
  { pattern: /while\(([^)]+)\)/g, replacement: 'while ($1)' },
  
  // Fix malformed catch statements
  { pattern: /catch\(([^)]+)\)/g, replacement: 'catch ($1)' },
  
  // Fix method calls with parentheses in wrong position
  { pattern: /(\w+)\.(\w+)\.\(([^)]+)\)/g, replacement: '$1.$2($3)' }
];

/**
 * Fix a specific file
 */
function fixFile(filePath) {
  // Check if file exists
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${fullPath}`);
    return false;
  }
  
  console.log(`Processing: ${fullPath}`);
  
  try {
    // Create backup
    const backupPath = path.join(BACKUP_DIR, filePath);
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Read file content
    const content = fs.readFileSync(fullPath, 'utf8');
    fs.writeFileSync(backupPath, content);
    
    // Apply fixes
    let modifiedContent = content;
    let hasChanges = false;
    
    for (const { pattern, replacement } of fixPatterns) {
      const newContent = modifiedContent.replace(pattern, replacement);
      if (newContent !== modifiedContent) {
        modifiedContent = newContent;
        hasChanges = true;
      }
    }
    
    // Write changes
    if (hasChanges) {
      fs.writeFileSync(fullPath, modifiedContent);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log(`🔍 Starting to fix ${problematicFiles.length} files...`);
  
  let fixedCount = 0;
  for (const file of problematicFiles) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Done! Fixed ${fixedCount} out of ${problematicFiles.length} files`);
  console.log(`📁 Backups saved to: ${BACKUP_DIR}`);
}

main();
