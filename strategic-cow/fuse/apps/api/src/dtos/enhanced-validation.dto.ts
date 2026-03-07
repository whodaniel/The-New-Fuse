import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsNumber({}, { message: 'Page size must be a number' })
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'Page number must be a number' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Sort field must be alphanumeric with underscores only',
  })
  sortBy?: string = 'createdAt';
}

export class SearchDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  search?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}

export class ContactDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message!: string;
}

export class UserProfileDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens',
  })
  username!: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Birth date must be in ISO format (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  website?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];
}

export class AddressDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  street!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state!: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  zipCode!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;
}

export class FileUploadDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'File name can only contain letters, numbers, dots, underscores, and hyphens',
  })
  fileName!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'] })
  @IsString()
  @IsEnum(['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'])
  mimeType!: string;

  @ApiProperty({ minimum: 1, maximum: 10485760 }) // 10MB max
  @IsNumber()
  @Type(() => Number)
  size!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;
}

export class NotificationDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @ApiPropertyOptional({ enum: ['info', 'success', 'warning', 'error'] })
  @IsOptional()
  @IsEnum(['info', 'success', 'warning', 'error'])
  type?: 'info' | 'success' | 'warning' | 'error' = 'info';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ApiKeyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'API key name can only contain letters, numbers, underscores, and hyphens',
  })
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  permissions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be in ISO format' })
  expiresAt?: string;
}

export class LogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be in ISO format' })
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'End date must be in ISO format' })
  endDate?: string;

  @ApiPropertyOptional({ enum: ['error', 'warn', 'info', 'debug'] })
  @IsOptional()
  @IsEnum(['error', 'warn', 'info', 'debug'])
  level?: 'error' | 'warn' | 'info' | 'debug';

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  search?: string;
}

export class WebhookDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Webhook name can only contain letters, numbers, underscores, and hyphens',
  })
  name!: string;

  @ApiProperty()
  @IsUrl({}, { message: 'Please provide a valid webhook URL' })
  url!: string;

  @ApiProperty({ enum: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'] })
  @IsEnum(['POST', 'GET', 'PUT', 'PATCH', 'DELETE'])
  method!: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class FeedbackDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Feedback type can only contain letters, numbers, underscores, and hyphens',
  })
  type!: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  content!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
