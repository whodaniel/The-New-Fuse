import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ADKBridgeService, ADKToolSpec } from '../services/ADKBridgeService.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

/**
 * ADK Controller
 * 
 * This controller provides REST API endpoints for interacting with Google's ADK.
 */
@ApiTags('adk')
@Controller('adk')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ADKController {
  constructor(
    private readonly adkBridgeService: ADKBridgeService
  ) {}

  /**
   * Register a tool with the ADK
   * @param tool Tool specification
   * @returns Success message
   */
  @Post('tools')
  @ApiOperation({ summary: 'Register a tool with the ADK' })
  @ApiResponse({ status: 201, description: 'Tool registered successfully' })
  async registerTool(@Body() tool: ADKToolSpec) {
    await this.adkBridgeService.registerTool(tool);
    return { message: `Tool ${tool.name} registered successfully` };
  }

  /**
   * Register a message handler with the ADK
   * @param messageType Message type to handle
   * @param handler Handler function name
   * @returns Success message
   */
  @Post('handlers/:messageType')
  @ApiOperation({ summary: 'Register a message handler with the ADK' })
  @ApiResponse({ status: 201, description: 'Handler registered successfully' })
  async registerHandler(
    @Param('messageType') messageType: string,
    @Body('handler') handler: string
  ) {
    // In a real implementation, this would look up the handler function by name
    const handlerFunction = async (message: any) => {
      console.log(`Handling message of type ${messageType}:`, message);
    };

    await this.adkBridgeService.registerMessageHandler(messageType, handlerFunction);
    return { message: `Handler for ${messageType} registered successfully` };
  }

  /**
   * Send a message to another agent
   * @param target Target agent ID
   * @param messageType Message type
   * @param payload Message payload
   * @returns Success message
   */
  @Post('messages/:target/:messageType')
  @ApiOperation({ summary: 'Send a message to another agent' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Param('target') target: string,
    @Param('messageType') messageType: string,
    @Body() payload: any
  ) {
    await this.adkBridgeService.sendMessage(target, messageType, payload);
    return { message: `Message of type ${messageType} sent to ${target} successfully` };
  }

  /**
   * Update the agent context
   * @param context Context to update
   * @returns Success message
   */
  @Post('context')
  @ApiOperation({ summary: 'Update the agent context' })
  @ApiResponse({ status: 201, description: 'Context updated successfully' })
  async updateContext(@Body() context: Record<string, any>) {
    await this.adkBridgeService.updateContext(context);
    return { message: 'Context updated successfully' };
  }

  /**
   * Get the status of the ADK bridge
   * @returns Bridge status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get the status of the ADK bridge' })
  @ApiResponse({ status: 200, description: 'Bridge status' })
  async getStatus() {
    return { status: 'online' };
  }
}
