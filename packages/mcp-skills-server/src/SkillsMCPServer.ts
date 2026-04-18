/**
 * Skills MCP Server
 * Exposes The New Fuse skills library via Model Context Protocol
 * Enables agents to discover and load skills dynamically
 */

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';

interface SkillMetadata {
  name: string;
  path: string;
  description: string;
  type: 'meta-skill' | 'skill' | 'context';
  category?: string;
  dependencies?: string[];
  scripts?: string[];
}

/**
 * Skills MCP Server
 * Provides MCP interface to The New Fuse skills ecosystem
 */
export class SkillsMCPServer {
  private server: Server;
  private skillsBasePath: string;
  private skillsCache: Map<string, SkillMetadata> = new Map();

  constructor(skillsBasePath?: string) {
    // Default to .agent directory at project root
    this.skillsBasePath = skillsBasePath || path.join(process.cwd(), '.agent');

    this.server = new Server(
      {
        name: 'tnf-skills-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          prompts: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Initialize server and scan skills
   */
  async initialize(): Promise<void> {
    await this.scanSkills();
    console.error('[Skills MCP] Initialized with', this.skillsCache.size, 'skills');
  }

  /**
   * Scan .agent directory for skills
   */
  private async scanSkills(): Promise<void> {
    try {
      // Find all SKILL.md files
      const skillFiles = await glob('**/{SKILL.md,*.md}', {
        cwd: this.skillsBasePath,
        absolute: true,
      });

      for (const skillFile of skillFiles) {
        const metadata = await this.parseSkillFile(skillFile);
        if (metadata) {
          this.skillsCache.set(metadata.name, metadata);
        }
      }
    } catch (error) {
      console.error('[Skills MCP] Error scanning skills:', error);
    }
  }

  /**
   * Parse a skill file to extract metadata
   */
  private async parseSkillFile(filePath: string): Promise<SkillMetadata | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(this.skillsBasePath, filePath);

      // Extract name from path (skills/skill-builder/SKILL.md -> skill-builder)
      const pathParts = relativePath.split(path.sep);
      let name = pathParts[pathParts.length - 2] || path.basename(filePath, '.md');

      // For context files, use filename
      if (filePath.includes('/context/')) {
        name = path.basename(filePath, '.md');
      }

      // Determine type based on content and location
      let type: 'meta-skill' | 'skill' | 'context' = 'skill';
      if (filePath.includes('/context/')) {
        type = 'context';
      } else if (
        content.includes('Meta-Skill') ||
        name === 'skill-builder' ||
        name === 'library-of-living-knowledge'
      ) {
        type = 'meta-skill';
      }

      // Extract description from first heading or first paragraph
      const descMatch = content.match(/^#\s+(.+)$/m) || content.match(/^(.+)$/m);
      const description = descMatch ? descMatch[1].trim() : `${name} skill`;

      // Find associated scripts
      const skillDir = path.dirname(filePath);
      const scripts: string[] = [];
      try {
        const files = await fs.readdir(skillDir);
        for (const file of files) {
          if (file.endsWith('.py') || file.endsWith('.sh') || file.endsWith('.js')) {
            scripts.push(path.join(skillDir, file));
          }
        }
      } catch (e) {
        // No scripts directory
      }

      return {
        name,
        path: filePath,
        description,
        type,
        scripts,
      };
    } catch (error) {
      console.error(`[Skills MCP] Error parsing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List all available skills as resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = Array.from(this.skillsCache.values()).map((skill) => ({
        uri: `skill://${skill.name}`,
        name: skill.name,
        description: skill.description,
        mimeType: 'text/markdown',
        metadata: {
          type: skill.type,
          scripts: skill.scripts?.length || 0,
        },
      }));

      return { resources };
    });

    // Read a specific skill
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const skillName = uri.replace('skill://', '');

      const skill = this.skillsCache.get(skillName);
      if (!skill) {
        throw new Error(`Skill not found: ${skillName}`);
      }

      const content = await fs.readFile(skill.path, 'utf-8');

      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      };
    });

    // List prompts (skills that can be used as prompts)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = Array.from(this.skillsCache.values())
        .filter((skill) => skill.type === 'meta-skill' || skill.type === 'skill')
        .map((skill) => ({
          name: skill.name,
          description: skill.description,
          arguments: [],
        }));

      return { prompts };
    });

    // Get a specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const skillName = request.params.name;
      const skill = this.skillsCache.get(skillName);

      if (!skill) {
        throw new Error(`Skill not found: ${skillName}`);
      }

      const content = await fs.readFile(skill.path, 'utf-8');

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    });

    // List available tools (skill operations)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_skills',
          description: 'List all available skills in the ecosystem',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['all', 'meta-skill', 'skill', 'context'],
                description: 'Filter by skill type',
              },
            },
          },
        },
        {
          name: 'get_skill_content',
          description: 'Get the full content of a skill',
          inputSchema: {
            type: 'object',
            properties: {
              skillName: {
                type: 'string',
                description: 'Name of the skill',
              },
            },
            required: ['skillName'],
          },
        },
        {
          name: 'search_skills',
          description: 'Search skills by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_onboarding_flow',
          description: 'Get the agent onboarding flow documentation',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_resource_map',
          description: 'Get the complete resource map for skill discovery',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list_skills': {
          const typeFilter = (args as any)?.type || 'all';
          const skills = Array.from(this.skillsCache.values())
            .filter((skill) => typeFilter === 'all' || skill.type === typeFilter)
            .map((skill) => ({
              name: skill.name,
              type: skill.type,
              description: skill.description,
              scripts: skill.scripts?.length || 0,
            }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(skills, null, 2),
              },
            ],
          };
        }

        case 'get_skill_content': {
          const skillName = (args as any).skillName;
          const skill = this.skillsCache.get(skillName);

          if (!skill) {
            throw new Error(`Skill not found: ${skillName}`);
          }

          const content = await fs.readFile(skill.path, 'utf-8');

          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        }

        case 'search_skills': {
          const query = ((args as any).query || '').toLowerCase();
          const skills = Array.from(this.skillsCache.values())
            .filter(
              (skill) =>
                skill.name.toLowerCase().includes(query) ||
                skill.description.toLowerCase().includes(query)
            )
            .map((skill) => ({
              name: skill.name,
              type: skill.type,
              description: skill.description,
            }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(skills, null, 2),
              },
            ],
          };
        }

        case 'get_onboarding_flow': {
          const onboardingPath = path.join(this.skillsBasePath, 'context', 'agent-onboarding.md');
          try {
            const content = await fs.readFile(onboardingPath, 'utf-8');
            return {
              content: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            };
          } catch (error) {
            throw new Error('Onboarding flow not found');
          }
        }

        case 'get_resource_map': {
          const resourceMapPath = path.join(this.skillsBasePath, 'context', 'resource-map.md');
          try {
            const content = await fs.readFile(resourceMapPath, 'utf-8');
            return {
              content: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            };
          } catch (error) {
            throw new Error('Resource map not found');
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('[Skills MCP] Server running on stdio');
  }
}

// CLI entry point removed - handled in index.ts
