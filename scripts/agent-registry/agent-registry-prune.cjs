#!/usr/bin/env node
/**
 * Agent Registry Pruning Script
 * Deduplicates tnf:agent-registry and removes stale offline entries
 * 
 * This script:
 * 1. Identifies and archives offline agents older than 7 days
 * 2. Deduplicates agent types based on thresholds (BROKER-Green: max 3, DIRECTOR: max 2, etc.)
 * 3. Archives to tnf:agent-registry:archived with reason and timestamp
 * 
 * Usage: node scripts/agent-registry/agent-registry-prune.cjs [--dry-run]
 */

const redis = require('redis');

// Redis client setup.
//
// This pointed at 6380 (the docker-compose mapping) while the live TNF bus
// every agent actually registers on runs at 127.0.0.1:6379 — so this script
// has never pruned the registry it was written for; it connected to a port
// with nothing on it, found no agents, and reported success. Default to the
// live bus and let REDIS_URL override for a containerised run.
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

// Configuration from TNF_AGENT_ROSTER_CLEANUP.md
const CLEANUP_THRESHOLDS = {
  'BROKER-Green': 3,
  'DIRECTOR': 2,
  'antigravity': 3,
  'Project-Planner': 2,
  // Default for other types: 1 (no duplicates allowed)
};

const STALE_DAYS_THRESHOLD = 7; // Offline agents older than this get archived
const ARCHIVE_HASH = 'tnf:agent-registry:archived';
const ACTIVE_HASH = 'tnf:agent-registry';

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}

function parseISODate(dateString) {
  if (!dateString) return 0;
  try {
    // Handle ISO string with or without milliseconds
    const cleanDate = dateString.split('.')[0]; // Remove milliseconds if present
    return new Date(cleanDate).getTime();
  } catch (e) {
    return 0;
  }
}

function isStaleOfflineAgent(agentData) {
  const status = agentData.status;
  const lastSeen = agentData.lastSeen;
  
  if (status !== 'offline') return false;
  
  const lastSeenTime = parseISODate(lastSeen);
  if (lastSeenTime === 0) return false; // Invalid date, don't archive
  
  const now = Date.now();
  const ageDays = (now - lastSeenTime) / (1000 * 60 * 60 * 24);
  
  return ageDays > STALE_DAYS_THRESHOLD;
}

function getAgentType(agentData) {
  // Try to get agent type from name patterns
  const name = agentData.name || '';
  const category = agentData.category || '';
  
  // Check if name contains known types (exact matches first)
  for (const type of Object.keys(CLEANUP_THRESHOLDS)) {
    if (name === type || name.startsWith(type + '_') || name.endsWith('_'+type)) {
      return type;
    }
  }
  
  // Check if name contains the type as a substring
  for (const type of Object.keys(CLEANUP_THRESHOLDS)) {
    if (name.includes(type)) return type;
  }
  
  // Fallback to category if it's meaningful
  if (category && category !== 'unknown' && category !== '') {
    return category;
  }
  
  // Last resort: extract from name pattern like "agent_Type_123456"
  const nameMatch = name.match(/_([A-Z][a-z]+(?:-[A-Z][a-z]+)*)_/);
  if (nameMatch) {
    const potentialType = nameMatch[1];
    if (Object.keys(CLEANUP_THRESHOLDS).includes(potentialType)) {
      return potentialType;
    }
  }
  
  return 'unknown';
}

async function archiveAgent(agentKey, agentData, reason, dryRun = false) {
  if (dryRun) {
    console.log(`🔸 [DRY RUN] Would archive ${agentKey}: ${reason}`);
    return true;
  }
  
  try {
    const timestamp = new Date().toISOString();
    
    // Prepare archived data with metadata
    const archivedData = {
      ...agentData,
      archivedAt: timestamp,
      archiveReason: reason
    };
    
    // Store in archive hash
    await redisClient.hSet(ARCHIVE_HASH, agentKey, JSON.stringify(archivedData));
    
    // Remove from active registry
    await redisClient.hDel(ACTIVE_HASH, agentKey);
    
    console.log(`✅ Archived ${agentKey}: ${reason}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to archive ${agentKey}:`, error.message);
    return false;
  }
}

async function deduplicateByType(dryRun = false) {
  console.log('🔍 Starting deduplication process...');
  
  const allAgents = await redisClient.hGetAll(ACTIVE_HASH);
  const agentsByType = {};
  
  // Group agents by type
  for (const [key, value] of Object.entries(allAgents)) {
    try {
      const agentData = JSON.parse(value);
      const type = getAgentType(agentData);
      
      if (!agentsByType[type]) {
        agentsByType[type] = [];
      }
      agentsByType[type].push({ key, agentData });
    } catch (e) {
      console.warn(`⚠️  Could not parse agent data for key ${key}`);
    }
  }
  
  let archivedCount = 0;
  
  // Process each type
  for (const [type, agents] of Object.entries(agentsByType)) {
    const maxAllowed = CLEANUP_THRESHOLDS[type] || 1; // Default to 1 if not specified
    
    if (agents.length <= maxAllowed) {
      continue; // No need to deduplicate
    }
    
    console.log(`📊 Found ${agents.length} ${type} agents (max allowed: ${maxAllowed})`);
    
    // Sort by registeredAt (newest first) to keep the most recent
    const sortedAgents = agents.sort((a, b) => {
      const timeA = parseISODate(a.agentData.registeredAt) || 0;
      const timeB = parseISODate(b.agentData.registeredAt) || 0;
      return timeB - timeA; // Descending (newest first)
    });
    
    // Archive excess agents (keep first maxAllowed, archive the rest)
    const agentsToArchive = sortedAgents.slice(maxAllowed);
    
    for (const { key, agentData } of agentsToArchive) {
      const reason = `Duplicate ${type} (keeping ${maxAllowed} most recent)`;
      if (await archiveAgent(key, agentData, reason, dryRun)) {
        archivedCount++;
      }
    }
  }
  
  return archivedCount;
}

async function pruneStaleOffline(dryRun = false) {
  console.log('🔍 Starting stale offline agent pruning...');
  
  const allAgents = await redisClient.hGetAll(ACTIVE_HASH);
  let archivedCount = 0;
  
  for (const [key, value] of Object.entries(allAgents)) {
    try {
      const agentData = JSON.parse(value);
      
      if (isStaleOfflineAgent(agentData)) {
        const lastSeen = agentData.lastSeen || 'unknown';
        const name = agentData.name || key;
        const reason = `Offline for >${STALE_DAYS_THRESHOLD} days (last seen: ${lastSeen})`;
        
        if (await archiveAgent(key, agentData, reason, dryRun)) {
          archivedCount++;
        }
      }
    } catch (e) {
      console.warn(`⚠️  Could not parse agent data for key ${key}`);
    }
  }
  
  return archivedCount;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🚀 Starting TNF Agent Registry Pruning...');
  if (dryRun) console.log('🔸 DRY RUN MODE - No changes will be made');
  console.log('=' .repeat(50));
  
  let totalArchived = 0;
  
  try {
    await connectRedis();
    
    // Test Redis connection
    await redisClient.ping();
    console.log('✅ Connected to Redis');
    
    // Check if active registry exists
    const agentCount = Object.keys(await redisClient.hGetAll(ACTIVE_HASH)).length;
    console.log(`📊 Found ${agentCount} agents in active registry`);
    
    if (agentCount === 0) {
      console.log('⚠️  No agents found in registry');
      return;
    }
    
    // Phase 1: Prune stale offline agents
    const staleCount = await pruneStaleOffline(dryRun);
    totalArchived += staleCount;
    console.log(`📋 Phase 1 Complete: Archived ${staleCount} stale offline agents\n`);
    
    // Phase 2: Deduplicate agent types
    const duplicateCount = await deduplicateByType(dryRun);
    totalArchived += duplicateCount;
    console.log(`📋 Phase 2 Complete: Archived ${duplicateCount} duplicate agents\n`);
    
    // Final count (only if not dry run)
    if (!dryRun) {
      const finalAgentCount = Object.keys(await redisClient.hGetAll(ACTIVE_HASH)).length;
      console.log('=' .repeat(50));
      console.log('🎉 Pruning Complete!');
      console.log('📊 Summary:');
      console.log(`   - Agents archived: ${totalArchived}`);
      console.log(`   - Agents remaining: ${finalAgentCount}`);
      console.log(`   - Archive location: ${ARCHIVE_HASH}`);
    } else {
      console.log('=' .repeat(50));
      console.log('🔸 Dry run complete. To actually perform pruning, run without --dry-run');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during pruning:', error.message);
    process.exit(1);
  } finally {
    await disconnectRedis();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('💥 Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = {
  pruneStaleOffline,
  deduplicateByType,
  archiveAgent
};