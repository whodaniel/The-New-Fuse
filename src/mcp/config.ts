export const DEFAULT_SERVER_NAME = 'tnf-main';
export const DEFAULT_SERVER_VERSION = '1.0.0';

export function getTnfServerConfig(serverType: string) {
  let nameEnvVar: string;
  let versionEnvVar: string;
  let defaultName: string;

  switch (serverType) {
    case 'main':
      nameEnvVar = process.env.MCP_MAIN_SERVER_NAME || '';
      versionEnvVar = process.env.MCP_MAIN_SERVER_VERSION || '';
      defaultName = 'tnf-main';
      break;
    case 'complete-api':
      nameEnvVar = process.env.MCP_COMPLETE_API_SERVER_NAME || '';
      versionEnvVar = process.env.MCP_COMPLETE_API_SERVER_VERSION || '';
      defaultName = 'tnf-complete-api-wrapper';
      break;
    case 'enhanced-tnf':
      nameEnvVar = process.env.MCP_ENHANCED_TNF_SERVER_NAME || '';
      versionEnvVar = process.env.MCP_ENHANCED_TNF_SERVER_VERSION || '';
      defaultName = 'tnf-enhanced-mcp-server';
      break;
    default:
      throw new Error(`Unknown server type: ${serverType}`);
  }

  const name = nameEnvVar || defaultName;
  const version = versionEnvVar || DEFAULT_SERVER_VERSION;

  return { name, version };
}
