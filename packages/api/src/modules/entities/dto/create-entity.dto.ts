import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { Prisma } from '@the-new-fuse/database'; // Import Prisma namespace for JsonValue type

export class CreateEntityDto {
  @ApiProperty({ description: 'Unique identifier/name for the entity', example: 'openai-gpt4' })
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @ApiProperty({ description: "Type discriminator (e.g., 'AIModel', 'VSCodeExtension')", example: 'AIModel' })
  @IsString()
  @IsNotEmpty()
  type: string = '';

  @ApiProperty({ description: 'Specific details about the entity', required: false, example: { modelId: 'gpt-4', provider: 'OpenAI' } })
  @IsOptional()
  @IsObject()
  metadata?: Prisma.JsonValue;
}
