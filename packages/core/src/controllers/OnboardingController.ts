import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '../utils/logger.js';
import { UserTypeDetectionService, UserType } from '../services/UserTypeDetectionService.js';
import { AuthGuard } from '../guards/auth.guard.js';

/**
 * Controller for handling onboarding processes
 */
@Controller('api/onboarding')
export class OnboardingController {
  private logger = new Logger(OnboardingController.name);

  constructor(
    private readonly userTypeDetectionService: UserTypeDetectionService
  ) {}

  /**
   * Start the onboarding process
   * This endpoint detects the user type and redirects to the appropriate onboarding flow
   */
  @Post('start')
  async startOnboarding(@Req() req: Request, @Res() res: Response) {
    try {
      // Detect user type
      const userType = this.userTypeDetectionService.detectUserType({
        headers: req.headers as Record<string, string>,
        authMethod: this.getAuthMethod(req),
        userAgent: req.headers['user-agent'],
        hasInteractiveSession: !!req.headers['cookie']
      });

      this.logger.info('Starting onboarding process', { userType });

      // Redirect to appropriate onboarding flow
      if (userType === UserType.AI_AGENT) {
        return res.status(200).json({
          userType,
          nextStep: 'ai-agent-registration',
          message: 'AI agent detected. Please proceed with agent registration.'
        });
      } else {
        return res.status(200).json({
          userType: userType === UserType.UNKNOWN ? UserType.HUMAN : userType,
          nextStep: 'human-onboarding',
          message: 'Human user detected. Please proceed with human onboarding.'
        });
      }
    } catch (error) {
      this.logger.error('Error starting onboarding process', error);
      return res.status(500).json({
        error: 'Failed to start onboarding process',
        message: error.message
      });
    }
  }

  /**
   * Human onboarding flow
   */
  @Post('human')
  @UseGuards(AuthGuard)
  async humanOnboarding(@Body() data: any, @Req() req: Request) {
    this.logger.info('Processing human onboarding', { userId: req.user?.id });
    
    // Process human onboarding data
    return {
      success: true,
      nextStep: data.currentStep === 'final' ? 'complete' : data.nextStep,
      message: 'Human onboarding step processed successfully'
    };
  }

  /**
   * AI agent registration flow
   */
  @Post('ai-agent-registration')
  async aiAgentRegistration(@Body() data: AgentRegistrationDto) {
    this.logger.info('Processing AI agent registration', { agentId: data.agentId });
    
    // Validate agent registration data
    if (!data.agentId || !data.capabilities || !data.apiVersion) {
      throw new Error('Invalid agent registration data');
    }
    
    // Process agent registration
    return {
      success: true,
      agentId: data.agentId,
      message: 'AI agent registered successfully',
      accessToken: 'sample-token-' + Date.now() // In production, generate a real token
    };
  }

  /**
   * Get agent capabilities assessment
   */
  @Get('ai-agent-capabilities-assessment')
  async getCapabilitiesAssessment() {
    return {
      assessmentId: 'cap-' + Date.now(),
      capabilities: [
        {
          name: 'file-management',
          description: 'Ability to manage files (read, write, delete)',
          testEndpoint: '/api/test/file-management'
        },
        {
          name: 'process-management',
          description: 'Ability to manage processes (start, stop, monitor)',
          testEndpoint: '/api/test/process-management'
        },
        {
          name: 'web-interaction',
          description: 'Ability to interact with web resources',
          testEndpoint: '/api/test/web-interaction'
        },
        {
          name: 'code-analysis',
          description: 'Ability to analyze code',
          testEndpoint: '/api/test/code-analysis'
        },
        {
          name: 'api-integration',
          description: 'Ability to integrate with external APIs',
          testEndpoint: '/api/test/api-integration'
        }
      ]
    };
  }

  /**
   * Submit agent capabilities assessment
   */
  @Post('ai-agent-capabilities-assessment')
  async submitCapabilitiesAssessment(@Body() data: CapabilitiesAssessmentDto) {
    this.logger.info('Processing AI agent capabilities assessment', { 
      agentId: data.agentId,
      assessmentId: data.assessmentId
    });
    
    // Process capabilities assessment
    return {
      success: true,
      agentId: data.agentId,
      capabilities: data.capabilities,
      message: 'AI agent capabilities assessment processed successfully'
    };
  }

  /**
   * Get auth method from request
   */
  private getAuthMethod(req: Request): 'api_key' | 'oauth' | 'password' | 'none' {
    if (req.headers['x-api-key']) {
      return 'api_key';
    }
    
    if (req.headers['authorization']?.startsWith('Bearer ')) {
      return 'oauth';
    }
    
    if (req.body?.username && req.body?.password) {
      return 'password';
    }
    
    return 'none';
  }
}

/**
 * Agent registration DTO
 */
export interface AgentRegistrationDto {
  agentId: string;
  name: string;
  description?: string;
  capabilities: string[];
  apiVersion: string;
  metadata?: Record<string, any>;
}

/**
 * Capabilities assessment DTO
 */
export interface CapabilitiesAssessmentDto {
  agentId: string;
  assessmentId: string;
  capabilities: {
    name: string;
    supported: boolean;
    testResults?: any;
  }[];
}
