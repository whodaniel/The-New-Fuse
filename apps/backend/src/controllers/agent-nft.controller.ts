import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { 
  AgentNftService, 
  MintAgentNftDto, 
  FractionalizeAgentDto,
  CreateRevenueStreamDto,
  DistributeRevenueDto 
} from '../services/agent-nft.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('agent-nft')
@Controller('agents')
export class AgentNftController {
  constructor(private readonly agentNftService: AgentNftService) {}

  @Post(':agentId/nft/mint')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mint an agent as an NFT' })
  @ApiParam({ name: 'agentId', description: 'The ID of the agent to mint as NFT' })
  @ApiResponse({ status: 201, description: 'Agent successfully minted as NFT' })
  @ApiResponse({ status: 400, description: 'Bad request - Agent already minted or invalid data' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async mintAgentAsNft(
    @Param('agentId') agentId: string,
    @Body() body: Omit<MintAgentNftDto, 'agentId'>
  ) {
    const mintData: MintAgentNftDto = {
      agentId,
      ...body
    };
    return this.agentNftService.mintAgentAsNft(mintData);
  }

  @Post(':agentId/nft/fractionalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fractionalize an agent NFT' })
  @ApiParam({ name: 'agentId', description: 'The ID of the agent whose NFT to fractionalize' })
  @ApiResponse({ status: 200, description: 'Agent NFT successfully fractionalized' })
  @ApiResponse({ status: 400, description: 'Bad request - NFT already fractionalized or invalid data' })
  @ApiResponse({ status: 404, description: 'Agent NFT not found' })
  async fractionalizeAgent(
    @Param('agentId') agentId: string,
    @Body() body: Omit<FractionalizeAgentDto, 'agentNftId'>
  ) {
    // First get the agent NFT ID
    const agentNft = await this.agentNftService.getAgentNft(agentId);
    if (!agentNft) {
      throw new Error('Agent NFT not found');
    }

    const fractionalizeData: FractionalizeAgentDto = {
      agentNftId: agentNft.id,
      ...body
    };
    return this.agentNftService.fractionalizeAgent(fractionalizeData);
  }

  @Post(':agentId/nft/revenue-streams')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a revenue stream for an agent NFT' })
  @ApiParam({ name: 'agentId', description: 'The ID of the agent' })
  @ApiResponse({ status: 201, description: 'Revenue stream successfully created' })
  @ApiResponse({ status: 404, description: 'Agent NFT not found' })
  async createRevenueStream(
    @Param('agentId') agentId: string,
    @Body() body: Omit<CreateRevenueStreamDto, 'agentNftId'>
  ) {
    // First get the agent NFT ID
    const agentNft = await this.agentNftService.getAgentNft(agentId);
    if (!agentNft) {
      throw new Error('Agent NFT not found');
    }

    const revenueStreamData: CreateRevenueStreamDto = {
      agentNftId: agentNft.id,
      ...body
    };
    return this.agentNftService.createRevenueStream(revenueStreamData);
  }

  @Post('nft/revenue-streams/:streamId/distribute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Distribute revenue to fractional shareholders' })
  @ApiParam({ name: 'streamId', description: 'The ID of the revenue stream' })
  @ApiResponse({ status: 200, description: 'Revenue successfully distributed' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid distribution data' })
  @ApiResponse({ status: 404, description: 'Revenue stream not found' })
  async distributeRevenue(
    @Param('streamId') streamId: string,
    @Body() body: Omit<DistributeRevenueDto, 'revenueStreamId'>
  ) {
    const distributeData: DistributeRevenueDto = {
      revenueStreamId: streamId,
      ...body
    };
    await this.agentNftService.distributeRevenue(distributeData);
    return { message: 'Revenue distributed successfully' };
  }

  @Get(':agentId/nft')
  @ApiOperation({ summary: 'Get agent NFT details' })
  @ApiParam({ name: 'agentId', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'Agent NFT details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent NFT not found' })
  async getAgentNft(@Param('agentId') agentId: string) {
    const agentNft = await this.agentNftService.getAgentNft(agentId);
    if (!agentNft) {
      return { message: 'Agent NFT not found', nft: null };
    }
    return agentNft;
  }

  @Get('nft/token/:tokenId')
  @ApiOperation({ summary: 'Get agent NFT details by token ID' })
  @ApiParam({ name: 'tokenId', description: 'The token ID of the NFT' })
  @ApiResponse({ status: 200, description: 'Agent NFT details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent NFT not found' })
  async getAgentNftByTokenId(@Param('tokenId') tokenId: string) {
    const agentNft = await this.agentNftService.getAgentNftByTokenId(parseInt(tokenId));
    if (!agentNft) {
      return { message: 'Agent NFT not found', nft: null };
    }
    return agentNft;
  }

  @Get('nft/shares')
  @ApiOperation({ summary: 'Get fractional shares owned by a user' })
  @ApiQuery({ name: 'ownerAddress', description: 'The wallet address of the owner' })
  @ApiResponse({ status: 200, description: 'Fractional shares retrieved successfully' })
  async getUserFractionalShares(@Query('ownerAddress') ownerAddress: string) {
    return this.agentNftService.getUserFractionalShares(ownerAddress);
  }

  @Get('nft/marketplace')
  @ApiOperation({ summary: 'Get active marketplace listings' })
  @ApiResponse({ status: 200, description: 'Active marketplace listings retrieved successfully' })
  async getActiveMarketplaceListings() {
    return this.agentNftService.getActiveMarketplaceListings();
  }

  @Post(':agentId/nft/metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update agent NFT metadata' })
  @ApiParam({ name: 'agentId', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'Metadata updated successfully' })
  @ApiResponse({ status: 400, description: 'Failed to update metadata' })
  @ApiResponse({ status: 404, description: 'Agent NFT not found' })
  async updateAgentMetadata(
    @Param('agentId') agentId: string,
    @Body('metadataUri') metadataUri: string
  ) {
    return this.agentNftService.updateAgentMetadata(agentId, metadataUri);
  }
}