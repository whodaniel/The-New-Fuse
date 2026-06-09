export interface HermesNa10CommandOptions {
  serverName?: string;
  configPath?: string;
  urlEnv?: string;
  tokenEnv?: string;
  hermesArgs?: string[];
}

export interface HermesNa10CommandPlan {
  prompt: string;
  command: string;
  env: Record<string, string>;
  mcpServerName: string;
  mcpConfigPath: string;
  notes: string[];
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@${}-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildHermesNa10McpCommandPlan(
  options: HermesNa10CommandOptions = {}
): HermesNa10CommandPlan {
  const mcpServerName = options.serverName || 'na10';
  const mcpConfigPath = options.configPath || 'data/mcp.clients/hermes.mcp.json';
  const urlEnv = options.urlEnv || 'NA10_MCP_URL';
  const tokenEnv = options.tokenEnv || 'NA10_MCP_TOKEN';
  const hermesArgs = options.hermesArgs?.length ? options.hermesArgs : ['chat'];
  const prompt =
    "Hey there, NA10 very recently released an MCP. I'm going to give you the credentials to connect to that NA10 MCP. And I want you to give me a command that I can run in the terminal that will allow me to give you the full connection/control.";

  const env = {
    [urlEnv]: '<na10-mcp-url>',
    [tokenEnv]: '<na10-mcp-token>',
    TNF_MCP_CONFIG_PATH: mcpConfigPath,
    MCP_CONFIG_PATH: mcpConfigPath,
    TNF_NA10_MCP_NAME: mcpServerName,
    HERMES_SYSTEM_PROMPT: prompt,
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
  const command = `${envPrefix} tnf ${addServerArgs.map(shellQuote).join(' ')} && ${envPrefix} ${hermesCommand}`;

  return {
    prompt,
    command,
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
