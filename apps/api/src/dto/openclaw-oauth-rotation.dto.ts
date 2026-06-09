import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export const OPENCLAW_PROVIDERS = [
  'openai-codex',
  'anthropic',
  'google-antigravity',
  'kilo',
] as const;
export type OpenClawProvider = (typeof OPENCLAW_PROVIDERS)[number];

export const OPENCLAW_OAUTH_ACCESS_SCOPES = ['personal', 'service'] as const;
export type OpenClawOAuthAccessScope = (typeof OPENCLAW_OAUTH_ACCESS_SCOPES)[number];

export class UpsertOpenClawOAuthBindingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tenantId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(128)
  service!: string;

  @IsString()
  @IsIn(OPENCLAW_PROVIDERS)
  provider!: OpenClawProvider;

  @IsString()
  @MinLength(8)
  @MaxLength(8192)
  accessToken!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(8192)
  refreshToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  googleEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  googleProjectId?: string;

  @IsOptional()
  @IsString()
  @IsIn(OPENCLAW_OAUTH_ACCESS_SCOPES)
  accessScope?: OpenClawOAuthAccessScope;

  @IsOptional()
  @IsBoolean()
  teamWideApproved?: boolean;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  primaryModel!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(512)
  fallbackModels!: string;
}

export class ExecuteOpenClawOAuthBindingDto {
  @IsOptional()
  @IsBoolean()
  waitForSuccess?: boolean;

  @IsOptional()
  @Min(10)
  timeoutSeconds?: number;
}
