import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString(): string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}