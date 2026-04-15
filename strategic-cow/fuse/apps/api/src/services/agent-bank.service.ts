import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PayPalService } from '../modules/billing/paypal.service';

/**
 * AgentTemplate interface representing a persona template in the bank
 */
export interface AgentTemplate {
  id: string;
  name: string;
  bank: 'tnf' | 'claude';
  filename: string;
  size: number;
  lastModified: Date;
  description?: string;
  category?: string;
}

@Injectable()
export class AgentBankService {
  private readonly logger = new Logger(AgentBankService.name);

  constructor(private readonly paypalService: PayPalService) {}

  /**
   * Resolve the workspace root directory
   */
  getWorkspaceRoot(): string {
    if (process.env.TNF_WORKSPACE) return process.env.TNF_WORKSPACE;

    // Default to current directory and look for .agent
    let current = process.cwd();
    // Safety limit of 10 levels
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(path.join(current, '.agent'))) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    return process.cwd();
  }

  /**
   * List all templates in the agent banks
   */
  async listTemplates(
    bank: 'tnf' | 'claude' | 'all' = 'all',
    userId?: string,
    userRole?: string
  ): Promise<AgentTemplate[]> {
    const root = this.getWorkspaceRoot();
    const templates: AgentTemplate[] = [];

    // Gating logic
    let allowedBanks: string[] = ['tnf', 'claude'];
    if (userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      const tier = await this.paypalService.getUserTier(userId);
      if (tier === 'STARTER') {
        allowedBanks = ['tnf']; // Starter tier can only access TNF bank
      }
    }

    const scan = (dir: string, bankType: 'tnf' | 'claude') => {
      try {
        if (!fs.existsSync(dir)) {
          this.logger.debug(`Bank directory not found: ${dir}`);
          return;
        }

        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isFile() && (file.endsWith('.md') || file.endsWith('.json'))) {
            // Basic parsing for name/description if it's a markdown file
            let name = file.replace(/\.md$/, '').replace(/\.json$/, '');
            let description = '';

            // Optional: Read first few lines for name/description if it's small
            if (stat.size < 1024 * 5) {
              // Only read small files for metadata
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              const titleLine = lines.find((l) => l.startsWith('# '));
              if (titleLine) name = titleLine.replace('# ', '').trim();
            }

            templates.push({
              id: `${bankType}:${file}`,
              name,
              bank: bankType,
              filename: file,
              size: stat.size,
              lastModified: stat.mtime,
              description,
            });
          }
        }
      } catch (err) {
        this.logger.error(`Failed to scan bank ${bankType}: ${err}`);
      }
    };

    if ((bank === 'tnf' || bank === 'all') && allowedBanks.includes('tnf')) {
      scan(path.join(root, '.agent', 'agents'), 'tnf');
    }
    if ((bank === 'claude' || bank === 'all') && allowedBanks.includes('claude')) {
      scan(path.join(root, '.claude', 'agents'), 'claude');
    }

    return templates;
  }

  /**
   * Get the full content of a template file
   */
  async getTemplateContent(
    bank: 'tnf' | 'claude',
    filename: string,
    userId?: string,
    userRole?: string
  ): Promise<string> {
    // Gating check
    if (userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      const tier = await this.paypalService.getUserTier(userId);
      if (tier === 'STARTER' && bank === 'claude') {
        throw new ForbiddenException(
          'Access to Claude agent bank requires a PRO or ENTERPRISE membership.'
        );
      }
    }

    const root = this.getWorkspaceRoot();
    const bankDir = bank === 'tnf' ? '.agent/agents' : '.claude/agents';
    const fullPath = path.join(root, bankDir, filename);

    // Security check: ensure path is within the bank directory
    const resolvedBankDir = path.resolve(path.join(root, bankDir));
    const resolvedFilePath = path.resolve(fullPath);

    if (!resolvedFilePath.startsWith(resolvedBankDir)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      throw new NotFoundException(`Template ${filename} not found in ${bank} bank`);
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }
}
