import { IsString, IsOptional, IsUrl, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'User bio/description',
    example: 'Software developer and AI enthusiast',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'User location',
    example: 'San Francisco, CA'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Company/Organization',
    example: 'Acme Inc.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://example.com'
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Additional user preferences',
    example: { theme: 'dark', notifications: true }
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}

export interface ProfileResponseDto {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  company?: string;
  website?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
