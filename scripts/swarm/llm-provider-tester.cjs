#!/usr/bin/env node

/**
 * LLM Provider Tester Agent
 * 
 * Continuously tests known LLM API sources (free, cheap, top tier).
 * Prioritizes best quality for the best price, avoiding hard-coded
 * single options and preventing API rate-limit gridlock.
 */

const fs = require('fs');
const path = require('path');
const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');

const ROOT_DIR = path.resolve(__dirname, '../..');
const STATUS_FILE = path.join(ROOT_DIR, 'data/llm-provider-status.json');

function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#') && line.includes('=')) {
        const [key, ...rest] = line.split('=');
        const val = rest.join('=').replace(/^["']|["']$/g, '').trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

const PROVIDERS = [
  { id: 'ollama', name: 'Local Ollama', tier: 'free', type: 'local', testUrl: 'http://localhost:11434/api/tags' },
  { id: 'gemini', name: 'Google Gemini', tier: 'free', type: 'cloud', envKey: 'GEMINI_API_KEY', testUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', defaultModel: 'gemini-pro' },
  { id: 'groq', name: 'Groq', tier: 'free', type: 'cloud', envKey: 'GROQ_API_KEY', testUrl: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama3-8b-8192' },
  { id: 'openrouter', name: 'OpenRouter (Free Tier)', tier: 'free', type: 'cloud', envKey: 'OPENROUTER_API_KEY', testUrl: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: 'openrouter/auto' },
  { id: 'sambanova', name: 'SambaNova', tier: 'free', type: 'cloud', envKey: 'SAMBANOVA_API_KEY', testUrl: 'https://api.sambanova.ai/v1/chat/completions', defaultModel: 'Meta-Llama-3.1-8B-Instruct' },
  { id: 'moonshot', name: 'Moonshot', tier: 'cheap', type: 'cloud', envKey: 'MOONSHOT_API_KEY', testUrl: 'https://api.moonshot.cn/v1/chat/completions', defaultModel: 'moonshot-v1-8k' },
  { id: 'deepseek', name: 'DeepSeek', tier: 'cheap', type: 'cloud', envKey: 'DEEPSEEK_API_KEY', testUrl: 'https://api.deepseek.com/v1/chat/completions', defaultModel: 'deepseek-chat' },
  { id: 'openai', name: 'OpenAI', tier: 'premium', type: 'cloud', envKey: 'OPENAI_API_KEY', testUrl: 'https://api.openai.com/v1/models', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic Claude', tier: 'premium', type: 'cloud', envKey: 'ANTHROPIC_API_KEY', testUrl: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-3-haiku-20240307' }
];

async function testProvider(provider) {
  if (provider.type === 'local') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(provider.testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  const key = process.env[provider.envKey];
  if (!key) return false;

  const model = process.env[`${provider.id.toUpperCase()}_MODEL`] || provider.defaultModel;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    let res;
    if (provider.id === 'openai') {
      res = await fetch(provider.testUrl, { headers: { Authorization: `Bearer ${key}` }, signal: controller.signal });
    } else if (provider.id === 'anthropic') {
      res = await fetch(provider.testUrl, { 
        method: 'POST', 
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: model, messages: [{role: 'user', content: 'hi'}], max_tokens: 10 }),
        signal: controller.signal
      });
    } else if (provider.id === 'gemini') {
      res = await fetch(`${provider.testUrl}?key=${key}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }),
        signal: controller.signal
      });
    } else {
      // standard openai-compatible providers
      res = await fetch(provider.testUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: model, messages: [{role: 'user', content: 'hi'}] }),
        signal: controller.signal
      });
    }
    
    clearTimeout(timeoutId);
    
    // 401/403 means bad key. 429 means rate limited.
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

async function runTestCycle() {
  console.log('🔍 [LLM-Tester] Initiating API Provider Health Check...');
  loadEnv();

  const results = [];
  for (const p of PROVIDERS) {
    const isAlive = await testProvider(p);
    results.push({ ...p, active: isAlive });
    console.log(`   ${isAlive ? '✅' : '❌'} ${p.name} (${p.tier})`);
  }

  // Prioritize: Free > Cheap > Premium
  const activeProviders = results.filter(r => r.active);
  activeProviders.sort((a, b) => {
    const ranks = { 'free': 1, 'cheap': 2, 'premium': 3 };
    return ranks[a.tier] - ranks[b.tier];
  });

  const bestAvailable = activeProviders.length > 0 ? activeProviders[0] : null;
  
  // Allocate different providers to different roles to prevent quota blowout
  const allocations = {
    orchestrator: activeProviders[0] || null,
    worker: activeProviders[1] || activeProviders[0] || null,
    reviewer: activeProviders[2] || activeProviders[1] || activeProviders[0] || null,
    subagent: activeProviders.find(p => p.tier === 'free' || p.tier === 'cheap') || activeProviders[0] || null
  };
  
  const status = {
    lastChecked: new Date().toISOString(),
    bestAvailable,
    allocations,
    fallbackChain: activeProviders,
    all: results
  };

  fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));

  console.log(`\n🏆 [LLM-Tester] Provider Allocations (Quota Distribution):`);
  console.log(`   Orchestrator : ${allocations.orchestrator ? allocations.orchestrator.name : 'NONE'}`);
  console.log(`   Worker       : ${allocations.worker ? allocations.worker.name : 'NONE'}`);
  console.log(`   Reviewer     : ${allocations.reviewer ? allocations.reviewer.name : 'NONE'}`);
  console.log(`   Subagent     : ${allocations.subagent ? allocations.subagent.name : 'NONE'}`);

  return status;
}

async function startAgent() {
  const client = new RedisAgentClient();
  try {
    await client.initialize();
    await client.register('LLM-Provider-Tester', 'coordinator', 'testing', ['llm-routing', 'api-health']);
    
    console.log('🤖 LLM Provider Tester Agent registered. Running continuous health checks...');
    
    // Initial cycle
    let status = await runTestCycle();
    await client.publisher.publish('tnf:bus:ingress', JSON.stringify({
        type: 'event',
        from: { agentId: 'LLM-Provider-Tester' },
        payload: { event: 'llm_health_updated', activeProvider: status.bestAvailable?.id }
    }));

    // Re-check every 15 minutes
    setInterval(async () => {
      status = await runTestCycle();
      await client.publisher.publish('tnf:bus:ingress', JSON.stringify({
          type: 'event',
          from: { agentId: 'LLM-Provider-Tester' },
          payload: { event: 'llm_health_updated', activeProvider: status.bestAvailable?.id }
      }));
    }, 15 * 60 * 1000);

  } catch (err) {
    console.error('❌ Failed to start LLM-Tester Agent:', err.message);
    // Still run the cycle once to write the file, even if Redis is down
    await runTestCycle();
  }
}

if (require.main === module) {
  startAgent();
}
