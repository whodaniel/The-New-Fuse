import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChatRoomType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PERSISTENT = 'PERSISTENT',
  EPHEMERAL = 'EPHEMERAL',
  AGENT_ONLY = 'AGENT_ONLY',
  MIXED = 'MIXED',
}

export enum ChatRoomParticipantRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  PARTICIPANT = 'PARTICIPANT',
  OBSERVER = 'OBSERVER',
}

export enum MessageType {
  TEXT = 'TEXT',
  CODE = 'CODE',
  FILE = 'FILE',
  TASK = 'TASK',
  WORKFLOW = 'WORKFLOW',
  SYSTEM = 'SYSTEM',
  SUMMARY = 'SUMMARY',
  SUGGESTION = 'SUGGESTION',
}

export class CreateChatRoomDto {
  @ApiProperty({ description: 'Chat room name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Chat room description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Current discussion topic' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Room purpose/goal' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ description: 'Chat room type', enum: ChatRoomType, default: ChatRoomType.PUBLIC })
  @IsEnum(ChatRoomType)
  type: ChatRoomType;

  @ApiPropertyOptional({ description: 'Is private', default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Is ephemeral (auto-delete)', default: false })
  @IsOptional()
  @IsBoolean()
  isEphemeral?: boolean;

  @ApiPropertyOptional({ description: 'Maximum participants', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(1000)
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'Room settings' })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Room metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Initial participant user IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantUserIds?: string[];

  @ApiPropertyOptional({ description: 'Initial participant agent IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantAgentIds?: string[];
}

export class UpdateChatRoomDto {
  @ApiPropertyOptional({ description: 'Chat room name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Chat room description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Current discussion topic' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Room purpose/goal' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Is private' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Room settings' })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Room metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AddParticipantDto {
  @ApiPropertyOptional({ description: 'User ID to add' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Agent ID to add' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ description: 'Participant role', enum: ChatRoomParticipantRole, default: ChatRoomParticipantRole.PARTICIPANT })
  @IsEnum(ChatRoomParticipantRole)
  role: ChatRoomParticipantRole;

  @ApiPropertyOptional({ description: 'Permissions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Message type', enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({ description: 'Parent message ID for threading' })
  @IsOptional()
  @IsString()
  parentMessageId?: string;

  @ApiPropertyOptional({ description: 'Attachment URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Code snippet data' })
  @IsOptional()
  codeSnippet?: {
    language: string;
    code: string;
    syntax?: string;
  };

  @ApiPropertyOptional({ description: 'Task assignment data' })
  @IsOptional()
  taskAssignment?: {
    assignedTo: string;
    dueDate?: string;
    priority?: string;
  };

  @ApiPropertyOptional({ description: 'Workflow trigger data' })
  @IsOptional()
  workflowTrigger?: {
    workflowId: string;
    action: string;
    params?: Record<string, any>;
  };

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateMessageDto {
  @ApiProperty({ description: 'Updated message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Updated metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ChatRoomResponseDto {
  id: string;
  name: string;
  description?: string;
  topic?: string;
  purpose?: string;
  type: ChatRoomType;
  isPrivate: boolean;
  isEphemeral: boolean;
  ownerId: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  isActive: boolean;
  expiresAt?: Date;
  maxParticipants: number;
  participantCount?: number;
  messageCount?: number;
}

export class MessageResponseDto {
  id: string;
  content: string;
  type: MessageType;
  role: string;
  senderId?: string;
  senderName?: string;
  agentId?: string;
  roomId?: string;
  parentMessageId?: string;
  metadata?: Record<string, any>;
  attachments: string[];
  codeSnippet?: any;
  taskAssignment?: any;
  workflowTrigger?: any;
  timestamp: Date;
  updatedAt: Date;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  readCount?: number;
  reactionCount?: number;
}

export class ParticipantResponseDto {
  id: string;
  roomId: string;
  userId?: string;
  agentId?: string;
  role: ChatRoomParticipantRole;
  permissions: string[];
  isTyping: boolean;
  lastTypingAt?: Date;
  lastReadAt?: Date;
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  notifications: boolean;
}

export class SearchMessagesDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Search in room ID' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Filter by sender ID' })
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiPropertyOptional({ description: 'Filter by message type', enum: MessageType })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ExportConversationDto {
  @ApiProperty({ description: 'Room ID to export' })
  @IsString()
  roomId: string;

  @ApiPropertyOptional({ description: 'Export format', enum: ['JSON', 'CSV', 'MARKDOWN'] })
  @IsOptional()
  @IsString()
  format?: 'JSON' | 'CSV' | 'MARKDOWN';

  @ApiPropertyOptional({ description: 'Include attachments' })
  @IsOptional()
  @IsBoolean()
  includeAttachments?: boolean;

  @ApiPropertyOptional({ description: 'Include metadata' })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;
}
