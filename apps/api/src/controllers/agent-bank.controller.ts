import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { User } from '@the-new-fuse/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuth, SecureAuthGuard } from '../guards/secure-auth.guard';
import { AgentBankService } from '../services/agent-bank.service';

/**
 * AgentBankController
 *
 * Exposes the library of agent templates (personas) defined in the filesystem.
 * This allows the frontend and other agents to discover and utilize
 * pre-defined agent definitions from the .agent/agents and .claude/agents directories.
 */
@ApiTags('Agents')
@Controller('agents/bank')
@UseGuards(SecureAuthGuard)
@JwtAuth()
export class AgentBankController {
  constructor(private readonly agentBankService: AgentBankService) {}

  /**
   * List all agent templates from the banks
   */
  @Get('templates')
  @ApiOperation({
    summary: 'List all agent templates from the filesystem bank',
    description:
      'STARTER tier restricts access to the TNF bank only. PRO/ENTERPRISE tiers have full access.',
  })
  @ApiResponse({ status: 200, description: 'List of agent templates' })
  async listTemplates(
    @CurrentUser() user: User,
    @Query('bank') bank: 'tnf' | 'claude' | 'all' = 'all'
  ) {
    return this.agentBankService.listTemplates(bank, user.id, user.role);
  }

  /**
   * Get the content of a specific agent template
   */
  @Get('template/:bank/:filename')
  @ApiOperation({
    summary: 'Get the content of a specific agent template',
    description: 'Access to the Claude bank requires a PRO or ENTERPRISE membership.',
  })
  @ApiResponse({ status: 200, description: 'Template content' })
  async getTemplate(
    @CurrentUser() user: User,
    @Param('bank') bank: 'tnf' | 'claude',
    @Param('filename') filename: string
  ) {
    const content = await this.agentBankService.getTemplateContent(
      bank,
      filename,
      user.id,
      user.role
    );
    return { content };
  }
}
