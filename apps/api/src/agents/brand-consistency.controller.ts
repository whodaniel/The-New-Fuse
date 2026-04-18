/**
 * Brand Consistency Agent Controller
 *
 * Exposes REST endpoints for the self-improving Brand Consistency Agent.
 * This agent analyzes components for brand consistency and evolves its
 * detection capabilities over time.
 */

import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AuthLevel, RequireAuthLevel } from '../guards/secure-auth.guard.js';
import { BrandConsistencyAgentService } from './brand-consistency-agent.service.js';

@Controller('agents/brand-consistency')
@RequireAuthLevel(AuthLevel.USER)
export class BrandConsistencyController {
  private readonly logger = new Logger(BrandConsistencyController.name);

  constructor(private readonly agentService: BrandConsistencyAgentService) {}

  /**
   * Get agent information and current state
   */
  @Get('info')
  getAgentInfo() {
    return this.agentService.getAgentInfo();
  }

  /**
   * Analyze a component for brand consistency
   */
  @Post('analyze')
  async analyzeComponent(@Body() body: { componentPath: string; componentCode: string }) {
    this.logger.log(`Analyzing component: ${body.componentPath}`);
    return this.agentService.analyzeComponent(body.componentPath, body.componentCode);
  }

  /**
   * Provide feedback for self-improvement
   */
  @Post('feedback')
  async provideFeedback(
    @Body() body: { issueType: string; wasHelpful: boolean; learnedPattern?: string }
  ) {
    await this.agentService.selfImprove(body);
    return { success: true, message: 'Feedback processed for self-improvement' };
  }

  /**
   * Get analysis summary across all analyzed components
   */
  @Get('summary')
  getAnalysisSummary() {
    return this.agentService.getAnalysisSummary();
  }

  /**
   * Generate brand CSS variables and utilities
   */
  @Get('brand-css')
  getBrandCSS() {
    return {
      css: this.agentService.generateBrandCSS(),
      contentType: 'text/css',
    };
  }

  /**
   * Analyze multiple components at once
   */
  @Post('analyze-batch')
  async analyzeBatch(@Body() body: { components: Array<{ path: string; code: string }> }) {
    const results: any[] = [];

    for (const component of body.components) {
      const analysis = await this.agentService.analyzeComponent(component.path, component.code);
      results.push(analysis);
    }

    return {
      totalComponents: results.length,
      results,
      summary: this.agentService.getAnalysisSummary(),
    };
  }

  /**
   * Run a demonstration of the agent's capabilities
   */
  @Post('demo')
  async runDemo() {
    this.logger.log('Running Brand Consistency Agent Demo');

    // Sample component code with various brand issues
    const sampleCode = `
// Sample React Component with brand inconsistencies
import React from 'react';

const DemoCard = () => {
  return (
    <div style={{
      background: '#1a1a2e',       // Non-brand background color
      borderRadius: '8px',         // Should be 0.5rem
      padding: '15px',             // Not on 4px grid
      fontFamily: 'Arial',         // Non-brand font
      transition: 'all 0.3s ease'  // Non-standard duration
    }}>
      <h2 style={{
        color: '#e94560',          // Non-brand color
        fontSize: '24px'           // Should use rem scale
      }}>
        Demo Title
      </h2>
      <button style={{
        background: '#16213e',     // Should use gradient
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px'
      }}>
        Click Me
      </button>
    </div>
  );
};

export default DemoCard;
    `.trim();

    // Analyze the sample
    const analysis = await this.agentService.analyzeComponent(
      'src/components/DemoCard.tsx',
      sampleCode
    );

    // Simulate learning from the analysis
    await this.agentService.selfImprove({
      issueType: 'color',
      wasHelpful: true,
      learnedPattern: 'Detect non-brand gradient backgrounds in buttons',
    });

    return {
      message: 'Brand Consistency Agent Demo Complete',
      analysis,
      agentInfo: this.agentService.getAgentInfo(),
      brandCSS: this.agentService.generateBrandCSS(),
    };
  }
}
