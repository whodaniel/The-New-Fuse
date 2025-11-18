import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentRegistrationResponseDto {
  @ApiProperty({ description: 'Registration ID' })
  registrationId: string;

  @ApiProperty({ description: 'Agent ID' })
  agentId: string;

  @ApiProperty({ description: 'Authentication token for agent' })
  authToken: string;

  @ApiProperty({ description: 'Verification status', enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'REJECTED'] })
  verificationStatus: string;

  @ApiProperty({ description: 'Onboarding status', enum: ['INITIALIZED', 'WELCOME_SENT', 'CAPABILITIES_TESTED', 'ORIENTATION_IN_PROGRESS', 'ORIENTATION_COMPLETED', 'INTEGRATION_TESTING', 'READY', 'FAILED'] })
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
