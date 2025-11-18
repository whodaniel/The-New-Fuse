import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatRoomsService } from './chat-rooms.service';
import {
  CreateChatRoomDto,
  UpdateChatRoomDto,
  AddParticipantDto,
  CreateMessageDto,
  UpdateMessageDto,
  SearchMessagesDto,
  ExportConversationDto,
  ChatRoomResponseDto,
  MessageResponseDto,
  ParticipantResponseDto,
  ChatRoomParticipantRole,
} from './dto/chat-room.dto';

@ApiTags('chat-rooms')
@ApiBearerAuth()
@Controller('chat-rooms')
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  // =================================================================
  // CHAT ROOM ENDPOINTS
  // =================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created successfully', type: ChatRoomResponseDto })
  async createChatRoom(
    @Body() createDto: CreateChatRoomDto,
    @Request() req: any,
  ): Promise<ChatRoomResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.createChatRoom(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chat rooms for the current user' })
  @ApiResponse({ status: 200, description: 'List of chat rooms', type: [ChatRoomResponseDto] })
  async getUserChatRooms(@Request() req: any): Promise<ChatRoomResponseDto[]> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.getUserChatRooms(userId);
  }

  @Get(':roomId')
  @ApiOperation({ summary: 'Get a specific chat room' })
  @ApiResponse({ status: 200, description: 'Chat room details', type: ChatRoomResponseDto })
  async getChatRoom(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<ChatRoomResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.getChatRoom(roomId, userId);
  }

  @Put(':roomId')
  @ApiOperation({ summary: 'Update a chat room' })
  @ApiResponse({ status: 200, description: 'Chat room updated successfully', type: ChatRoomResponseDto })
  async updateChatRoom(
    @Param('roomId') roomId: string,
    @Body() updateDto: UpdateChatRoomDto,
    @Request() req: any,
  ): Promise<ChatRoomResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.updateChatRoom(roomId, updateDto, userId);
  }

  @Delete(':roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat room' })
  @ApiResponse({ status: 204, description: 'Chat room deleted successfully' })
  async deleteChatRoom(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.deleteChatRoom(roomId, userId);
  }

  // =================================================================
  // PARTICIPANT ENDPOINTS
  // =================================================================

  @Get(':roomId/participants')
  @ApiOperation({ summary: 'Get all participants in a chat room' })
  @ApiResponse({ status: 200, description: 'List of participants', type: [ParticipantResponseDto] })
  async getParticipants(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<ParticipantResponseDto[]> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.getParticipants(roomId, userId);
  }

  @Post(':roomId/participants')
  @ApiOperation({ summary: 'Add a participant to a chat room' })
  @ApiResponse({ status: 201, description: 'Participant added successfully', type: ParticipantResponseDto })
  async addParticipant(
    @Param('roomId') roomId: string,
    @Body() addDto: AddParticipantDto,
    @Request() req: any,
  ): Promise<ParticipantResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.addParticipant(roomId, addDto, userId);
  }

  @Delete(':roomId/participants/:participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a participant from a chat room' })
  @ApiResponse({ status: 204, description: 'Participant removed successfully' })
  async removeParticipant(
    @Param('roomId') roomId: string,
    @Param('participantId') participantId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.removeParticipant(roomId, participantId, userId);
  }

  @Put(':roomId/participants/:participantId/role')
  @ApiOperation({ summary: 'Update a participant\'s role' })
  @ApiResponse({ status: 200, description: 'Participant role updated successfully', type: ParticipantResponseDto })
  async updateParticipantRole(
    @Param('roomId') roomId: string,
    @Param('participantId') participantId: string,
    @Body('role') role: ChatRoomParticipantRole,
    @Request() req: any,
  ): Promise<ParticipantResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.updateParticipantRole(roomId, participantId, role, userId);
  }

  // =================================================================
  // MESSAGE ENDPOINTS
  // =================================================================

  @Get(':roomId/messages')
  @ApiOperation({ summary: 'Get messages in a chat room' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ): Promise<any> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.getMessages(
      roomId,
      userId,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  @Post(':roomId/messages')
  @ApiOperation({ summary: 'Send a message in a chat room' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  async createMessage(
    @Param('roomId') roomId: string,
    @Body() createDto: CreateMessageDto,
    @Request() req: any,
  ): Promise<MessageResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    const isAgent = req.user?.type === 'agent';
    return this.chatRoomsService.createMessage(roomId, createDto, userId, isAgent);
  }

  @Put(':roomId/messages/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully', type: MessageResponseDto })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateDto: UpdateMessageDto,
    @Request() req: any,
  ): Promise<MessageResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.updateMessage(messageId, updateDto, userId);
  }

  @Delete(':roomId/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 204, description: 'Message deleted successfully' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.deleteMessage(messageId, userId);
  }

  @Post(':roomId/messages/:messageId/pin')
  @ApiOperation({ summary: 'Pin a message' })
  @ApiResponse({ status: 200, description: 'Message pinned successfully', type: MessageResponseDto })
  async pinMessage(
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ): Promise<MessageResponseDto> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.pinMessage(messageId, roomId, userId);
  }

  @Post(':roomId/messages/:messageId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ status: 204, description: 'Message marked as read' })
  async markAsRead(
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user?.id || req.user?.userId;
    const isAgent = req.user?.type === 'agent';
    return this.chatRoomsService.markAsRead(messageId, roomId, userId, isAgent);
  }

  // =================================================================
  // SEARCH & EXPORT ENDPOINTS
  // =================================================================

  @Post('search')
  @ApiOperation({ summary: 'Search messages across chat rooms' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchMessages(
    @Body() searchDto: SearchMessagesDto,
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.searchMessages(searchDto, userId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export conversation history' })
  @ApiResponse({ status: 200, description: 'Exported conversation data' })
  async exportConversation(
    @Body() exportDto: ExportConversationDto,
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user?.id || req.user?.userId;
    return this.chatRoomsService.exportConversation(exportDto, userId);
  }

  // =================================================================
  // AGENT-SPECIFIC ENDPOINTS
  // =================================================================

  @Post(':roomId/summarize')
  @ApiOperation({ summary: 'Generate AI summary of conversation' })
  @ApiResponse({ status: 200, description: 'Conversation summary' })
  async summarizeConversation(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<{ summary: string }> {
    const userId = req.user?.id || req.user?.userId;
    const summary = await this.chatRoomsService.summarizeConversation(roomId, userId);
    return { summary };
  }

  @Get(':roomId/suggestions')
  @ApiOperation({ summary: 'Get AI-suggested next actions' })
  @ApiResponse({ status: 200, description: 'Suggested actions' })
  async suggestNextActions(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<{ suggestions: string[] }> {
    const userId = req.user?.id || req.user?.userId;
    const suggestions = await this.chatRoomsService.suggestNextActions(roomId, userId);
    return { suggestions };
  }
}
