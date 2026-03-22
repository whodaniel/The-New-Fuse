import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ProvisionManagedAccountDto {
  @IsString()
  @IsIn(['hosted_email', 'chatgpt', 'external'])
  accountType!: 'hosted_email' | 'chatgpt' | 'external';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  loginIdentifier!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(512)
  secret!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  createdByAgent?: string;

  @IsOptional()
  @IsBoolean()
  createOnHosting?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostingDomain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostingMailbox?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10240)
  hostingQuotaMb?: number;

  @IsOptional()
  @IsBoolean()
  allowChatgptAutomation?: boolean;
}

export class CreateManagedAccountGrantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  granteeAgentId!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  scopes?: string[];

  @IsDateString()
  expiresAt!: string;
}

export class RedeemManagedAccountGrantDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  grantToken!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  granteeAgentId!: string;
}
