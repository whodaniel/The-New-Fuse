#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';
import axios from 'axios';
import { glob } from 'glob';
import * as yaml from 'js-yaml';
import { z } from 'zod';

// Config
const REPO_OWNER = 'whodaniel';
const REPO_NAME = 'fuse';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Expected to be set in environment

// Interfaces
interface WorkflowDefinition {
  name?: string;
  on?: string | string[] | Record<string, any>;
  jobs?: Record<string, any>;
}

// Helper to find repo root
async function findRepoRoot(startDir: string): Promise<string> {
  let current = startDir;
  while (current !== path.parse(current).root) {
    try {
      await fs.stat(path.join(current, '.github'));
      return current;
    } catch {
      current = path.dirname(current);
    }
  }
  throw new Error('Could not find repository root with .github folder');
}

// Server implementation
const server = new Server(
  {
    name: 'devops-bridge',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_system_skills',
        description:
          'Scans the repository for available CI/CD workflows (system skills) defined in .github/workflows',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'invoke_skill',
        description:
          "Triggers a GitHub Action workflow (skill) by filename. Requires 'workflow_dispatch' event in the workflow.",
        inputSchema: {
          type: 'object',
          properties: {
            workflow_file: {
              type: 'string',
              description: "The filename of the workflow, e.g., 'build-electron.yml'",
            },
            inputs: {
              type: 'object',
              description: 'Optional inputs for the workflow dispatch',
            },
            ref: {
              type: 'string',
              description: "Git reference (branch/tag) to run on. Defaults to 'main'.",
            },
          },
          required: ['workflow_file'],
        },
      },
      {
        name: 'get_skill_feedback',
        description: 'Retrieves the status and logs of the most recent run of a specific workflow.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_file: {
              type: 'string',
              description: "The filename of the workflow, e.g., 'build-electron.yml'",
            },
          },
          required: ['workflow_file'],
        },
      },
    ],
  };
});

// Handle Tool Calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'list_system_skills') {
      const repoRoot = await findRepoRoot(process.cwd());
      const workflowDir = path.join(repoRoot, '.github', 'workflows');

      const files = await glob('*.{yml,yaml}', { cwd: workflowDir });
      const skills = [];

      for (const file of files) {
        const content = await fs.readFile(path.join(workflowDir, file), 'utf8');
        const doc = yaml.load(content) as WorkflowDefinition;
        skills.push({
          file,
          name: doc.name || file,
          triggers: Object.keys(doc.on || {}),
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(skills, null, 2),
          },
        ],
      };
    }

    if (name === 'invoke_skill') {
      const parsed = z
        .object({
          workflow_file: z.string(),
          inputs: z.record(z.string(), z.any()).optional(),
          ref: z.string().optional().default('main'),
        })
        .parse(args);

      if (!GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN environment variable not set');
      }

      // Verify file exists locally first
      const repoRoot = await findRepoRoot(process.cwd());
      const workflowPath = path.join(repoRoot, '.github', 'workflows', parsed.workflow_file);
      await fs.stat(workflowPath);

      // Trigger via API
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${parsed.workflow_file}/dispatches`;

      await axios.post(
        url,
        {
          ref: parsed.ref,
          inputs: parsed.inputs,
        },
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `Successfully triggered skill '${parsed.workflow_file}' on ref '${parsed.ref}'`,
          },
        ],
      };
    }

    if (name === 'get_skill_feedback') {
      const parsed = z.object({ workflow_file: z.string() }).parse(args);
      if (!GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN environment variable not set');
      }

      // Get list of runs
      const runsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${parsed.workflow_file}/runs?per_page=1`;
      const response = await axios.get(runsUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      const runs = response.data.workflow_runs;
      if (!runs || runs.length === 0) {
        return { content: [{ type: 'text', text: 'No runs found for this skill.' }] };
      }

      const lastRun = runs[0];
      const status = lastRun.status; // queued, in_progress, completed
      const conclusion = lastRun.conclusion; // success, failure, etc.

      let feedback = `Latest Run ID: ${lastRun.id}\nStatus: ${status}\nConclusion: ${conclusion || 'N/A'}\nURL: ${lastRun.html_url}`;

      // If failed, try to get jobs/logs (simplified)
      if (conclusion === 'failure') {
        const jobsUrl = lastRun.jobs_url;
        const jobsResp = await axios.get(jobsUrl, {
          headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        });
        const failedJobs = jobsResp.data.jobs.filter((j: any) => j.conclusion === 'failure');

        if (failedJobs.length > 0) {
          feedback += `\n\nFailed Jobs:\n`;
          for (const job of failedJobs) {
            feedback += `- ${job.name}: ${job.html_url}\n`;
            // We could fetch log content here if needed, but keeping it light for now
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: feedback,
          },
        ],
      };
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    const err = error as Error;
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${err.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Run server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DevOps Bridge MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
