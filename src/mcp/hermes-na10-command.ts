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

const HERMES_NA10_PROMPT_CONTENT =
  "Hey there, NA10 very recently released an MCP. I'm going to give you the credentials to connect to that NA10 MCP. And I want you to give me a command that I can run in the terminal that will allow me to give you the full connection/control.";

const HERMES_NA10_NOTES = [
  'Replace placeholder URL/token values at execution time; do not commit credentials.',
  'Route Hermes through `tnf hermes ...` so TNF remains the control plane.',
  'Regenerate Hermes MCP clients with `tnf mcp generate` after adding a persistent server.',
];

export function buildHermesNa10McpCommandPlan(
  options: HermesNa10CommandOptions = {}
): HermesNa10CommandPlan {
  const {
    serverName: mcpServerName = 'na10',
    configPath: mcpConfigPath = 'data/mcp.clients/hermes.mcp.json',
    urlEnv = 'NA10_MCP_URL',
    tokenEnv = 'NA10_MCP_TOKEN',
    hermesArgs = ['chat'],
  } = options;
  const prompt = HERMES_NA10_PROMPT_CONTENT;

  const MCP_CMD = 'mcp';
  const ADD_CMD = 'add';
  const TYPE_FLAG = '--type';
  const REMOTE_TYPE = 'remote';
  const COMMAND_FLAG = '--command';
  const NPX_CMD = 'npx';
  const ARGS_FLAG = '--args';
  const Y_FLAG = '-y';
  const MCP_REMOTE_CMD = 'mcp-remote';
  const ENV_FLAG = '--env';
  const TNF_CMD = 'tnf';
  const HERMES_CMD = 'hermes';

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

  const addServerEnvJson = JSON.stringify({
    [urlEnv]: `<${urlEnv}>`,
    [tokenEnv]: `<${tokenEnv}>`,
  });

  const addServerArgs = [
    MCP_CMD,
    ADD_CMD,
    mcpServerName,
    TYPE_FLAG,
    REMOTE_TYPE,
    COMMAND_FLAG,
    NPX_CMD,
    ARGS_FLAG,
    Y_FLAG,
    MCP_REMOTE_CMD,
    `\${${urlEnv}}`,
    ENV_FLAG,
    addServerEnvJson, // Pass the pre-stringified JSON
  ];

  const quotedAddServerArgs = addServerArgs.map(shellQuote).join(' ');
  const hermesCommandString = [TNF_CMD, HERMES_CMD, ...hermesArgs].map(shellQuote).join(' ');

  const addServerExec = `${TNF_CMD} ${quotedAddServerArgs}`;
  const hermesExec = [TNF_CMD, HERMES_CMD, ...hermesArgs].map(shellQuote).join(' ');

  const finalCommand = `${envPrefix} ${addServerExec} && ${envPrefix} ${hermesExec}`;
  const command = finalCommand;

  return {
    prompt,
    command,
    env,
    mcpServerName,
    mcpConfigPath,
    notes: HERMES_NA10_NOTES,
  };
}
