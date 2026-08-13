import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RequestAgentTokenDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  agentId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(128)
  integration!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountRef?: string;

  @IsArray()
  @ArrayMaxSize(128)
  @IsString({ each: true })
  requestedScopes!: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(128)
  action!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  ttlSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  runtimeId?: string;

  @IsOptional()
  @IsBoolean()
  bindIp?: boolean;
}

export class ApproveAgentTokenRequestDto {
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  requestId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(256)
  mfaProof!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(128)
  @IsString({ each: true })
  approvedScopes?: string[];

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  approvedTtlSeconds?: number;
}

export class RevokeAgentTokenDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  tokenId?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  requestId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RevokeAllAgentTokensDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  agentId!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  integration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpsertAuthBrokerPolicyDto {
  @IsArray()
  @ArrayMaxSize(256)
  @IsString({ each: true })
  allowedScopes!: string[];

  @IsArray()
  @ArrayMaxSize(256)
  @IsString({ each: true })
  allowedActions!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(256)
  @IsString({ each: true })
  stepUpActions?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(256)
  @IsString({ each: true })
  singleUseActions?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(256)
  @IsString({ each: true })
  allowedAccountRefs?: string[];

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  maxTtlSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  defaultTtlSeconds?: number;

  @IsOptional()
  @IsBoolean()
  requireRuntimeBinding?: boolean;

  @IsOptional()
  @IsBoolean()
  requireIpBinding?: boolean;
}

export class AuthorizeAgentTokenDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  agentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  integration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  action?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(128)
  @IsString({ each: true })
  requiredScopes?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  runtimeId?: string;
}
