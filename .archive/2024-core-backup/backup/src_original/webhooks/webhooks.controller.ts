import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from /@nestjs/swagger'';
@ApiTags('webhooks'
@Controller('webhooks"
  @Post(":id'
  @ApiOperation({ summary: 'Handle incoming webhook'
  @ApiParam({ name: 'id', description: 'Webhook ID'
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.'
  @ApiResponse({ status: 400, description: 'Invalid webhook payload or signature.'
  @ApiResponse({ status: 404, description: 'Webhook not found.'
    @Param('id'
      return { success: true, message: 'Webhook processed successfully'
      if (error.message.includes('Invalid webhook ID'
        throw new NotFoundException(`Webhook with ID '${webhookId}`'``;
      if (error.message.includes('Invalid webhook signature'
        throw new BadRequestException('')