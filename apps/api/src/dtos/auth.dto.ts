import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string = '';

  @ApiProperty()
  @IsString()
  password: string = '';

  @ApiProperty({
    required: false,
    description: 'Optional Cloudflare Turnstile token (required when server enables Turnstile)',
  })
  @IsString()
  @IsOptional()
  cfTurnstileToken?: string;
}

export class RegisterDto {
  @ApiProperty({
    required: false,
    description: 'Required when invite-only registration is enabled',
  })
  @IsString()
  @IsOptional()
  inviteCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty()
  @IsEmail()
  email: string = '';

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string = '';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    required: false,
    description: 'Optional Cloudflare Turnstile token (required when server enables Turnstile)',
  })
  @IsString()
  @IsOptional()
  cfTurnstileToken?: string;
}

export class TokenDto {
  @ApiProperty()
  @IsString()
  accessToken: string = '';

  @ApiProperty()
  @IsString()
  refreshToken: string = '';
}

export class GenerateInviteCodeDto {
  @ApiProperty({
    required: false,
    description: 'Optional internal label for this invite batch/code',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
    required: false,
    description: 'Optional federation ID tag for attribution/routing',
  })
  @IsString()
  @IsOptional()
  federationId?: string;

  @ApiProperty({ required: false, description: 'Maximum allowed redemptions', default: 1 })
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  maxUses?: number;

  @ApiProperty({
    required: false,
    description: 'ISO timestamp after which this code expires',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsISO8601()
  @IsOptional()
  expiresAt?: string;
}

export class SupabaseAuthDto {
  @ApiProperty()
  @IsString()
  accessToken: string = '';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
