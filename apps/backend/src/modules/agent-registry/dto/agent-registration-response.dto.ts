import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentRegistrationResponseDto {
  @ApiProperty({ description: 'Registration ID' })
  registrationId: string;

  @ApiProperty({ description: 'Agent ID' })
  agentId: string;

  @ApiProperty({ description: 'Authentication token for agent' })
  authToken: string;

  @ApiProperty({
    description: 'Verification status',
    enum: ['INVITED', 'PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'REJECTED'],
  })
  verificationStatus: string;

  @ApiProperty({
    description: 'Onboarding status',
    enum: [
      'INITIALIZED',
      'WELCOME_SENT',
      'CAPABILITIES_TESTED',
      'ORIENTATION_IN_PROGRESS',
      'ORIENTATION_COMPLETED',
      'INTEGRATION_TESTING',
      'READY',
      'FAILED',
    ],
  })
  onboardingStatus: string;

  @ApiProperty({ description: 'Welcome message for the agent' })
  welcomeMessage: string;

  @ApiProperty({ description: 'Next steps for the agent', type: [String] })
  nextSteps: string[];

  @ApiPropertyOptional({ description: 'Onboarding URL' })
  onboardingUrl?: string;

  @ApiProperty({ description: 'Registration timestamp' })
  createdAt: Date;
}

export class AgentRegistrationReportDto {
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

export class WelcomeMessageDto {
  @ApiProperty({ description: 'Welcome title' })
  title: string;

  @ApiProperty({ description: 'Welcome message' })
  message: string;

  @ApiProperty({ description: 'System overview' })
  systemOverview: {
    name: string;
    version: string;
    description: string;
    capabilities: string[];
  };

  @ApiProperty({ description: 'Available resources', type: 'object' })
  resources: {
    documentation: string;
    apiReference: string;
    support: string;
  };
}
