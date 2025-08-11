import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCommentDto {
  // Implementation needed
}
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content: string;
  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  taskId: string;
  @ApiProperty({ description: 'Parent comment ID for replies', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;
  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateCommentDto {
  // Implementation needed
}
  @ApiProperty({ description: 'Comment content', required: false })
  @IsOptional()
  @IsString()
  content?: string;
  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}