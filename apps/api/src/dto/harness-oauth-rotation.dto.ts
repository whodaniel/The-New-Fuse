import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export const HARNESS_OAUTH_PROVIDERS = [
  'openai-codex',
  'anthropic',
  'google-antigravity',
  'kilo',
] as const;
export type HarnessOAuthProvider = (typeof HARNESS_OAUTH_PROVIDERS)[number];

export const HARNESS_OAUTH_ACCESS_SCOPES = ['personal', 'service'] as const;
export type HarnessOAuthAccessScope = (typeof HARNESS_OAUTH_ACCESS_SCOPES)[number];

export class UpsertHarnessOAuthBindingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tenantId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(128)
  service!: string;

  @IsString()
  @IsIn(HARNESS_OAUTH_PROVIDERS)
  provider!: HarnessOAuthProvider;

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
  @IsIn(HARNESS_OAUTH_ACCESS_SCOPES)
  accessScope?: HarnessOAuthAccessScope;

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

export class ExecuteHarnessOAuthBindingDto {
  @IsOptional()
  @IsBoolean()
  waitForSuccess?: boolean;

  @IsOptional()
  @Min(10)
  timeoutSeconds?: number;
}
