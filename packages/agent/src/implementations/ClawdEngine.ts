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

  private initializationPromise: Promise<void>;

  constructor(rootPath?: string) {
    const root = rootPath || os.homedir();
    this.assimilationService = new ClawdAssimilationService(root);
    this.memoryPath = path.join(root, '.clawd', 'memory');
    this.nodeId = `tnf-assimilated-${uuidv4().substring(0, 8)}`;

    // Connect to the OpenClaw Gateway Service (Assimilated)
    // In dev: localhost:18789 (The new OpenClaw port)
    // In prod: via env var provided by Railway
    this.sandboxClient = new RemoteSandboxClient(
      process.env.OPENCLAW_GATEWAY_URL || 'ws://localhost:18789'
    );

    // Initialize Local Scheduler
    this.scheduler = new ClawdScheduler({
      redisUrl: process.env.REDIS_URL,
      nodeId: this.nodeId,
    });

    this.initializationPromise = this.initialize().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[OpenClawEngine] Failed to initialize:', err);
    });
  }

  private async initialize() {
    await this.assimilationService.assimilateSkills();
    this.ensureMemory();

    // Connect to remote gateway
    try {
      await this.sandboxClient.connect();
      // eslint-disable-next-line no-console
      console.log('[OpenClawEngine] Connected to OpenClaw Gateway');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        '[OpenClawEngine] Failed to connect to OpenClaw Gateway (Will retry on usage):',
        e
      );
    }

    // Initialize Scheduler with proactive skills
    await this.initializeProactiveSkills();

    // eslint-disable-next-line no-console
    console.log(`[OpenClawEngine] Initialized as Node: ${this.nodeId}`);
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
            console.log(
              `[OpenClawEngine] Scheduling skill '${skill.name}' with cron: ${expression}`
            );

            await this.scheduler.scheduleSkill(skill.name, expression, {}, async () => {
              // Fallback / Local Handler
              // eslint-disable-next-line no-console
              console.log(`[OpenClawEngine] PROACTIVE TRIGGER (Local): ${skill.name}`);
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
    await this.initializationPromise;
    // eslint-disable-next-line no-console
    console.log(`[OpenClawEngine] Processing request: ${req.method}`);

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
          throw new Error(`Method ${req.method} not implemented in OpenClawEngine`);
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
   * SECURITY NOTE: All tool execution is delegated to the OpenClaw Gateway,
   * which enforces Docker sandboxing and RBAC.
   */
  private async executeSkill(skillName: string, args: unknown): Promise<unknown> {
    const skill = this.assimilationService.getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    if (process.env.OPENCLAW_SKILL_SIGNATURE_REQUIRED === 'true' && !skill.verified) {
      throw new Error(`Skill ${skillName} is not verified and cannot be executed`);
    }

    // eslint-disable-next-line no-console
    console.log(`[OpenClawEngine] Executing skill: ${skill.name}`);

    // We revive the Sandbox for logic execution, but backed by Remote Client
    const { ClawdSandbox } = await import('./ClawdSandbox.js');

    const localSandbox = new ClawdSandbox({
      allowedGlobals: {
        console,
        // The Bridge to OpenClaw Gateway:
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

    // eslint-disable-next-line no-console
    console.log(`[OpenClawEngine] Shutdown complete for Node: ${this.nodeId}`);
  }
}
