import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsNumber, 
  IsObject, 
  ValidateNested,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgencySubscriptionTier, AgencyStatus, UserRole } from '@prisma/client';

export class CreateAgencyDto {
  @ApiProperty({ description: 'Agency name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Agency subdomain (will be used for agency1.thenewfuse.com)' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' })
  subdomain: string;

  @ApiPropertyOptional({ description: 'Agency description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: AgencySubscriptionTier, description: 'Initial subscription tier' })
  @IsEnum(AgencySubscriptionTier)
  subscriptionTier: AgencySubscriptionTier;

  @ApiProperty({ description: 'Admin user email' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ description: 'Admin user full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminName: string;

  @ApiPropertyOptional({ description: 'Template to apply to the new agency' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiPropertyOptional({ description: 'Custom agency settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateAgencyDto {
  @ApiPropertyOptional({ description: 'Agency name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Agency description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Agency subdomain' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' })
  subdomain?: string;

  @ApiPropertyOptional({ enum: AgencyStatus, description: 'Agency status' })
  @IsOptional()
  @IsEnum(AgencyStatus)
  status?: AgencyStatus;

  @ApiPropertyOptional({ description: 'Agency settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class AgencyResponseDto {
  @ApiProperty({ description: 'Agency data' })
  agency: {
    id: string;
    name: string;
    subdomain: string;
    description?: string;
    status: AgencyStatus;
    subscriptionTier: AgencySubscriptionTier;
    createdAt: Date;
    updatedAt: Date;
    settings: Record<string, any>;
    _count?: {
      users: number;
      agents: number;
      workspaces: number;
    };
  };

  @ApiProperty({ description: 'Response message' })
  message: string;
}

export class AgencyListResponseDto {
  @ApiProperty({ description: 'List of agencies' })
  agencies: Array<{
    id: string;
    name: string;
    subdomain: string;
    description?: string;
    status: AgencyStatus;
    subscriptionTier: AgencySubscriptionTier;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      users: number;
      agents: number;
      workspaces: number;
    };
  }>;

  @ApiProperty({ description: 'Total count of agencies' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class ApplyTemplateDto {
  @ApiProperty({ description: 'Template name to apply' })
  @IsString()
  templateName: string;

  @ApiPropertyOptional({ description: 'Override template settings' })
  @IsOptional()
  @IsObject()
  overrides?: Record<string, any>;
}

export class AgencyStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Total number of agents' })
  totalAgents: number;

  @ApiProperty({ description: 'Total number of workspaces' })
  totalWorkspaces: number;

  @ApiProperty({ description: 'Total number of chats this month' })
  monthlyChats: number;

  @ApiProperty({ description: 'Total API calls this month' })
  monthlyApiCalls: number;

  @ApiProperty({ description: 'Storage used in MB' })
  storageUsedMB: number;

  @ApiProperty({ description: 'Agency subscription tier' })
  subscriptionTier: AgencySubscriptionTier;

  @ApiProperty({ description: 'Agency status' })
  status: AgencyStatus;

  @ApiProperty({ description: 'Usage limits for current tier' })
  limits: {
    maxUsers: number;
    maxAgents: number;
    maxWorkspaces: number;
    maxMonthlyChats: number;
    maxFileSize: number;
  };

  @ApiProperty({ description: 'Usage percentages' })
  usagePercentages: {
    users: number;
    agents: number;
    workspaces: number;
    monthlyChats: number;
    storage: number;
  };
}

export class AgencyUsageDto {
  @ApiProperty({ description: 'Agency ID' })
  agencyId: string;

  @ApiProperty({ description: 'Usage period start date' })
  startDate: Date;

  @ApiProperty({ description: 'Usage period end date' })
  endDate: Date;

  @ApiProperty({ description: 'Chat usage metrics' })
  chatUsage: {
    totalChats: number;
    dailyChats: Array<{
      date: string;
      count: number;
    }>;
    topAgents: Array<{
      agentId: string;
      agentName: string;
      chatCount: number;
    }>;
  };

  @ApiProperty({ description: 'API usage metrics' })
  apiUsage: {
    totalCalls: number;
    dailyCalls: Array<{
      date: string;
      count: number;
    }>;
    topEndpoints: Array<{
      endpoint: string;
      callCount: number;
    }>;
  };

  @ApiProperty({ description: 'Storage usage metrics' })
  storageUsage: {
    totalSizeMB: number;
    fileCount: number;
    dailyGrowth: Array<{
      date: string;
      sizeMB: number;
    }>;
    fileTypes: Array<{
      type: string;
      count: number;
      sizeMB: number;
    }>;
  };

  @ApiProperty({ description: 'User activity metrics' })
  userActivity: {
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    dailyActivity: Array<{
      date: string;
      activeUsers: number;
      sessions: number;
    }>;
  };
}

export class AgencySubscriptionDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Agency ID' })
  agencyId: string;

  @ApiProperty({ enum: AgencySubscriptionTier, description: 'Subscription tier' })
  tier: AgencySubscriptionTier;

  @ApiProperty({ description: 'Monthly price in cents' })
  monthlyPrice: number;

  @ApiProperty({ description: 'Current billing cycle start' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current billing cycle end' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Whether subscription is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Auto-renewal status' })
  autoRenew: boolean;

  @ApiProperty({ description: 'Next billing date' })
  nextBillingDate: Date;

  @ApiPropertyOptional({ description: 'Stripe subscription ID' })
  @IsOptional()
  stripeSubscriptionId?: string;

  @ApiProperty({ description: 'Subscription features' })
  features: {
    maxUsers: number;
    maxAgents: number;
    maxWorkspaces: number;
    maxMonthlyChats: number;
    maxFileSize: number;
    apiAccess: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    prioritySupport: boolean;
    ssoIntegration: boolean;
    advancedAnalytics: boolean;
  };

  @ApiProperty({ description: 'Usage limits' })
  usage: {
    users: number;
    agents: number;
    workspaces: number;
    monthlyChats: number;
    storageUsedMB: number;
  };
}

export class InviteUserDto {
  @ApiProperty({ description: 'Email address of user to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, description: 'Role to assign to invited user' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Personal message to include in invitation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ description: 'Auto-accept invitation (for master admin use)' })
  @IsOptional()
  @IsBoolean()
  autoAccept?: boolean;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, description: 'New role for the user' })
  @IsEnum(UserRole)
  role: UserRole;
}

export class SubdomainAvailabilityDto {
  @ApiProperty({ description: 'Whether the subdomain is available' })
  available: boolean;

  @ApiPropertyOptional({ description: 'Suggested alternative subdomains if not available' })
  @IsOptional()
  suggestions?: string[];

  @ApiPropertyOptional({ description: 'Reason why subdomain is not available' })
  @IsOptional()
  reason?: string;
}

export class AgencyBrandingDto {
  @ApiPropertyOptional({ description: 'Primary brand color (hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Primary color must be a valid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color (hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Secondary color must be a valid hex color' })
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Custom CSS overrides' })
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiPropertyOptional({ description: 'Custom domain name' })
  @IsOptional()
  @IsString()
  customDomain?: string;
}

export class AgencyFeatureToggleDto {
  @ApiProperty({ description: 'Feature name' })
  @IsString()
  featureName: string;

  @ApiProperty({ description: 'Whether feature is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Feature configuration' })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;
}

export class AgencyAuditLogDto {
  @ApiProperty({ description: 'Audit log entries' })
  logs: Array<{
    id: string;
    action: string;
    actor: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
    target: {
      type: string;
      id: string;
      name?: string;
    };
    changes: Record<string, any>;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }>;

  @ApiProperty({ description: 'Total count of audit logs' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}
