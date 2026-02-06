import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { CreateAgentDto, UpdateAgentDto } from "@the-new-fuse/types";
import { AgentService } from '../services/agentService.js';
import { DatabaseService } from '../lib/drizzle.service.tsx';
import { ConfigService } from "@nestjs/config";
import { Request } from 'express';

@Controller("agents")
@UseGuards(JwtAuthGuard)
export class AgentController {
  private readonly agentService: AgentService;

  constructor(
    private readonly drizzleService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.agentService = new AgentService(drizzleService, configService);
  }

  @Post()
  async createAgent(@Body() data: CreateAgentDto, @Req() req: Request) {
    const userId = req.user?.id;
    return this.agentService.createAgent(data, userId);
  }

  @Get(':id')
  async getAgentById(@Param("id") id: string, @Req() req: Request) {
    const userId = req.user?.id;
    return this.agentService.getAgentById(id, userId);
  }

  @Put(':id')
  async updateAgent(
    @Param("id") id: string,
    @Body() updates: UpdateAgentDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    return this.agentService.updateAgent(id, updates, userId);
  }

  @Delete(':id')
  async deleteAgent(@Param("id") id: string, @Req() req: Request) {
    const userId = req.user?.id;
    await this.agentService.deleteAgent(id, userId);
  }
}