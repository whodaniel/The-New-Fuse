import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ description: 'User ID associated with the provider' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    enum: ['openai', 'anthropic', 'cohere'],
    description: 'Name of the LLM provider'
  })
  @IsString()
  @IsIn(['openai', 'anthropic', 'cohere'])
  providerName!: string;

  @ApiProperty({ description: 'API key for the LLM provider' })
  @IsString()
  @IsNotEmpty()
  apiKey!: string;
}