import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgencyRegistrationReportDto {
  @ApiProperty({ description: 'Registration ID' })
  id: string;

  @ApiProperty({ description: 'Agent ID' })
  agentId: string;

  @ApiPropertyOptional({ description: 'Tenant ID' })
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Agency ID' })
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Long-term identity ID' })
  identityLongTermId?: string;

  @ApiPropertyOptional({ description: 'Ephemeral identity ID' })
  identityEphemeralId?: string;

  @ApiPropertyOptional({ description: 'Federation identity ID' })
  identityFederationId?: string;

  @ApiPropertyOptional({ description: 'Protocol version' })
  protocolVersion?: string;

  @ApiPropertyOptional({ description: 'Trust tier' })
  trustTier?: string;

  @ApiPropertyOptional({ description: 'Invite ID' })
  inviteId?: string;

  @ApiProperty({ description: 'Verification status' })
  verificationStatus: string;

  @ApiProperty({ description: 'Onboarding status' })
  onboardingStatus: string;
}
