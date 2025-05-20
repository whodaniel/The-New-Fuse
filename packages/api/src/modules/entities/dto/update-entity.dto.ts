import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { Prisma } from '@prisma/client'; // Import Prisma namespace for JsonValue type

export class UpdateEntityDto {
  @ApiPropertyOptional({ description: 'New unique identifier/name for the entity', example: 'openai-gpt4-turbo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "New type discriminator", example: 'AIModel' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'New or updated specific details about the entity', type: 'object', example: { modelId: 'gpt-4-turbo', provider: 'OpenAI', updated: true } })
  @IsOptional()
  @IsObject()
  metadata?: Prisma.JsonValue;
}
