import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateAgentInvitationDto {
  @ApiPropertyOptional({ description: 'Custom invitation code (optional)' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Max uses for the invitation', default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Expiration date for the invitation' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Tenant identifier restriction' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Organization identifier restriction' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Agency identifier restriction (workspace ID)' })
  @IsString()
  @IsOptional()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for auditing', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AgentInvitationResponseDto {
  @ApiProperty({ description: 'Invitation ID' })
  id: string;

  @ApiProperty({ description: 'Invitation code (display once)' })
  code: string;

  @ApiProperty({ description: 'Invitation status' })
  status: string;

  @ApiProperty({ description: 'Max uses' })
  maxUses: number;

  @ApiProperty({ description: 'Used count' })
  usedCount: number;

  @ApiPropertyOptional({ description: 'Expiration timestamp' })
  expiresAt?: Date | null;
}
