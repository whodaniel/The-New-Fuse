import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiTags } from '@nestjs/swagger';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { isPrivilegedUser } from '../auth/auth-policy';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';

// Mirroring the constants from apps/casin8-games/swarm/agent-strategy/index.mjs
export const TEMPERAMENTS = {
  TIGHT_AGGRESSIVE: 'tight_aggressive',
  LOOSE_AGGRESSIVE: 'loose_aggressive',
  TIGHT_PASSIVE: 'tight_passive',
  BALANCED: 'balanced',
};

@ApiTags('agent-crafting')
@Controller('agent-crafting')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class AgentCraftingController {
  private readonly logger = new Logger(AgentCraftingController.name);

  constructor(private readonly db: DatabaseService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get available agent strategy templates' })
  async getTemplates(@CurrentUser() user: any) {
    // In a real scenario, we would filter based on user membership levels
    return [
      {
        id: TEMPERAMENTS.BALANCED,
        name: 'Balanced (GTO)',
        description: 'A solid, reliable strategy that avoids major mistakes.',
        minLevel: 'FREE',
      },
      {
        id: TEMPERAMENTS.TIGHT_AGGRESSIVE,
        name: 'Tight Aggressive (TAG)',
        description: 'Plays few hands but plays them strongly.',
        minLevel: 'PREMIUM',
      },
      {
        id: TEMPERAMENTS.LOOSE_AGGRESSIVE,
        name: 'Loose Aggressive (LAG)',
        description: 'High variance, high pressure strategy.',
        minLevel: 'WHALE',
      },
    ];
  }

  @Post('craft/:workspaceId')
  @ApiOperation({ summary: 'Craft a new poker agent within a workspace' })
  async craftAgent(
    @Param('workspaceId') workspaceId: string,
    @Body()
    body: {
      name: string;
      temperament: string;
      description?: string;
    },
    @CurrentUser() user: any
  ) {
    await this.assertWorkspaceAccess(workspaceId, user);

    const temperament = body.temperament || TEMPERAMENTS.BALANCED;

    // Create the agent using the standard agent repository
    const agent = await this.db.agents.create({
      name: body.name,
      description: body.description || `Poker Agent (${temperament})`,
      type: 'poker' as any,
      userId: user.id,
      config: {
        poker: {
          temperament,
          nurtureStage: 'bootstrap',
          maxRiskBps: 800,
        },
      },
      status: 'INACTIVE' as any,
    });

    // Explicitly link to workspace via metadata JSONB field
    await this.db.agents.upsertMetadata(agent.id, {
      metadata: {
        workspaceId,
        tenantId: user.tenantId,
        craftedAt: new Date().toISOString(),
        craftedBy: user.id,
      },
    });

    return agent;
  }

  @Post('nurture/:agentId')
  @ApiOperation({ summary: 'Initialize or update a nurture program for an agent' })
  async initializeNurture(
    @Param('agentId') agentId: string,
    @Body() body: { workspaceId: string },
    @CurrentUser() user: any
  ) {
    await this.assertWorkspaceAccess(body.workspaceId, user);

    const agent = await this.db.agents.findById(agentId);
    if (!agent) throw new NotFoundException('Agent not found');

    // Update agent config with nurture program defaults
    const updatedConfig = {
      ...(agent.config as any),
      poker: {
        ...(agent.config as any)?.poker,
        nurtureProgram: {
          targetBbps: 2.0,
          episodes: 0,
          startedAt: new Date().toISOString(),
        },
      },
    };

    return await this.db.agents.update(agentId, { config: updatedConfig });
  }

  private async assertWorkspaceAccess(workspaceId: string, user: any) {
    const privileged = isPrivilegedUser(user || {});
    const workspace = await this.db.workspaces.findByIdWithOwner(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (!privileged && workspace.ownerId !== user?.id) {
      const membership = await this.db.workspaceMembers.findMembership(workspaceId, user.id);
      if (!membership) {
        throw new ForbiddenException('Workspace access denied');
      }
    }
  }
}
