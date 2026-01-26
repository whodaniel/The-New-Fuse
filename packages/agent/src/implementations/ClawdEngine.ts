import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { v4 as uuidv4 } from 'uuid';

import type { IRequestFrame, IResponseFrame } from '../protocols/ClawdProtocol';
import { ClawdAssimilationService } from '../services/ClawdAssimilationService';

/**
 * ClawdEngine - The Assimilated Core of Clawdbot
 *
 * This engine provides the autonomy, persistence, and protocol compatibility
 * of the original Clawdbot, fully integrated into the TNF Agent Runtime.
 */
export class ClawdEngine {
  private assimilationService: ClawdAssimilationService;
  private memoryPath: string;
  private nodeId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(rootPath?: string) {
    const root = rootPath || os.homedir();
    this.assimilationService = new ClawdAssimilationService(root);
    this.memoryPath = path.join(root, '.clawd', 'memory');
    this.nodeId = `tnf-assimilated-${uuidv4().substring(0, 8)}`;

    void this.initialize().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[ClawdEngine] Failed to initialize:', err);
    });
  }

  private async initialize() {
    await this.assimilationService.assimilateSkills();
    this.ensureMemory();
    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Initialized as Node: ${this.nodeId}`);

    // Start the Proactive Loop
    this.startHeartbeat();
  }

  private ensureMemory() {
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  /**
   * Proactive Heartbeat
   * Checks for triggers (cron, events) defined in assimilated skills.
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.checkTriggers().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[ClawdEngine] Heartbeat error:', err);
      });
    }, 60000); // Every minute
  }

  private async checkTriggers() {
    const skills = this.assimilationService.listSkills();
    // TODO: Implement cron-based trigger system
    // For now, this is a placeholder for proactive task scheduling
    // Real implementation would:
    // 1. Parse cron syntax from skill triggers
    // 2. Check current time against cron patterns
    // 3. Execute skills whose triggers match
    const triggeredSkills = skills.filter((s) => s.triggers.length > 0);
    if (triggeredSkills.length > 0) {
      // Future: Execute triggered skills
    }
  }

  /**
   * Handle a Protocol Request (Mocking the Gateway logic)
   * This allows the Engine to process "req" frames just like the original Clawdbot.
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
          // Execute a skill!
          // params: { skillName: string, args: any }
          const params = req.params as { skillName: string; args: unknown };
          result = await this.executeSkill(params.skillName, params.args);
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
   * Execute an Assimilated Skill
   * Uses a sandboxed VM or direct execution (CAUTION: Direct execution for now)
   */
  private async executeSkill(skillName: string, args: unknown): Promise<unknown> {
    const skill = this.assimilationService.getSkill(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Executing skill: ${skill.name}`);

    // DANGEROUS: Eval implementation for assimilation proof-of-concept
    // In production, use vm2 or helper process
    // We wrap the implementation in an async IIFE

    // NOTE: This implementation is dangerous and should be sandboxed in production.
    // We are simulating the "Assimilated" capability.

    // Use Function constructor to run the code
    const runSkill = new Function(
      'args',
      `
      return (async () => {
        ${skill.implementation}
      })();
    `
    );

    return runSkill(args);
  }

  /**
   * Cleanup and shutdown the engine
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // eslint-disable-next-line no-console
    console.log(`[ClawdEngine] Shutdown complete for Node: ${this.nodeId}`);
  }
}
