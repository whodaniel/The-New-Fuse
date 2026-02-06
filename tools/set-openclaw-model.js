#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const DEFAULT_MODEL = 'zai/glm-4.7';

function resolveConfigPath(argPath) {
  if (argPath && argPath.trim()) {
    return path.resolve(argPath.trim());
  }
  if (process.env.OPENCLAW_CONFIG_PATH) {
    return path.resolve(process.env.OPENCLAW_CONFIG_PATH);
  }
  return path.join(os.homedir(), '.openclaw', 'openclaw.json');
}

function ensureObject(target, key) {
  if (!target[key] || typeof target[key] !== 'object') {
    target[key] = {};
  }
  return target[key];
}

async function run() {
  const configPath = resolveConfigPath(process.argv[2]);
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(raw);

    const agents = ensureObject(config, 'agents');
    const defaults = ensureObject(agents, 'defaults');

    const currentModel = defaults.model;
    if (typeof currentModel === 'string') {
      defaults.model = { primary: DEFAULT_MODEL };
    } else {
      defaults.model = { ...(currentModel ?? {}), primary: DEFAULT_MODEL };
    }

    const models = ensureObject(defaults, 'models');
    if (!Object.prototype.hasOwnProperty.call(models, DEFAULT_MODEL)) {
      models[DEFAULT_MODEL] = {};
    }

    // Keep metadata tidy
    if (Object.keys(models).length > 0) {
      defaults.models = models;
    }
    agents.defaults = defaults;
    config.agents = agents;

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    console.log(`Updated ${configPath}: set OpenClaw primary model to ${DEFAULT_MODEL}`);
  } catch (error) {
    console.error('Failed to update OpenClaw config:', error.message);
    process.exit(1);
  }
}

run();
