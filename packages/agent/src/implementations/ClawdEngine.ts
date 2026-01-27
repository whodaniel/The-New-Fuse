import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { v4 as uuidv4 } from 'uuid';

import { ClawdAssimilationService } from '../services/ClawdAssimilationService';

import { ClawdScheduler } from './ClawdScheduler';
import { RemoteSandboxClient } from './RemoteSandboxClient';

import type { IRequestFrame, IResponseFrame } from '../protocols/ClawdProtocol';

/**
 * ClawdEngine - The Assimilated Core of Clawdbot
 *
 * This engine acts as a COORDINATOR, delegating execution to:
 * 1. Cloud Sandbox (apps/cloud-sandbox) via RemoteSandboxClient for heavy lifting (Browser, Shell, Files)
 * 2. JobScheduler (backend) OR Local Scheduler for tasks.
 */
export class ClawdEngine {
  private assimilationService: ClawdAssimilationService;
  private memoryPath: string;
  private nodeId: string;
  private isShuttingDown = false;

  private sandboxClient: RemoteSandboxClient;
  private scheduler: ClawdScheduler; // Kept local for now, transition to Redis later

  constructor(rootPath?: string) {
    const root = rootPath || os.homedir();
    this.assimilationService = new ClawdAssimilationService(root);
    this.memoryPath = path.join(root, '.clawd', 'memory');
    this.nodeId = `tnf-assimilated-${uuidv4().substring(0, 8)}`;

    // Connect to the Cloud Sandbox Service
    // In dev: localhost:3000 (if running locally)
    // In prod: via env var provided by Railway
    this.sandboxClient = new RemoteSandboxClient(
      process.env.CLAWD_SANDBOX_URL || 'ws://localhost:3000'
    );

    // Initialize Local Scheduler (Phase 1 of Synergy)
    this.scheduler = new ClawdScheduler({
      redisUrl: process.env.REDIS_URL,
      nodeId: this.nodeId,
    });

    void this.initialize().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[ClawdEngine] Failed to initialize:', err);
    });
  }

  private async initialize() {
    await this.assimilationService.assimilateSkills();
    this.ensureMemory();

    // Connect to remote sandbox
    try {
      await this.sandboxClient.connect();
      // eslint-disable-next-line no-console
      console.log('[ClawdEngine] Connected to Cloud Sandbox');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[ClawdEngine] Failed to connect to Cloud Sandbox (Will retry on usage):', e);
    }

    // Initialize Scheduler with proactive skills
    await this.initializeProactiveSkills();

    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Initialized as Node: ${this.nodeId}`);
  }

  private ensureMemory() {
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  /**
   * Scan skills for triggers and schedule them
   */
  private async initializeProactiveSkills() {
    const skills = this.assimilationService.listSkills();

    for (const skill of skills) {
      if (skill.triggers && skill.triggers.length > 0) {
        for (const trigger of skill.triggers) {
          if (trigger.startsWith('cron:')) {
            const expression = trigger.replace('cron:', '').trim();
            // eslint-disable-next-line no-console
            console.log(`[ClawdEngine] Scheduling skill '${skill.name}' with cron: ${expression}`);

            await this.scheduler.scheduleSkill(skill.name, expression, {}, async () => {
              // Fallback / Local Handler
              // eslint-disable-next-line no-console
              console.log(`[ClawdEngine] PROACTIVE TRIGGER (Local): ${skill.name}`);
              await this.executeSkill(skill.name, { trigger: 'cron', expression });
            });
          }
        }
      }
    }
  }

  /**
   * Handle Protocol Request
   */
  public async handleRequest(req: IRequestFrame): Promise<IResponseFrame> {
    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Processing request: ${req.method}`);

    let result: unknown;
    let error: any;

    try {
      switch (req.method) {
        case 'node.listSkills':
          result = this.assimilationService.listSkills().map((s) => ({ name: s.name }));
          break;
        case 'node.invoke': {
          const params = req.params as { skillName: string; args: unknown };
          result = await this.executeSkill(params.skillName, params.args);
          break;
        }
        case 'node.schedule': {
          const params = req.params as { skillName: string; cron: string };
          result = { scheduled: true, skill: params.skillName };
          break;
        }
        default:
          throw new Error(`Method ${req.method} not implemented in Assimilated Engine`);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      error = {
        code: 'INTERNAL_ERROR',
        message: errorMessage,
      };
    }

    return {
      type: 'res',
      id: req.id,
      ok: !error,
      payload: result,
      error,
    };
  }

  /**
   * Execute Skill
   *
   * IMPORTANT: This now routes execution based on skill type.
   * - If it's a pure logic skill, run locally (maybe).
   * - If it involves browser/shell/fs, DELEGATE to Remote Sandbox.
   *
   * For the "Assimilation" phase 1, we treat the skill implementation string
   * as something to be sent to the sandbox if it matches certain heuristics,
   * otherwise we might need a parser.
   *
   * However, `apps/cloud-sandbox` expects specific tool calls (browser_navigate, run_command),
   * NOT raw JS code injection (unless we add an 'eval' tool).
   *
   * The `ClawdSkill` we parse from markdown usually contains code.
   * We need to execute that code.
   *
   * STRATEGY: We send the code to the sandbox to be executed via a new `eval_script` tool
   * or similar if supported, OR we run it here and bridge the API calls.
   *
   * Given `ClawdSandbox` allowed `eval`, we will use the `RemoteSandboxClient` to bridge.
   * But `apps/cloud-sandbox` DOES NOT possess a generic `eval` tool.
   * It has `run_command`, `browser_*`.
   *
   * ADAPTATION: We will implement a "Smart Router" here.
   * If the skill is markdown with specific intent, we map it to tools.
   * If it's generic JS, we unfortunately still need a local runtime to orchestrate the remote tools.
   *
   * REVISED APPROACH: We run the code LOCALLY in a safe VM, but inject the
   * `sandboxClient` methods as the API (browser, shell).
   * This is the Hybrid "Controller-Worker" model.
   */
  private async executeSkill(skillName: string, args: unknown): Promise<unknown> {
    const skill = this.assimilationService.getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Executing skill: ${skill.name}`);

    // Dynamic import to avoid circular dependencies if any, or just use our new Client
    // We execute the code LOCALLY, but the 'browser' and 'shell' globals
    // map to RPC calls to the remote sandbox.

    // We revive the Sandbox for logic execution, but backed by Remote Client
    const { ClawdSandbox } = await import('./ClawdSandbox.js');

    const localSandbox = new ClawdSandbox({
      allowedGlobals: {
        console,
        // The Bridge:
        browser: {
          navigate: (url: string) => this.sandboxClient.callTool('browser_navigate', { url }),
          screenshot: () => this.sandboxClient.callTool('browser_screenshot', {}),
          click: (sel: string) => this.sandboxClient.callTool('browser_click', { selector: sel }),
          type: (sel: string, text: string) =>
            this.sandboxClient.callTool('browser_type', { selector: sel, text }),
          content: () => this.sandboxClient.callTool('browser_get_content', {}),
        },
        shell: {
          exec: (cmd: string) => this.sandboxClient.callTool('run_command', { command: cmd }),
        },
        fs: {
          read: (p: string) => this.sandboxClient.callTool('read_file', { path: p }),
          write: (p: string, c: string) =>
            this.sandboxClient.callTool('write_file', { path: p, content: c }),
        },
      },
    });

    return localSandbox.execute(skill.implementation, args);
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    this.scheduler.stopAll();
    // this.sandboxClient.disconnect(); // If we implemented disconnect

    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Shutdown complete for Node: ${this.nodeId}`);
  }
}
