import { Controller, Get, Post, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from /@nestjs/swagger'';
import { AgentCardService } from /../services/AgentCardService'';
import { A2AProtocolHandler, A2AMessage } from /../protocols/A2AProtocolHandler'';
import { ProtocolAdapterService } from /../protocols/ProtocolAdapterService'';
@ApiTags('a2a'
@Controller('a2a'
  @Post('messages'
  @ApiOperation({ summary:Send an A2A message'
  @ApiResponse({ status: 201, description:Message sent successfully'
    @Headers('x-protocol-version'
  @Get('agents'
  @ApiOperation({ summary:List all available agents'
  @ApiResponse({ status: 200, description:List of agent cards'
  @Get(/agents/:id'
  @ApiOperation({ summary:Get agent details'
  @ApiResponse({ status: 200, description:Agent card details'
  async getAgent(@Param('id'
  @Get(/agents/:id/capabilities'
  @ApiOperation({ summary:Get agent capabilities'
  @ApiResponse({ status: 200, description:Agent capabilities'
  async getAgentCapabilities(@Param('id'
  @Post('broadcast'
  @ApiOperation({ summary:Broadcast message to multiple agents'
  @ApiResponse({ status: 201, description:Message broadcasted successfully'
    @Headers('x-protocol-version'
  @Post('request'
  @ApiOperation({ summary:Send request and wait for response'
  @ApiResponse({ status: 201, description:Response received'
    @Headers('x-protocol-version'
        reject(new Error('')