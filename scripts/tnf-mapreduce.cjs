#!/usr/bin/env node

/**
 * TNF MapReduce Workflow Runner
 *
 * Port of MapReducePattern to terminal workflow execution.
 * Can run locally or distributed on the Redis agent coordination network.
 */

const fs = require('fs');
const path = require('path');

// Constants for CLI coloring
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const DEMO_INPUT = [
  "The New Fuse is a multi-agent AI orchestration platform.",
  "AI agents like Antigravity, Claude, and Gemini collaborate to solve tasks.",
  "Using Redis and WebSocket, the agent swarms coordinate and communicate.",
  "Self-synthesizing kernels powered by LLVM accelerate native execution.",
  "Attribution cornerstone dictates that human-attributed source knowledge legally overrules AI claims.",
  "Sovereignty of the individual is a holy concept in The New Fuse.",
  "Zero trust between agents ensures that all inputs and outputs are verified.",
  "Perpetual systems remain awake and active across dual terminal session structures."
];

const DEMO_MAP_FN = async (paragraphs, partition) => {
  const wordCounts = {};
  for (const text of paragraphs) {
    const words = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/);

    for (const word of words) {
      if (word.trim()) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
  }
  return { partition, wordCounts };
};

const DEMO_REDUCE_FN = async (mapResults) => {
  const globalCounts = {};
  for (const result of mapResults) {
    const counts = result.wordCounts;
    for (const [word, count] of Object.entries(counts)) {
      globalCounts[word] = (globalCounts[word] || 0) + count;
    }
  }
  // Sort by frequency descending
  const sorted = Object.entries(globalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    topWords: sorted.map(([word, count]) => ({ word, count })),
    totalUniqueWords: Object.keys(globalCounts).length
  };
};

function displayDemoResult(result) {
  console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║             MAP-REDUCE DEMO RESULTS               ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`Total Unique Words Processed: ${colors.green}${result.totalUniqueWords}${colors.reset}\n`);
  console.log(`${colors.bright}Top 10 Most Frequent Words:${colors.reset}`);
  console.log(`${colors.dim}-------------------------------------${colors.reset}`);
  console.log(`${colors.bright}Word                  | Count${colors.reset}`);
  console.log(`${colors.dim}-------------------------------------${colors.reset}`);
  for (const entry of result.topWords) {
    const paddedWord = entry.word.padEnd(21, ' ');
    console.log(`${colors.cyan}${paddedWord}${colors.reset} | ${entry.count}`);
  }
  console.log(`${colors.dim}-------------------------------------${colors.reset}\n`);
}

async function runLocalMapReduce(dataset, mapFn, reduceFn, concurrency) {
  console.log(`\n${colors.cyan}⚡ Running Map-Reduce locally (concurrency: ${concurrency})...${colors.reset}\n`);

  const partitions = Math.min(dataset.length, concurrency);
  const partitionSize = Math.ceil(dataset.length / partitions);
  const startTime = Date.now();

  console.log(`${colors.dim}Phase 1: Map Phase started (${partitions} partitions)${colors.reset}`);

  const mapPromises = [];
  for (let i = 0; i < partitions; i++) {
    const start = i * partitionSize;
    const end = Math.min(start + partitionSize, dataset.length);
    const partitionData = dataset.slice(start, end);

    console.log(`   └─ [Partition ${i}] Processing ${partitionData.length} items (indices ${start}-${end-1})...`);

    const promise = (async (idx, pData) => {
      try {
        const result = await mapFn(pData, idx);
        console.log(`   └─ [Partition ${idx}] ${colors.green}✓ Completed${colors.reset}`);
        return result;
      } catch (err) {
        console.error(`   └─ [Partition ${idx}] ${colors.red}✗ Failed: ${err.message}${colors.reset}`);
        throw err;
      }
    })(i, partitionData);
    mapPromises.push(promise);
  }

  const mapResults = await Promise.all(mapPromises);
  console.log(`\n${colors.green}✓ Phase 1 Complete (Map).${colors.reset} Execution time: ${Date.now() - startTime}ms`);

  console.log(`\n${colors.dim}Phase 2: Reduce Phase started...${colors.reset}`);
  const reduceStartTime = Date.now();
  const finalResult = await reduceFn(mapResults);
  console.log(`${colors.green}✓ Phase 2 Complete (Reduce).${colors.reset} Execution time: ${Date.now() - reduceStartTime}ms`);

  return finalResult;
}

async function runDistributedMapReduce(dataset, mapFn, reduceFn, concurrency, redisUrl) {
  console.log(`\n${colors.cyan}🌐 Initializing Distributed Map-Reduce on Redis...${colors.reset}`);
  console.log(`   Redis Endpoint: ${colors.dim}${redisUrl}${colors.reset}`);

  // Try to resolve coordination files from built packages
  const packagesDir = path.resolve(__dirname, '../packages');
  const coordinatorPath = path.join(packagesDir, 'agent-coordination/dist/orchestration/Coordinator.js');
  const mapReducePatternPath = path.join(packagesDir, 'agent-coordination/dist/patterns/MapReducePattern.js');

  if (!fs.existsSync(coordinatorPath) || !fs.existsSync(mapReducePatternPath)) {
    throw new Error("Agent-coordination package is not compiled. Please run 'pnpm run build' first.");
  }

  const { Coordinator } = require(coordinatorPath);
  const { MapReducePattern } = require(mapReducePatternPath);

  // Set up Coordinator and MapReducePattern
  const agentPoolConfig = {
    minAgents: 1,
    maxAgents: 10,
    heartbeatInterval: 3000,
    heartbeatTimeout: 9000
  };

  const coordinator = new Coordinator(redisUrl, agentPoolConfig);
  const mapReduce = new MapReducePattern(coordinator);

  // Debug event listeners
  coordinator.on('task:submitted', (task) => {
    console.log(`[DEBUG] Task submitted: ${task.id} (${task.type})`);
  });
  coordinator.on('task:assigned', (task, assignment) => {
    console.log(`[DEBUG] Task assigned: ${task.id} to agent ${assignment.agentId}`);
  });
  coordinator.on('task:started', (task, agentId) => {
    console.log(`[DEBUG] Task started: ${task.id} on agent ${agentId}`);
  });
  coordinator.on('task:completed', (task) => {
    console.log(`[DEBUG] Task completed: ${task.id}`);
  });
  coordinator.on('task:failed', (task, error) => {
    console.log(`[DEBUG] Task failed: ${task.id} - ${error?.message || error}`);
  });
  coordinator.agentPool.on('agent:registered', (agentInfo) => {
    console.log(`[DEBUG] Agent registered: ${agentInfo.id}`);
  });

  // Connect to Redis and start coordinator
  await coordinator.start();
  console.log(`${colors.green}✓ Coordinator started.${colors.reset}`);

  // Clear any existing jobs from previous runs to prevent infinite assignment loops
  console.log(`${colors.dim}Clearing stale tasks from queue...${colors.reset}`);
  for (const queue of coordinator.taskQueue.queues.values()) {
    await queue.empty();
  }

  // Register a worker in the pool to run tasks
  console.log(`${colors.dim}Registering worker agent in the coordinator pool...${colors.reset}`);
  const agent = coordinator.agentPool.registerAgent({
    id: `temp-mr-worker-${Date.now()}`,
    name: 'local-mapreduce-worker',
    type: 'worker',
    capabilities: [{ name: 'data-processing', version: '1.0' }],
    status: 'idle',
    currentLoad: 0,
    maxConcurrentTasks: concurrency,
    createdAt: new Date(),
    lastHeartbeat: new Date()
  });

  // Keep the worker agent heartbeat alive periodically
  const heartbeatInterval = setInterval(() => {
    coordinator.agentPool.heartbeat(agent.id);
  }, 1000);

  // Intercept when a task starts and run it locally via worker
  coordinator.on('task:started', async (task, agentId) => {
    if (agentId === agent.id) {
      try {
        const partitionData = task.payload.data;
        const partitionIndex = task.payload.partition;
        const result = await mapFn(partitionData, partitionIndex);

        // Report result back to coordinator
        const startTime = task.createdAt ? new Date(task.createdAt).getTime() : Date.now();
        await coordinator.reportTaskResult({
          taskId: task.id,
          success: true,
          result: result,
          executionTime: Date.now() - startTime,
          agentId: agent.id,
          timestamp: new Date()
        });

        // Store in the mapReduce pattern local results
        mapReduce.storeMapResult(task.id, result);
      } catch (err) {
        console.error(`${colors.red}✗ Worker error on task ${task.id}: ${err.message}${colors.reset}`);
        const startTime = task.createdAt ? new Date(task.createdAt).getTime() : Date.now();
        await coordinator.reportTaskResult({
          taskId: task.id,
          success: false,
          error: err,
          executionTime: Date.now() - startTime,
          agentId: agent.id,
          timestamp: new Date()
        });
      }
    }
  });

  // Support external workers as well
  coordinator.on('task:completed', (task) => {
    if (task.type === 'map') {
      const result = coordinator.taskResults.get(task.id)?.result;
      if (result) {
        mapReduce.storeMapResult(task.id, result);
      }
    }
  });
  // Diagnostic interval
  const diagInterval = setInterval(async () => {
    try {
      const agents = coordinator.agentPool.getAvailableAgents();
      console.log(`[DIAG] Available agents count: ${agents.length}`);
      if (agents.length > 0) {
        console.log(`[DIAG] Agent ID: ${agents[0].id}, Status: ${agents[0].status}, Load: ${agents[0].currentLoad}/${agents[0].maxConcurrentTasks}`);
      } else {
        const allAgents = coordinator.agentPool.getAllAgents();
        console.log(`[DIAG] Total registered agents: ${allAgents.length}`);
        if (allAgents.length > 0) {
          console.log(`[DIAG] Agent status: ${allAgents[0].status}`);
        }
      }
      const depth = await coordinator.taskQueue.getQueueDepth();
      console.log(`[DIAG] Task queue depth: ${depth}`);
    } catch (err) {
      console.error('[DIAG] Error:', err.message);
    }
  }, 2000);

  console.log(`${colors.cyan}⚡ Executing Map-Reduce pattern...${colors.reset}`);

  const startTime = Date.now();
  const finalResult = await mapReduce.execute(dataset, mapFn, reduceFn, { mapConcurrency: concurrency });

  console.log(`\n${colors.green}✓ Map-Reduce completed successfully!${colors.reset}`);
  console.log(`Execution time: ${Date.now() - startTime}ms`);

  // Cleanup
  console.log(`${colors.dim}Cleaning up Coordinator...${colors.reset}`);
  clearInterval(diagInterval);
  clearInterval(heartbeatInterval);
  await coordinator.stop();
  await coordinator.close();

  return finalResult;
}

function printUsage() {
  console.log(`
TNF MapReduce Workflow Runner

Usage:
  node scripts/tnf-mapreduce.cjs [options]

Options:
  -i, --input <path>          JSON file containing input data array
  -m, --map <script>          Path to JavaScript file exporting map function
  -r, --reduce <script>       Path to JavaScript file exporting reduce function
  -c, --concurrency <number>  Map concurrency level (default: 5)
  -d, --redis <url>           Redis URL for agent network (default: redis://localhost:6379)
  --no-local-fallback         Disable local fallback if Redis fails
  --demo                      Run a beautiful word-count demo workflow
  -h, --help                  Show this help menu
`);
}

async function main() {
  const args = process.argv.slice(2);

  let inputPath = null;
  let mapPath = null;
  let reducePath = null;
  let concurrency = 5;
  let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let localFallback = true;
  let runDemo = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--demo') {
      runDemo = true;
    } else if (arg === '--input' || arg === '-i') {
      inputPath = args[++i];
    } else if (arg === '--map' || arg === '-m') {
      mapPath = args[++i];
    } else if (arg === '--reduce' || arg === '-r') {
      reducePath = args[++i];
    } else if (arg === '--concurrency' || arg === '-c') {
      concurrency = parseInt(args[++i], 10);
    } else if (arg === '--redis' || arg === '-d') {
      redisUrl = args[++i];
    } else if (arg === '--no-local-fallback') {
      localFallback = false;
    }
  }

  let dataset = DEMO_INPUT;
  let mapFn = DEMO_MAP_FN;
  let reduceFn = DEMO_REDUCE_FN;
  let isDemo = runDemo || (!inputPath && !mapPath && !reducePath);

  if (!isDemo) {
    // Validate inputs
    if (!inputPath || !mapPath || !reducePath) {
      console.error(`${colors.red}Error: Missing required parameters: --input, --map, and --reduce must all be provided or run with --demo.${colors.reset}`);
      printUsage();
      process.exit(1);
    }

    try {
      const inputContent = fs.readFileSync(path.resolve(process.cwd(), inputPath), 'utf8');
      dataset = JSON.parse(inputContent);
      if (!Array.isArray(dataset)) {
        throw new Error("Input data must be a JSON array.");
      }
    } catch (err) {
      console.error(`${colors.red}Error loading input: ${err.message}${colors.reset}`);
      process.exit(1);
    }

    try {
      const mapModule = require(path.resolve(process.cwd(), mapPath));
      mapFn = typeof mapModule === 'function' ? mapModule : mapModule.map;
      if (typeof mapFn !== 'function') {
        throw new Error("Map script must export a function (e.g., module.exports = async (data, partition) => { ... })");
      }
    } catch (err) {
      console.error(`${colors.red}Error loading map script: ${err.message}${colors.reset}`);
      process.exit(1);
    }

    try {
      const reduceModule = require(path.resolve(process.cwd(), reducePath));
      reduceFn = typeof reduceModule === 'function' ? reduceModule : reduceModule.reduce;
      if (typeof reduceFn !== 'function') {
        throw new Error("Reduce script must export a function (e.g., module.exports = async (results) => { ... })");
      }
    } catch (err) {
      console.error(`${colors.red}Error loading reduce script: ${err.message}${colors.reset}`);
      process.exit(1);
    }
  }

  // Try running distributed if Redis is requested
  let runDistributed = false;
  try {
    const Redis = require('ioredis');
    const checkClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    await checkClient.ping();
    await checkClient.quit();
    runDistributed = true;
  } catch (err) {
    console.log(`${colors.yellow}⚠ Redis is offline or unreachable at ${redisUrl}.${colors.reset}`);
    if (!localFallback) {
      console.error(`${colors.red}Error: Local fallback is disabled. Exiting.${colors.reset}`);
      process.exit(1);
    }
  }

  try {
    let finalResult;
    if (runDistributed) {
      finalResult = await runDistributedMapReduce(dataset, mapFn, reduceFn, concurrency, redisUrl);
    } else {
      finalResult = await runLocalMapReduce(dataset, mapFn, reduceFn, concurrency);
    }

    if (isDemo) {
      displayDemoResult(finalResult);
    } else {
      console.log(`\n${colors.bright}Result:${colors.reset}`);
      console.log(JSON.stringify(finalResult, null, 2));
    }
  } catch (err) {
    console.error(`\n${colors.red}✗ Workflow execution failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
