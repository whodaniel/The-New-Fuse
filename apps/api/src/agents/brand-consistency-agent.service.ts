/**
 * Brand Consistency Self-Improving Agent
 *
 * This agent is responsible for maintaining and improving brand consistency
 * across all pages and networked components of The New Fuse platform.
 *
 * It uses the Three Pillars:
 * - Orchestrator: Registers itself and receives tasks
 * - Message Broker: Communicates with other agents
 * - Prompt Templating: Modifies its own prompts based on learned patterns
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@the-new-fuse/database';

// Agent Configuration
export interface BrandConsistencyConfig {
  // Core brand tokens
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;

  // Typography
  fontFamily: string;
  headingFont: string;
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };

  // Spacing
  spacingUnit: number;
  borderRadius: string;

  // Component patterns
  buttonStyles: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    ghost: Record<string, string>;
  };

  // Animation preferences
  animationDuration: string;
  animationEasing: string;
}

// Analysis result for a component
export interface ComponentAnalysis {
  componentPath: string;
  componentName: string;
  issues: BrandIssue[];
  suggestions: BrandSuggestion[];
  consistencyScore: number;
  lastAnalyzed: Date;
}

export interface BrandIssue {
  type: 'color' | 'typography' | 'spacing' | 'animation' | 'pattern';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  location: string;
  currentValue: string;
  expectedValue: string;
}

export interface BrandSuggestion {
  type: 'fix' | 'enhancement' | 'refactor';
  description: string;
  code: string;
  impact: 'high' | 'medium' | 'low';
}

// Agent's self-improvement state
export interface AgentLearningState {
  totalAnalyses: number;
  successfulFixes: number;
  patternsLearned: string[];
  promptEvolutions: number;
  currentPromptVersion: number;
  lastImprovement: Date;
  performanceMetrics: {
    averageAnalysisTime: number;
    issueDetectionAccuracy: number;
    fixSuccessRate: number;
  };
}

@Injectable()
export class BrandConsistencyAgentService implements OnModuleInit {
  private readonly logger = new Logger(BrandConsistencyAgentService.name);

  // Agent identification
  private readonly agentId = 'brand-consistency-agent';
  private readonly agentName = 'BrandConsistencyGuardian';
  private readonly agentVersion = '1.0.0';

  // Brand configuration (TNF Design System)
  private brandConfig: BrandConsistencyConfig = {
    primaryColor: '#6366f1',      // Indigo
    secondaryColor: '#8b5cf6',    // Purple
    accentColor: '#06b6d4',       // Cyan
    backgroundColor: '#0f172a',   // Slate-900
    textColor: '#f8fafc',         // Slate-50

    fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
    headingFont: "'Outfit', 'Inter', sans-serif",
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    },

    spacingUnit: 4,
    borderRadius: '0.5rem',

    buttonStyles: {
      primary: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: '600'
      },
      secondary: {
        background: 'transparent',
        color: '#6366f1',
        border: '2px solid #6366f1',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem'
      },
      ghost: {
        background: 'transparent',
        color: '#94a3b8',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem'
      }
    },

    animationDuration: '200ms',
    animationEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Learning state
  private learningState: AgentLearningState = {
    totalAnalyses: 0,
    successfulFixes: 0,
    patternsLearned: [],
    promptEvolutions: 0,
    currentPromptVersion: 1,
    lastImprovement: new Date(),
    performanceMetrics: {
      averageAnalysisTime: 0,
      issueDetectionAccuracy: 0.85,
      fixSuccessRate: 0
    }
  };

  // Analysis cache
  private analysisCache = new Map<string, ComponentAnalysis>();

  // Core prompt template (will evolve through self-improvement)
  private corePrompt = `You are the Brand Consistency Guardian for The New Fuse platform.

Your mission is to ensure visual and functional consistency across all UI components.

BRAND TOKENS:
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)
- Accent: #06b6d4 (Cyan)
- Background: #0f172a (Dark Slate)
- Text: #f8fafc (Light)

TYPOGRAPHY:
- Body: Inter, Segoe UI, Roboto
- Headings: Outfit, Inter

PATTERNS TO ENFORCE:
1. Gradient buttons for primary actions
2. Consistent border-radius (0.5rem)
3. Smooth 200ms transitions
4. Glassmorphism for cards
5. Consistent spacing (4px unit)

RULES:
- Flag any hardcoded colors not matching brand tokens
- Ensure all animations use the standard easing
- Check for accessibility contrast ratios
- Identify inconsistent component patterns`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    this.logger.log(`${this.agentName} v${this.agentVersion} initializing...`);

    // Initialize the agent's prompt in the database
    await this.initializePromptTemplate();

    // Emit ready event
    this.eventEmitter.emit('agent.ready', {
      agentId: this.agentId,
      agentName: this.agentName,
      capabilities: ['brand-analysis', 'style-enforcement', 'self-improvement']
    });

    this.logger.log(`${this.agentName} initialized and ready`);
  }

  /**
   * Initialize the agent's prompt template in the database
   */
  private async initializePromptTemplate(): Promise<void> {
    try {
      // Check if prompt template exists
      const existing = await this.prisma.promptTemplate.findFirst({
        where: { name: `${this.agentName}-CorePrompt` }
      });

      if (!existing) {
        // Create initial prompt template
        await this.prisma.promptTemplate.create({
          data: {
            name: `${this.agentName}-CorePrompt`,
            description: 'Core prompt for the Brand Consistency Agent',
            category: 'Agent-System',
            isPublic: false,
            tags: ['agent', 'brand', 'self-improving'],
            analytics: {},
            versions: {
              create: {
                version: 1,
                content: this.corePrompt,
                label: 'Genesis',
                variables: {},
                changelog: 'Initial prompt creation',
                isActive: true
              }
            }
          }
        });
        this.logger.log('Created initial prompt template');
      } else {
        // Load the latest version
        const latestVersion = await this.prisma.promptVersion.findFirst({
          where: { templateId: existing.id },
          orderBy: { version: 'desc' }
        });
        if (latestVersion) {
          this.corePrompt = latestVersion.content;
          this.learningState.currentPromptVersion = latestVersion.version;
        }
        this.logger.log(`Loaded prompt template v${this.learningState.currentPromptVersion}`);
      }
    } catch (error) {
      this.logger.warn('Could not initialize prompt template in database, using default');
    }
  }

  /**
   * Get agent information
   */
  getAgentInfo() {
    return {
      id: this.agentId,
      name: this.agentName,
      version: this.agentVersion,
      capabilities: ['brand-analysis', 'style-enforcement', 'self-improvement'],
      status: 'active',
      learningState: this.learningState,
      brandConfig: this.brandConfig
    };
  }

  /**
   * Analyze a component for brand consistency
   */
  async analyzeComponent(componentPath: string, componentCode: string): Promise<ComponentAnalysis> {
    const startTime = Date.now();
    this.logger.log(`Analyzing component: ${componentPath}`);

    const issues: BrandIssue[] = [];
    const suggestions: BrandSuggestion[] = [];

    // Color consistency checks
    this.checkColorConsistency(componentCode, issues);

    // Typography checks
    this.checkTypographyConsistency(componentCode, issues);

    // Spacing checks
    this.checkSpacingConsistency(componentCode, issues);

    // Animation checks
    this.checkAnimationConsistency(componentCode, issues);

    // Pattern checks
    this.checkPatternConsistency(componentCode, issues, suggestions);

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(issues);

    const analysis: ComponentAnalysis = {
      componentPath,
      componentName: this.extractComponentName(componentPath),
      issues,
      suggestions,
      consistencyScore,
      lastAnalyzed: new Date()
    };

    // Update learning state
    this.learningState.totalAnalyses++;
    const analysisTime = Date.now() - startTime;
    this.learningState.performanceMetrics.averageAnalysisTime =
      (this.learningState.performanceMetrics.averageAnalysisTime * (this.learningState.totalAnalyses - 1) + analysisTime)
      / this.learningState.totalAnalyses;

    // Cache the analysis
    this.analysisCache.set(componentPath, analysis);

    // Emit analysis event
    this.eventEmitter.emit('brand.analysis.complete', {
      agentId: this.agentId,
      analysis,
      timestamp: new Date()
    });

    this.logger.log(`Analysis complete: ${consistencyScore.toFixed(0)}% consistent, ${issues.length} issues found`);

    return analysis;
  }

  /**
   * Check color consistency
   */
  private checkColorConsistency(code: string, issues: BrandIssue[]): void {
    // Find hardcoded hex colors
    const hexColorRegex = /#([0-9a-fA-F]{3}){1,2}\b/g;
    const matches = code.matchAll(hexColorRegex);

    const brandColors = [
      this.brandConfig.primaryColor.toLowerCase(),
      this.brandConfig.secondaryColor.toLowerCase(),
      this.brandConfig.accentColor.toLowerCase(),
      this.brandConfig.backgroundColor.toLowerCase(),
      this.brandConfig.textColor.toLowerCase(),
      '#ffffff', '#000000', '#f8fafc', '#94a3b8' // Common allowed colors
    ];

    for (const match of matches) {
      const color = match[0].toLowerCase();
      if (!brandColors.includes(color)) {
        issues.push({
          type: 'color',
          severity: 'major',
          description: `Hardcoded color ${color} not in brand palette`,
          location: `Position ${match.index}`,
          currentValue: color,
          expectedValue: this.findClosestBrandColor(color)
        });
      }
    }
  }

  /**
   * Check typography consistency
   */
  private checkTypographyConsistency(code: string, issues: BrandIssue[]): void {
    // Check for non-brand fonts
    const fontRegex = /font-family:\s*['"]?([^'";\n]+)['"]?/gi;
    const matches = code.matchAll(fontRegex);

    for (const match of matches) {
      const font = match[1].toLowerCase();
      if (!font.includes('inter') && !font.includes('outfit') && !font.includes('inherit')) {
        issues.push({
          type: 'typography',
          severity: 'minor',
          description: `Non-brand font detected: ${match[1]}`,
          location: `Position ${match.index}`,
          currentValue: match[1],
          expectedValue: this.brandConfig.fontFamily
        });
      }
    }

    // Check for arbitrary font sizes
    const sizeRegex = /font-size:\s*(\d+(?:\.\d+)?)(px|rem|em)/gi;
    const sizeMatches = code.matchAll(sizeRegex);
    const allowedSizes = Object.values(this.brandConfig.fontSizes);

    for (const match of sizeMatches) {
      const size = match[1] + match[2];
      if (!allowedSizes.includes(size) && match[2] === 'rem') {
        issues.push({
          type: 'typography',
          severity: 'minor',
          description: `Non-standard font size: ${size}`,
          location: `Position ${match.index}`,
          currentValue: size,
          expectedValue: 'Use brand scale (xs-3xl)'
        });
      }
    }
  }

  /**
   * Check spacing consistency
   */
  private checkSpacingConsistency(code: string, issues: BrandIssue[]): void {
    // Check for non-4px-based spacing
    const spacingRegex = /(?:margin|padding|gap):\s*(\d+)px/gi;
    const matches = code.matchAll(spacingRegex);

    for (const match of matches) {
      const value = parseInt(match[1]);
      if (value % this.brandConfig.spacingUnit !== 0 && value > 2) {
        issues.push({
          type: 'spacing',
          severity: 'minor',
          description: `Spacing ${value}px not on ${this.brandConfig.spacingUnit}px grid`,
          location: `Position ${match.index}`,
          currentValue: `${value}px`,
          expectedValue: `${Math.round(value / this.brandConfig.spacingUnit) * this.brandConfig.spacingUnit}px`
        });
      }
    }
  }

  /**
   * Check animation consistency
   */
  private checkAnimationConsistency(code: string, issues: BrandIssue[]): void {
    // Check transition durations
    const transitionRegex = /transition[^:]*:\s*[^;]*(\d+(?:\.\d+)?)(ms|s)/gi;
    const matches = code.matchAll(transitionRegex);

    for (const match of matches) {
      const duration = match[2] === 's' ? parseFloat(match[1]) * 1000 : parseFloat(match[1]);
      if (duration !== 200 && duration !== 150 && duration !== 300) {
        issues.push({
          type: 'animation',
          severity: 'minor',
          description: `Non-standard transition duration: ${duration}ms`,
          location: `Position ${match.index}`,
          currentValue: `${duration}ms`,
          expectedValue: this.brandConfig.animationDuration
        });
      }
    }
  }

  /**
   * Check pattern consistency (buttons, cards, etc.)
   */
  private checkPatternConsistency(code: string, issues: BrandIssue[], suggestions: BrandSuggestion[]): void {
    // Check for gradient usage in buttons
    if (code.includes('button') || code.includes('Button')) {
      if (!code.includes('gradient') && code.includes('background')) {
        suggestions.push({
          type: 'enhancement',
          description: 'Consider using gradient for primary buttons',
          code: `background: linear-gradient(135deg, ${this.brandConfig.primaryColor}, ${this.brandConfig.secondaryColor})`,
          impact: 'medium'
        });
      }
    }

    // Check for glassmorphism in cards
    if (code.includes('card') || code.includes('Card')) {
      if (!code.includes('backdrop-filter') && !code.includes('glass')) {
        suggestions.push({
          type: 'enhancement',
          description: 'Consider adding glassmorphism effect to cards',
          code: 'backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1);',
          impact: 'low'
        });
      }
    }

    // Check border-radius consistency
    const radiusRegex = /border-radius:\s*(\d+(?:\.\d+)?)(px|rem)/gi;
    const radiusMatches = code.matchAll(radiusRegex);

    for (const match of radiusMatches) {
      if (match[2] === 'rem' && match[1] !== '0.5' && match[1] !== '0.25' && match[1] !== '1') {
        issues.push({
          type: 'pattern',
          severity: 'minor',
          description: `Non-standard border-radius: ${match[1]}${match[2]}`,
          location: `Position ${match.index}`,
          currentValue: `${match[1]}${match[2]}`,
          expectedValue: this.brandConfig.borderRadius
        });
      }
    }
  }

  /**
   * Find the closest brand color to a given color
   */
  private findClosestBrandColor(color: string): string {
    // Simplified - just return primary for now
    // In a real implementation, calculate color distance
    return this.brandConfig.primaryColor;
  }

  /**
   * Calculate consistency score based on issues
   */
  private calculateConsistencyScore(issues: BrandIssue[]): number {
    if (issues.length === 0) return 100;

    let deductions = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': deductions += 15; break;
        case 'major': deductions += 8; break;
        case 'minor': deductions += 3; break;
      }
    }

    return Math.max(0, 100 - deductions);
  }

  /**
   * Extract component name from path
   */
  private extractComponentName(path: string): string {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(tsx?|jsx?)$/, '');
  }

  /**
   * Self-improve the agent's prompt based on learned patterns
   */
  async selfImprove(feedback: {
    issueType: string;
    wasHelpful: boolean;
    learnedPattern?: string;
  }): Promise<void> {
    this.logger.log('Self-improvement triggered');

    if (feedback.wasHelpful && feedback.learnedPattern) {
      // Add to learned patterns
      if (!this.learningState.patternsLearned.includes(feedback.learnedPattern)) {
        this.learningState.patternsLearned.push(feedback.learnedPattern);
      }

      // Update success metrics
      this.learningState.successfulFixes++;
      this.learningState.performanceMetrics.fixSuccessRate =
        this.learningState.successfulFixes / this.learningState.totalAnalyses;

      // Evolve prompt if enough patterns learned
      if (this.learningState.patternsLearned.length % 5 === 0) {
        await this.evolvePrompt();
      }
    } else {
      // Learn from failure - adjust detection accuracy estimate
      this.learningState.performanceMetrics.issueDetectionAccuracy *= 0.99;
    }

    this.learningState.lastImprovement = new Date();

    // Emit improvement event
    this.eventEmitter.emit('agent.improved', {
      agentId: this.agentId,
      learningState: this.learningState,
      timestamp: new Date()
    });
  }

  /**
   * Evolve the core prompt with learned patterns
   */
  private async evolvePrompt(): Promise<void> {
    this.logger.log('Evolving prompt with learned patterns');

    const newPatterns = this.learningState.patternsLearned.slice(-5).join('\n- ');
    const evolvedPrompt = `${this.corePrompt}

LEARNED PATTERNS (Auto-discovered):
- ${newPatterns}

PERFORMANCE INSIGHTS:
- Detection Accuracy: ${(this.learningState.performanceMetrics.issueDetectionAccuracy * 100).toFixed(1)}%
- Fix Success Rate: ${(this.learningState.performanceMetrics.fixSuccessRate * 100).toFixed(1)}%
- Total Analyses: ${this.learningState.totalAnalyses}`;

    try {
      // Save new version to database
      const template = await this.prisma.promptTemplate.findFirst({
        where: { name: `${this.agentName}-CorePrompt` }
      });

      if (template) {
        const newVersion = this.learningState.currentPromptVersion + 1;
        await this.prisma.promptVersion.create({
          data: {
            templateId: template.id,
            version: newVersion,
            content: evolvedPrompt,
            label: `Evolution-${newVersion}`,
            variables: {},
            changelog: `Auto-evolved with ${this.learningState.patternsLearned.length} learned patterns`,
            isActive: true
          }
        });

        this.corePrompt = evolvedPrompt;
        this.learningState.currentPromptVersion = newVersion;
        this.learningState.promptEvolutions++;

        this.logger.log(`Prompt evolved to version ${newVersion}`);
      }
    } catch (error) {
      this.logger.warn('Could not save evolved prompt to database');
    }
  }

  /**
   * Get analysis summary across all cached components
   */
  getAnalysisSummary() {
    const analyses = Array.from(this.analysisCache.values());

    if (analyses.length === 0) {
      return {
        totalComponents: 0,
        averageConsistency: 0,
        issuesByType: {},
        criticalIssues: 0,
        suggestions: []
      };
    }

    const issuesByType: Record<string, number> = {};
    let criticalIssues = 0;
    const allSuggestions: BrandSuggestion[] = [];

    for (const analysis of analyses) {
      for (const issue of analysis.issues) {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        if (issue.severity === 'critical') criticalIssues++;
      }
      allSuggestions.push(...analysis.suggestions);
    }

    return {
      totalComponents: analyses.length,
      averageConsistency: analyses.reduce((sum, a) => sum + a.consistencyScore, 0) / analyses.length,
      issuesByType,
      criticalIssues,
      suggestions: allSuggestions.slice(0, 10) // Top 10 suggestions
    };
  }

  /**
   * Generate CSS variables for brand consistency
   */
  generateBrandCSS(): string {
    return `:root {
  /* Colors */
  --tnf-primary: ${this.brandConfig.primaryColor};
  --tnf-secondary: ${this.brandConfig.secondaryColor};
  --tnf-accent: ${this.brandConfig.accentColor};
  --tnf-background: ${this.brandConfig.backgroundColor};
  --tnf-text: ${this.brandConfig.textColor};

  /* Typography */
  --tnf-font-family: ${this.brandConfig.fontFamily};
  --tnf-heading-font: ${this.brandConfig.headingFont};
  --tnf-font-xs: ${this.brandConfig.fontSizes.xs};
  --tnf-font-sm: ${this.brandConfig.fontSizes.sm};
  --tnf-font-base: ${this.brandConfig.fontSizes.base};
  --tnf-font-lg: ${this.brandConfig.fontSizes.lg};
  --tnf-font-xl: ${this.brandConfig.fontSizes.xl};
  --tnf-font-2xl: ${this.brandConfig.fontSizes['2xl']};
  --tnf-font-3xl: ${this.brandConfig.fontSizes['3xl']};

  /* Spacing */
  --tnf-spacing-unit: ${this.brandConfig.spacingUnit}px;
  --tnf-border-radius: ${this.brandConfig.borderRadius};

  /* Animation */
  --tnf-animation-duration: ${this.brandConfig.animationDuration};
  --tnf-animation-easing: ${this.brandConfig.animationEasing};

  /* Gradients */
  --tnf-gradient-primary: linear-gradient(135deg, var(--tnf-primary), var(--tnf-secondary));
  --tnf-gradient-accent: linear-gradient(135deg, var(--tnf-secondary), var(--tnf-accent));
}

/* Button Styles */
.tnf-btn-primary {
  background: var(--tnf-gradient-primary);
  color: white;
  border-radius: var(--tnf-border-radius);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all var(--tnf-animation-duration) var(--tnf-animation-easing);
}

.tnf-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.tnf-btn-secondary {
  background: transparent;
  color: var(--tnf-primary);
  border: 2px solid var(--tnf-primary);
  border-radius: var(--tnf-border-radius);
  padding: 0.75rem 1.5rem;
  transition: all var(--tnf-animation-duration) var(--tnf-animation-easing);
}

.tnf-btn-secondary:hover {
  background: var(--tnf-primary);
  color: white;
}

/* Card Styles */
.tnf-card {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--tnf-border-radius);
  transition: all var(--tnf-animation-duration) var(--tnf-animation-easing);
}

.tnf-card:hover {
  border-color: var(--tnf-primary);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}`;
  }
}
