// YouTube MCP Server Configuration
// This file provides a flexible configuration system for the YouTube MCP server
// that works in both development and production environments.

import path from 'path';

export interface YouTubeMCPConfig {
  credentialsPath: string;
  tokenPath: string;
  scopes: string[];
  redirectUri: string;
  portRange: [number, number];
}

export const DEFAULT_CONFIG: YouTubeMCPConfig = {
  credentialsPath:
    process.env.YOUTUBE_CREDENTIALS_PATH || path.join(process.cwd(), 'client_secret.json'),
  tokenPath: process.env.YOUTUBE_TOKEN_PATH || path.join(process.cwd(), 'tokens.json'),
  scopes: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
  ],
  redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost',
  portRange: [3000, 3010],
};

export function validateConfig(config: YouTubeMCPConfig): void {
  if (!config.credentialsPath) {
    throw new Error('YouTube credentials path is required');
  }

  if (!config.tokenPath) {
    throw new Error('YouTube token path is required');
  }

  if (!config.scopes || config.scopes.length === 0) {
    throw new Error('YouTube scopes are required');
  }
}

export function getConfig(): YouTubeMCPConfig {
  const config: YouTubeMCPConfig = { ...DEFAULT_CONFIG };

  // Override with environment variables
  if (process.env.YOUTUBE_CREDENTIALS_PATH) {
    config.credentialsPath = process.env.YOUTUBE_CREDENTIALS_PATH;
  }

  if (process.env.YOUTUBE_TOKEN_PATH) {
    config.tokenPath = process.env.YOUTUBE_TOKEN_PATH;
  }

  if (process.env.YOUTUBE_REDIRECT_URI) {
    config.redirectUri = process.env.YOUTUBE_REDIRECT_URI;
  }

  if (process.env.YOUTUBE_SCOPES) {
    config.scopes = process.env.YOUTUBE_SCOPES.split(',').map((s) => s.trim());
  }

  validateConfig(config);
  return config;
}

// Helper function to find an available port
export async function findAvailablePort(range: [number, number]): Promise<number> {
  const { createServer } = await import('http');

  for (let port = range[0]; port <= range[1]; port++) {
    const server = createServer();
    try {
      await new Promise((resolve, reject) => {
        server.listen(port, () => resolve(undefined));
        server.on('error', reject);
      });
      server.close();
      return port;
    } catch {
      continue;
    }
  }

  throw new Error(`No available port found in range ${range[0]}-${range[1]}`);
}

// Helper function to check if file exists
export async function fileExists(filePath: string): Promise<boolean> {
  const fs = await import('fs').then((m) => m.promises);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper function to read JSON file
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const fs = await import('fs').then((m) => m.promises);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

// Helper function to write JSON file
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const fs = await import('fs').then((m) => m.promises);
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf8');
}
