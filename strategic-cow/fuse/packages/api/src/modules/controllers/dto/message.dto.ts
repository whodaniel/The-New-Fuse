import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO class for Message model to be used with Swagger
 */
export class MessageDto {
  @ApiProperty({ description: 'Unique identifier for the message' })
  id: string = '';

  @ApiProperty({ description: 'Content of the message' })
  content: string = '';

  @ApiProperty({ description: 'Role of the message sender', example: 'user' })
  role: string = '';

  @ApiProperty({ description: 'ID of the user who owns this message' })
  userId: string = '';

  @ApiProperty({ description: 'ID of the agent who sent this message', required: false })
  fromAgentId?: string;

  @ApiProperty({ description: 'ID of the agent who received this message', required: false })
  toAgentId?: string;

  @ApiProperty({ description: 'When the message was created' })
  createdAt: Date = new Date();
}
