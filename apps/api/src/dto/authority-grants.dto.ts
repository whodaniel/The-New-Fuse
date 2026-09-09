import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class IssueAuthorityGrantDto {
  @ApiProperty({ description: 'Caller DID issuing the grant (must resolve to super-admin or super-director)' })
  @IsString()
  @IsNotEmpty()
  callerDid!: string;

  @ApiProperty({ description: 'Subject DID receiving authority (must be a did:tnf)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  subjectDid!: string;

  @ApiProperty({ description: 'Authority role being granted (worker, sub-director, super-director, super-admin)' })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiPropertyOptional({ description: 'Parent grant UUID in delegation chain' })
  @IsOptional()
  @IsString()
  parentGrantId?: string;

  @ApiPropertyOptional({ description: 'TTL in seconds (default: 3600; max 43200 for cross-residency)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86400 * 30)
  ttlSeconds?: number;

  @ApiPropertyOptional({ description: 'Whether the subject may bridge authority onward across residency' })
  @IsOptional()
  @IsBoolean()
  mayBridgeOnward?: boolean;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant isolation' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Human-readable purpose for audit records' })
  @IsOptional()
  @IsString()
  purpose?: string;
}

export class RenewAuthorityGrantDto {
  @ApiProperty({ description: 'Caller DID requesting renewal' })
  @IsString()
  @IsNotEmpty()
  callerDid!: string;

  @ApiProperty({ description: 'Existing grant UUID to renew' })
  @IsString()
  @IsNotEmpty()
  grantId!: string;

  @ApiPropertyOptional({ description: 'TTL in seconds for the new grant row' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86400 * 30)
  ttlSeconds?: number;
}

export class RevokeAuthorityGrantDto {
  @ApiProperty({ description: 'Caller DID requesting revocation' })
  @IsString()
  @IsNotEmpty()
  callerDid!: string;

  @ApiProperty({ description: 'Grant UUID to revoke' })
  @IsString()
  @IsNotEmpty()
  grantId!: string;

  @ApiProperty({ description: 'Reason for revocation' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
