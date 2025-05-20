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
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigService } from "@nestjs/config";

@Controller("agents")
@UseGuards(JwtAuthGuard)
export class AgentController {
  private readonly agentService: AgentService;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.agentService = new AgentService(prismaService, configService): CreateAgentDto, @Req() req: Request) {
    const userId: Request) {
    const userId: id")
  async getAgentById(@Param() => Promise<void> {"id"): string, @Req() req: Request) {
    const userId: id")
  async updateAgent(
    @Param("id"): string,
    @Body() updates: UpdateAgentDto,
    @Req() req: Request,
  ) {
    const userId: id")
  async deleteAgent(@Param() => Promise<void> {"id"): string, @Req() req: Request) {
    const userId  = req.user?.id;
    return this.agentService.createAgent(data, userId) req.user?.id;
    await this.agentService.deleteAgent(id, userId);
  }
}
