#!/usr/bin/env node
const DEFAULT_PROMPT =
  "Hey there, NA10 very recently released an MCP. I'm going to give you the credentials to connect to that NA10 MCP. And I want you to give me a command that I can run in the terminal that will allow me to give you the full connection/control.";

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:=@${}-]+$/.test(value)) return value;
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildPlan(options = {}) {
  const mcpServerName = options.serverName || 'na10';
  const mcpConfigPath = options.configPath || 'data/mcp.clients/hermes.mcp.json';
  const urlEnv = options.urlEnv || 'NA10_MCP_URL';
  const tokenEnv = options.tokenEnv || 'NA10_MCP_TOKEN';
  const hermesArgs = options.hermesArgs && options.hermesArgs.length ? options.hermesArgs : ['chat'];
  const env = {
    [urlEnv]: '<na10-mcp-url>',
    [tokenEnv]: '<na10-mcp-token>',
    TNF_MCP_CONFIG_PATH: mcpConfigPath,
    MCP_CONFIG_PATH: mcpConfigPath,
    TNF_NA10_MCP_NAME: mcpServerName,
    HERMES_SYSTEM_PROMPT: DEFAULT_PROMPT,
  };
  const envPrefix = Object.entries(env)
    .map(([key, value]) => `${key}=${shellQuote(value)}`)
    .join(' ');
  const addServerArgs = [
    'mcp',
    'add',
    mcpServerName,
    '--type',
    'remote',
    '--command',
    'npx',
    '--args',
    '-y',
    'mcp-remote',
    `\${${urlEnv}}`,
    '--env',
    JSON.stringify({ [urlEnv]: `<${urlEnv}>`, [tokenEnv]: `<${tokenEnv}>` }),
  ];
  const hermesCommand = ['tnf', 'hermes', ...hermesArgs].map(shellQuote).join(' ');
  return {
    prompt: DEFAULT_PROMPT,
    command: `${envPrefix} tnf ${addServerArgs.map(shellQuote).join(' ')} && ${envPrefix} ${hermesCommand}`,
    env,
    mcpServerName,
    mcpConfigPath,
    notes: [
      'Replace placeholder URL/token values at execution time; do not commit credentials.',
      'Route Hermes through `tnf hermes ...` so TNF remains the control plane.',
      'Regenerate Hermes MCP clients with `tnf mcp generate` after adding a persistent server.',
    ],
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--server-name') options.serverName = argv[++index];
    else if (arg === '--config-path') options.configPath = argv[++index];
    else if (arg === '--url-env') options.urlEnv = argv[++index];
    else if (arg === '--token-env') options.tokenEnv = argv[++index];
    else if (arg === '--hermes-arg') {
      options.hermesArgs = options.hermesArgs || [];
      options.hermesArgs.push(argv[++index]);
    }
  }
  return options;
}

const plan = buildPlan(parseArgs(process.argv.slice(2)));
console.log(JSON.stringify(plan, null, 2));
