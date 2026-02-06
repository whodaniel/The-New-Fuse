import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  content: string = '';

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentMessageId?: string;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  content: string = '';

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  timestamp: Date = new Date();

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  attachments?: string[];

  @ApiProperty({ required: false })
  parentMessageId?: string;
}
