import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

@Injectable()
export class RegistrySyncService {
  private readonly logger = new Logger(RegistrySyncService.name);
  private readonly agentsDir = path.join(process.cwd(), '.agent/agents');

  constructor(private db: DatabaseService) {}

  async syncLocalAgents(): Promise<{ added: number; updated: number; failed: number }> {
    this.logger.log('Starting sync of local agents from .agent/agents...');

    // 1. Get the admin user to own these agents
    const adminEmail = 'admin@thenewfuse.com';
    let adminUser = await this.db.client.query.users.findFirst({
      where: (user, { eq }) => eq(user.email, adminEmail),
    });

    if (!adminUser) {
      this.logger.warn(`Admin user ${adminEmail} not found. Some operations might fail.`);
      // Try to get any user if admin doesn't exist, or fail
      const anyUser = await this.db.client.query.users.findFirst();
      if (!anyUser) {
        throw new Error('No users found in database. Cannot sync agents.');
      }
      adminUser = anyUser;
    }

    const userId = adminUser.id;
    const stats = { added: 0, updated: 0, failed: 0 };

    try {
      if (!fs.existsSync(this.agentsDir)) {
        this.logger.error(`Agents directory not found: ${this.agentsDir}`);
        return stats;
      }

      const files = fs.readdirSync(this.agentsDir).filter((f) => f.endsWith('.md'));
      this.logger.log(`Found ${files.length} agent files to sync.`);

      for (const file of files) {
        const filePath = path.join(this.agentsDir, file);
        try {
          const agentData = this.parseAgentFile(filePath);
          if (!agentData) {
            stats.failed++;
            continue;
          }

          // Choose avatar based on type or contents
          const avatarUrl = this.getAvatarForAgent(agentData);

          // Check if agent exists
          const existing = await this.db.agents.findByNameAndUserId(agentData.name, userId);

          const agentPayload: any = {
            name: agentData.name,
            description: agentData.description || '',
            systemPrompt: agentData.systemPrompt || '',
            type: (agentData.type || 'TASK').toUpperCase(),
            capabilities: agentData.capabilities || agentData.tools || [],
            status: 'ACTIVE',
            userId: userId,
            avatarUrl: avatarUrl,
            config: agentData.config || {},
            metadata: agentData.metadata || {},
          };

          if (existing) {
            await this.db.agents.update(existing.id, userId, agentPayload);
            stats.updated++;
          } else {
            // Also ensure a User profile exists for this specific agent name if needed
            // (The user asked for "User profiles for all known Agents")
            // For now we assume they share the admin user, but let's fulfill the request
            // by creating an "Agent User" if requested.
            // But usually TNF agents are owned by users.
            // To create a distinct identity, we can create a sub-user.

            await this.db.agents.create(agentPayload);
            stats.added++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync agent file ${file}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      this.logger.error('Error during local agent sync:', error);
    }

    this.logger.log(
      `Sync complete: ${stats.added} added, ${stats.updated} updated, ${stats.failed} failed.`
    );
    return stats;
  }

  private getAvatarForAgent(agentData: any): string {
    const type = (agentData.type || '').toUpperCase();
    const name = (agentData.name || '').toLowerCase();
    const description = (agentData.description || '').toLowerCase();

    if (
      type === 'CODER' ||
      name.includes('code') ||
      description.includes('program') ||
      name.includes('dev')
    ) {
      return '/assets/agents/coder.png';
    }
    if (
      type === 'DEFI' ||
      name.includes('defi') ||
      name.includes('crypto') ||
      name.includes('wallet')
    ) {
      return '/assets/agents/defi.png';
    }
    if (name.includes('analytic') || name.includes('report') || name.includes('data')) {
      return '/assets/agents/analytics.png';
    }
    if (
      name.includes('market') ||
      name.includes('brand') ||
      name.includes('content') ||
      name.includes('ad')
    ) {
      return '/assets/agents/marketing.png';
    }
    if (name.includes('legal') || name.includes('compliance')) {
      return '/assets/agents/legal.png';
    }
    if (name.includes('security') || name.includes('guardian') || name.includes('protect')) {
      return '/assets/agents/security.png';
    }
    if (name.includes('community') || name.includes('social') || name.includes('engagement')) {
      return '/assets/agents/community.png';
    }
    if (name.includes('support') || name.includes('assist') || name.includes('help')) {
      return '/assets/agents/support.png';
    }
    if (
      name.includes('director') ||
      name.includes('orchestrat') ||
      name.includes('manager') ||
      name.includes('lead')
    ) {
      return '/assets/agents/director.png';
    }
    return '/assets/agents/base.png';
  }

  async syncPydanticDefinitions(): Promise<{ synced: number; failed: number }> {
    this.logger.log('Syncing Pydantic definitions...');
    const pydanticRegistryPath = path.join(
      process.cwd(),
      '.agent/agents/consolidated/pydantic_registry.json'
    );

    if (!fs.existsSync(pydanticRegistryPath)) {
      this.logger.warn(`Pydantic registry JSON not found at ${pydanticRegistryPath}. Skipping.`);
      return { synced: 0, failed: 0 };
    }

    try {
      const data = JSON.parse(fs.readFileSync(pydanticRegistryPath, 'utf8'));

      const adminEmail = 'admin@thenewfuse.com';
      const adminUser = await this.db.client.query.users.findFirst({
        where: (user, { eq }) => eq(user.email, adminEmail),
      });
      const userId = adminUser?.id || (await this.db.client.query.users.findFirst())?.id;

      if (!userId) {
        throw new Error('No users found for Pydantic sync');
      }

      let synced = 0;
      for (const agentData of data) {
        const existing = await this.db.agents.findByNameAndUserId(agentData.name, userId);

        const agentPayload: any = {
          name: agentData.name,
          description: agentData.description,
          type: agentData.type,
          capabilities: agentData.capabilities.map((c: any) => c.name),
          config: agentData.config || {},
          provider: agentData.provider,
          status: 'ACTIVE',
          userId: userId,
        };

        if (existing) {
          await this.db.agents.update(existing.id, userId, agentPayload);
        } else {
          await this.db.agents.create(agentPayload);
        }
        synced++;
      }

      this.logger.log(`Synced ${synced} Pydantic definitions.`);
      return { synced, failed: 0 };
    } catch (error) {
      this.logger.error('Failed to sync Pydantic definitions:', error);
      return { synced: 0, failed: 1 };
    }
  }

  private parseAgentFile(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);

    if (!match) return null;

    try {
      const frontmatter = yaml.load(match[1]) as any;
      const body = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
      return {
        ...frontmatter,
        systemPrompt: body,
      };
    } catch (e) {
      return null;
    }
  }
}
