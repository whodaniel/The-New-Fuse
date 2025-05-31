# Complete Component Consolidation Guide

This comprehensive guide provides systematic approaches for consolidating duplicate components while preserving all valuable functionality.

## Table of Contents

1. [Consolidation Strategy](#consolidation-strategy)
2. [Feature Tracking System](#feature-tracking-system)
3. [Consolidation Workflow](#consolidation-workflow)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Testing and Validation](#testing-and-validation)
6. [Documentation Standards](#documentation-standards)

## Consolidation Strategy

### Overview

Component consolidation aims to create a more maintainable codebase by eliminating duplicate implementations while ensuring no valuable functionality is lost. This process requires careful analysis and systematic execution.

### Guiding Principles

1. **Preserve All Valuable Features**: No functionality should be lost during consolidation
2. **Understand Before Removing**: Thoroughly analyze each component before making decisions
3. **Test-Driven Consolidation**: Ensure comprehensive test coverage before and after changes
4. **Staged Implementation**: Consolidate components in batches, starting with high-priority items
5. **Documentation First**: Document all features before making changes
6. **Backward Compatibility**: Maintain existing APIs where possible

### Pre-Consolidation Process

#### Component Discovery and Analysis

```typescript
// Automated component analysis
class ComponentAnalyzer {
  async analyzeComponentDuplicates(): Promise<ComponentAnalysisReport> {
    const components = await this.discoverComponents();
    const duplicates = await this.identifyDuplicates(components);
    const usageAnalysis = await this.analyzeUsage(components);
    
    return {
      totalComponents: components.length,
      duplicateGroups: duplicates,
      usageMetrics: usageAnalysis,
      consolidationOpportunities: this.identifyOpportunities(duplicates, usageAnalysis),
      priorityMatrix: this.calculatePriorities(duplicates, usageAnalysis)
    };
  }
  
  private async discoverComponents(): Promise<ComponentInfo[]> {
    // Scan codebase for component files
    // Extract component metadata
    // Analyze component structure and props
    return this.componentScanner.scan();
  }
  
  private async identifyDuplicates(components: ComponentInfo[]): Promise<DuplicateGroup[]> {
    const groups: DuplicateGroup[] = [];
    
    for (const component of components) {
      const similarities = components
        .filter(c => c !== component)
        .map(c => ({
          component: c,
          similarity: this.calculateSimilarity(component, c)
        }))
        .filter(s => s.similarity > 0.7);
      
      if (similarities.length > 0) {
        groups.push({
          primary: component,
          duplicates: similarities,
          consolidationComplexity: this.assessComplexity(component, similarities)
        });
      }
    }
    
    return this.deduplicateGroups(groups);
  }
}
```

#### Pre-Analysis Commands

```bash
# Run comprehensive component analysis
./scripts/run-component-cleanup.sh

# Generate analysis reports
npm run analyze:components

# Create backups before consolidation
npm run backup:components
```

Generated reports include:
- `component-analysis-results.json` - Detailed component analysis
- `duplicate-components.json` - Duplicate component mapping
- `component-consolidation-plan.json` - Recommended consolidation strategy
- `component-consolidation-report.md` - Human-readable consolidation plan

## Feature Tracking System

### Purpose

The feature tracking system ensures that no valuable functionality is lost during component consolidation by providing systematic documentation and comparison of features across duplicate implementations.

### Feature Inventory Template

```typescript
interface FeatureInventory {
  featureId: string;
  description: string;
  implementationDetails: string;
  usedBy: string[];
  priority: 'High' | 'Medium' | 'Low';
  migrationStatus: 'Not Started' | 'In Progress' | 'Completed';
  testCoverage: number;
  performance: PerformanceMetrics;
  accessibility: AccessibilityScore;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

interface AccessibilityScore {
  wcagLevel: 'A' | 'AA' | 'AAA';
  screenReaderSupport: boolean;
  keyboardNavigation: boolean;
  colorContrast: boolean;
}
```

### Feature Tracking Table

| Feature ID | Description | Implementation | Used By | Priority | Status | Notes |
|------------|-------------|----------------|---------|----------|---------|-------|
| FID-001 | Primary button styling | CSS classes with theme variables | Dashboard, Forms | High | Not Started | Core visual identity |
| FID-002 | Loading state animation | State management + spinner component | Forms, Tables | High | Not Started | User feedback critical |
| FID-003 | Icon positioning | Flexbox layout with configurable positions | Navigation, Toolbars | Medium | Not Started | Visual hierarchy |
| FID-004 | Tooltip integration | Custom tooltip component integration | Advanced UI | Low | Not Started | Enhanced UX |

### Feature Comparison Matrix

```typescript
// Feature comparison system
class FeatureComparer {
  compareFeatures(components: ComponentInfo[]): FeatureComparisonMatrix {
    const allFeatures = this.extractAllFeatures(components);
    const matrix: FeatureComparisonMatrix = {};
    
    for (const feature of allFeatures) {
      matrix[feature.id] = components.map(component => ({
        component: component.name,
        implementation: this.getFeatureImplementation(component, feature),
        quality: this.assessImplementationQuality(component, feature),
        performance: this.measurePerformance(component, feature),
        recommendation: this.generateRecommendation(component, feature)
      }));
    }
    
    return matrix;
  }
  
  private assessImplementationQuality(
    component: ComponentInfo, 
    feature: FeatureInfo
  ): QualityScore {
    return {
      codeQuality: this.analyzeCodeQuality(component, feature),
      maintainability: this.assessMaintainability(component, feature),
      testCoverage: this.calculateTestCoverage(component, feature),
      documentation: this.evaluateDocumentation(component, feature),
      accessibility: this.checkAccessibility(component, feature)
    };
  }
}
```

Example comparison for Button components:

| Feature | UI Button | Core Button | Feature Button | Target Implementation |
|---------|-----------|-------------|---------------|----------------------|
| Variants | ✓ (3 variants, clean CSS) | ✓ (5 variants, complex logic) | ✓ (2 variants, limited) | **Core Button** - More comprehensive, refactor for clarity |
| Size Options | ✓ (3 sizes, consistent scale) | ✓ (3 sizes, inconsistent) | ✓ (2 sizes only) | **UI Button** - Better scale consistency |
| Loading State | ✓ (spinner + disabled state) | ✗ (not implemented) | ✓ (text change only) | **UI Button** - Better UX with visual feedback |
| Icon Support | ✓ (left/right, limited icons) | ✓ (flexible positioning) | ✗ (not supported) | **Core Button** - More flexible, add icon library |
| Accessibility | ✓ (basic ARIA) | ✓ (comprehensive ARIA) | ✓ (tooltip support) | **Hybrid** - Combine Core's ARIA + Feature's tooltips |

## Consolidation Workflow

### Step 1: Component Selection and Prioritization

```typescript
// Priority calculation system
class ConsolidationPrioritizer {
  calculatePriority(component: ComponentInfo): ConsolidationPriority {
    const factors = {
      duplicateCount: this.countDuplicates(component),
      usageFrequency: this.analyzeUsage(component),
      maintainabilityImpact: this.assessMaintainability(component),
      testCoverage: this.calculateTestCoverage(component),
      businessCritical: this.assessBusinessImpact(component)
    };
    
    const score = this.weightedScore(factors, {
      duplicateCount: 0.3,
      usageFrequency: 0.25,
      maintainabilityImpact: 0.2,
      testCoverage: 0.15,
      businessCritical: 0.1
    });
    
    return {
      component: component.name,
      score,
      priority: this.scoreToPriority(score),
      factors,
      estimatedEffort: this.estimateConsolidationEffort(component),
      riskLevel: this.assessRisk(component)
    };
  }
}
```

Priority criteria:
1. **High Priority**: Core UI components with 3+ duplicates, high usage frequency
2. **Medium Priority**: Feature-specific components with 2+ duplicates, moderate usage
3. **Low Priority**: Specialized components with minimal duplication

### Step 2: Detailed Feature Analysis

```typescript
// Feature extraction and analysis
class FeatureAnalyzer {
  async analyzeComponent(component: ComponentInfo): Promise<ComponentFeatureAnalysis> {
    const features = await this.extractFeatures(component);
    const dependencies = await this.analyzeDependencies(component);
    const usage = await this.analyzeUsagePatterns(component);
    
    return {
      component: component.name,
      features: features.map(feature => ({
        ...feature,
        complexity: this.assessFeatureComplexity(feature),
        performance: this.measureFeaturePerformance(feature),
        testCoverage: this.calculateFeatureTestCoverage(feature)
      })),
      dependencies: dependencies.map(dep => ({
        ...dep,
        replaceable: this.isReplaceable(dep),
        migrationPath: this.suggestMigrationPath(dep)
      })),
      usagePatterns: usage,
      consolidationStrategy: this.suggestConsolidationStrategy(component, features, usage)
    };
  }
  
  private extractFeatures(component: ComponentInfo): Promise<FeatureInfo[]> {
    // Static analysis of component code
    // Props interface analysis
    // State management analysis
    // Event handler analysis
    // Styling and theme analysis
    // Accessibility feature detection
  }
}
```

### Step 3: Implementation Strategy Selection

```typescript
// Consolidation strategy selection
class ConsolidationStrategist {
  selectStrategy(
    duplicateGroup: DuplicateGroup,
    featureAnalysis: ComponentFeatureAnalysis[]
  ): ConsolidationStrategy {
    
    const strategies = [
      this.mergeStrategy(duplicateGroup, featureAnalysis),
      this.pickBestStrategy(duplicateGroup, featureAnalysis),
      this.rebuildStrategy(duplicateGroup, featureAnalysis)
    ];
    
    return strategies.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }
  
  private mergeStrategy(
    group: DuplicateGroup, 
    analysis: ComponentFeatureAnalysis[]
  ): ConsolidationStrategy {
    return {
      type: 'merge',
      description: 'Combine features from multiple implementations',
      targetComponent: this.selectMergeTarget(group),
      featureMigrations: this.planFeatureMigrations(analysis),
      effort: this.estimateMergeEffort(group, analysis),
      risk: this.assessMergeRisk(group, analysis),
      score: this.calculateStrategyScore('merge', group, analysis)
    };
  }
  
  private pickBestStrategy(
    group: DuplicateGroup,
    analysis: ComponentFeatureAnalysis[]
  ): ConsolidationStrategy {
    const bestComponent = this.selectBestImplementation(analysis);
    
    return {
      type: 'pick-best',
      description: 'Select the best implementation and migrate others',
      targetComponent: bestComponent,
      migrationPlan: this.planBestPickMigration(group, bestComponent),
      effort: this.estimatePickBestEffort(group, bestComponent),
      risk: this.assessPickBestRisk(group, bestComponent),
      score: this.calculateStrategyScore('pick-best', group, analysis)
    };
  }
  
  private rebuildStrategy(
    group: DuplicateGroup,
    analysis: ComponentFeatureAnalysis[]
  ): ConsolidationStrategy {
    return {
      type: 'rebuild',
      description: 'Create new implementation incorporating best practices',
      designPrinciples: this.extractDesignPrinciples(analysis),
      featureRequirements: this.consolidateFeatureRequirements(analysis),
      effort: this.estimateRebuildEffort(group, analysis),
      risk: this.assessRebuildRisk(group, analysis),
      score: this.calculateStrategyScore('rebuild', group, analysis)
    };
  }
}
```

### Step 4: Implementation Execution

```typescript
// Implementation execution framework
class ConsolidationExecutor {
  async executeConsolidation(
    strategy: ConsolidationStrategy,
    components: ComponentInfo[]
  ): Promise<ConsolidationResult> {
    
    // Phase 1: Preparation
    await this.createBackups(components);
    await this.setupTestEnvironment();
    await this.validatePreConditions(strategy, components);
    
    // Phase 2: Implementation
    const result = await this.executeStrategy(strategy);
    
    // Phase 3: Validation
    await this.runTestSuite(result);
    await this.validateFunctionality(result);
    await this.performanceTest(result);
    
    // Phase 4: Migration
    await this.migrateReferences(result);
    await this.updateDocumentation(result);
    
    return result;
  }
  
  private async executeStrategy(strategy: ConsolidationStrategy): Promise<ConsolidationResult> {
    switch (strategy.type) {
      case 'merge':
        return await this.executeMergeStrategy(strategy);
      case 'pick-best':
        return await this.executePickBestStrategy(strategy);
      case 'rebuild':
        return await this.executeRebuildStrategy(strategy);
      default:
        throw new Error(`Unknown strategy type: ${strategy.type}`);
    }
  }
}
```

### Step 5: Validation and Testing

```typescript
// Comprehensive validation framework
class ConsolidationValidator {
  async validateConsolidation(
    original: ComponentInfo[],
    consolidated: ComponentInfo,
    migrationMap: MigrationMap
  ): Promise<ValidationReport> {
    
    const functionalValidation = await this.validateFunctionality(original, consolidated);
    const performanceValidation = await this.validatePerformance(original, consolidated);
    const accessibilityValidation = await this.validateAccessibility(consolidated);
    const integrationValidation = await this.validateIntegrations(migrationMap);
    
    return {
      overall: this.calculateOverallScore([
        functionalValidation,
        performanceValidation,
        accessibilityValidation,
        integrationValidation
      ]),
      functional: functionalValidation,
      performance: performanceValidation,
      accessibility: accessibilityValidation,
      integration: integrationValidation,
      recommendations: this.generateRecommendations(consolidated),
      approved: this.shouldApproveConsolidation([
        functionalValidation,
        performanceValidation,
        accessibilityValidation,
        integrationValidation
      ])
    };
  }
  
  private async validateFunctionality(
    original: ComponentInfo[],
    consolidated: ComponentInfo
  ): Promise<FunctionalValidation> {
    const tests: TestResult[] = [];
    
    // Test each feature from original components
    for (const component of original) {
      for (const feature of component.features) {
        const testResult = await this.testFeature(consolidated, feature);
        tests.push(testResult);
      }
    }
    
    return {
      totalTests: tests.length,
      passed: tests.filter(t => t.passed).length,
      failed: tests.filter(t => !t.passed),
      coverage: this.calculateFeatureCoverage(tests),
      regressions: this.identifyRegressions(tests)
    };
  }
}
```

## Implementation Guidelines

### Component Architecture Standards

```typescript
// Standard component structure
interface StandardComponent<T extends ComponentProps> {
  // Component metadata
  displayName: string;
  version: string;
  category: ComponentCategory;
  
  // Props interface
  props: T;
  defaultProps?: Partial<T>;
  
  // Component implementation
  render(): JSX.Element;
  
  // Lifecycle methods (if class component)
  componentDidMount?(): void;
  componentDidUpdate?(prevProps: T): void;
  componentWillUnmount?(): void;
  
  // Static methods
  getDerivedStateFromProps?(props: T, state: any): any;
}

// Standard props interface
interface ComponentProps {
  // Identity
  id?: string;
  className?: string;
  testId?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
  
  // Events
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  
  // Styling
  theme?: ThemeConfig;
  variant?: string;
  size?: ComponentSize;
  
  // State
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  
  // Content
  children?: React.ReactNode;
}
```

### Consolidated Component Template

```typescript
// Template for consolidated components
import React, { forwardRef, useCallback, useMemo } from 'react';
import { ComponentProps, ComponentSize, ThemeConfig } from './types';
import { useTheme } from './hooks/useTheme';
import { useAccessibility } from './hooks/useAccessibility';

export interface ConsolidatedComponentProps extends ComponentProps {
  // Feature 1: Multiple variants
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline';
  
  // Feature 2: Size variations
  size?: ComponentSize;
  
  // Feature 3: Loading state
  loading?: boolean;
  loadingText?: string;
  
  // Feature 4: Icon support
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  // Feature 5: Advanced features
  tooltip?: string;
  badge?: string | number;
  
  // Consolidated event handlers
  onPress?: () => void;
  onLongPress?: () => void;
}

export const ConsolidatedComponent = forwardRef<
  HTMLElement,
  ConsolidatedComponentProps
>(({
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left',
  tooltip,
  badge,
  disabled,
  className,
  children,
  onPress,
  onClick,
  ...props
}, ref) => {
  // Theme integration
  const theme = useTheme();
  const styles = useMemo(() => 
    generateStyles(theme, { variant, size, loading, disabled }), 
    [theme, variant, size, loading, disabled]
  );
  
  // Accessibility features
  const a11yProps = useAccessibility({
    disabled,
    loading,
    tooltip,
    ...props
  });
  
  // Event handling consolidation
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (disabled || loading) return;
    
    onClick?.(event);
    onPress?.();
  }, [disabled, loading, onClick, onPress]);
  
  // Content rendering
  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <>
          <LoadingSpinner size={size} />
          {loadingText && <span className={styles.loadingText}>{loadingText}</span>}
        </>
      );
    }
    
    return (
      <>
        {icon && iconPosition === 'left' && (
          <span className={styles.iconLeft}>{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className={styles.iconRight}>{icon}</span>
        )}
        {badge && (
          <span className={styles.badge}>{badge}</span>
        )}
      </>
    );
  }, [loading, loadingText, icon, iconPosition, children, badge, styles, size]);
  
  return (
    <button
      ref={ref}
      className={`${styles.base} ${className || ''}`}
      onClick={handleClick}
      disabled={disabled || loading}
      {...a11yProps}
      {...props}
    >
      {renderContent}
      {tooltip && <Tooltip content={tooltip} />}
    </button>
  );
});

ConsolidatedComponent.displayName = 'ConsolidatedComponent';
```

### Feature Integration Patterns

```typescript
// Pattern 1: Feature flags for gradual rollout
interface FeatureFlags {
  enableNewIconSystem: boolean;
  enableAdvancedTooltips: boolean;
  enablePerformanceOptimizations: boolean;
}

const withFeatureFlags = <T extends ComponentProps>(
  Component: React.ComponentType<T>,
  flags: FeatureFlags
) => {
  return (props: T) => {
    const enhancedProps = {
      ...props,
      features: flags
    };
    
    return <Component {...enhancedProps} />;
  };
};

// Pattern 2: Composition for complex features
interface ComposableComponentProps extends ComponentProps {
  renderPrefix?: () => React.ReactNode;
  renderSuffix?: () => React.ReactNode;
  renderOverlay?: () => React.ReactNode;
}

const ComposableComponent: React.FC<ComposableComponentProps> = ({
  renderPrefix,
  renderSuffix,
  renderOverlay,
  children,
  ...props
}) => {
  return (
    <div className="composable-component" {...props}>
      {renderPrefix?.()}
      <div className="main-content">
        {children}
      </div>
      {renderSuffix?.()}
      {renderOverlay?.()}
    </div>
  );
};

// Pattern 3: Hook-based feature sharing
const useComponentFeatures = (
  features: string[],
  config: FeatureConfig
) => {
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(
    new Set(features.filter(f => config[f]?.enabled))
  );
  
  const toggleFeature = useCallback((feature: string) => {
    setEnabledFeatures(prev => {
      const next = new Set(prev);
      if (next.has(feature)) {
        next.delete(feature);
      } else {
        next.add(feature);
      }
      return next;
    });
  }, []);
  
  return {
    isFeatureEnabled: (feature: string) => enabledFeatures.has(feature),
    toggleFeature,
    enabledFeatures: Array.from(enabledFeatures)
  };
};
```

## Testing and Validation

### Test Strategy for Consolidated Components

```typescript
// Comprehensive testing framework
describe('ConsolidatedComponent', () => {
  describe('Feature Preservation', () => {
    test('should preserve all features from original components', () => {
      // Test features from Component A
      const originalFeatures = getOriginalFeatures();
      originalFeatures.forEach(feature => {
        expect(component).toSupportFeature(feature);
      });
    });
    
    test('should maintain backward compatibility', () => {
      // Test existing usage patterns
      const legacyUsages = getLegacyUsagePatterns();
      legacyUsages.forEach(usage => {
        expect(() => renderComponent(usage.props)).not.toThrow();
      });
    });
  });
  
  describe('Performance', () => {
    test('should not regress performance', async () => {
      const originalMetrics = await getOriginalPerformanceMetrics();
      const consolidatedMetrics = await measureComponentPerformance();
      
      expect(consolidatedMetrics.renderTime).toBeLessThanOrEqual(
        originalMetrics.maxRenderTime * 1.1 // Allow 10% degradation
      );
      expect(consolidatedMetrics.memoryUsage).toBeLessThanOrEqual(
        originalMetrics.maxMemoryUsage
      );
    });
    
    test('should handle large datasets efficiently', () => {
      const largeDataset = generateLargeDataset(1000);
      const startTime = performance.now();
      
      render(<ConsolidatedComponent data={largeDataset} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });
  });
  
  describe('Accessibility', () => {
    test('should maintain WCAG compliance', async () => {
      const { container } = render(<ConsolidatedComponent />);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });
    
    test('should support keyboard navigation', () => {
      const { getByRole } = render(<ConsolidatedComponent />);
      const component = getByRole('button');
      
      component.focus();
      expect(component).toHaveFocus();
      
      fireEvent.keyDown(component, { key: 'Enter' });
      expect(mockOnPress).toHaveBeenCalled();
    });
  });
  
  describe('Integration', () => {
    test('should work with existing form libraries', () => {
      const { getByRole } = render(
        <FormLibraryProvider>
          <Form>
            <ConsolidatedComponent name="test" />
          </Form>
        </FormLibraryProvider>
      );
      
      expect(getByRole('button')).toBeInTheDocument();
    });
    
    test('should integrate with theme systems', () => {
      const customTheme = { primary: '#custom' };
      const { getByRole } = render(
        <ThemeProvider theme={customTheme}>
          <ConsolidatedComponent variant="primary" />
        </ThemeProvider>
      );
      
      const component = getByRole('button');
      expect(component).toHaveStyle({ backgroundColor: '#custom' });
    });
  });
});
```

### Migration Testing

```typescript
// Migration verification tests
describe('Component Migration', () => {
  test('should migrate all usage instances correctly', async () => {
    const migrationMap = await generateMigrationMap();
    
    for (const [oldUsage, newUsage] of migrationMap) {
      // Test that old props map correctly to new props
      const oldProps = parseProps(oldUsage);
      const newProps = migrateProps(oldProps);
      
      expect(newProps).toMatchSnapshot();
      
      // Test that behavior is preserved
      const oldBehavior = simulateComponent(oldUsage);
      const newBehavior = simulateComponent(newUsage);
      
      expect(newBehavior).toEqual(oldBehavior);
    }
  });
  
  test('should handle edge cases in migration', () => {
    const edgeCases = getEdgeCases();
    
    edgeCases.forEach(edgeCase => {
      expect(() => migrateComponent(edgeCase)).not.toThrow();
    });
  });
});
```

### Automated Validation

```typescript
// Automated validation pipeline
class ValidationPipeline {
  async runFullValidation(
    consolidation: ConsolidationResult
  ): Promise<ValidationReport> {
    const results = await Promise.all([
      this.runUnitTests(consolidation),
      this.runIntegrationTests(consolidation),
      this.runPerformanceTests(consolidation),
      this.runAccessibilityTests(consolidation),
      this.runVisualRegressionTests(consolidation),
      this.runE2ETests(consolidation)
    ]);
    
    return this.generateValidationReport(results);
  }
  
  private async runVisualRegressionTests(
    consolidation: ConsolidationResult
  ): Promise<VisualTestResult> {
    const screenshots = await this.captureScreenshots(consolidation);
    const baselines = await this.getBaselineScreenshots();
    
    const comparisons = screenshots.map(screenshot => 
      this.compareScreenshots(screenshot, baselines[screenshot.id])
    );
    
    return {
      total: comparisons.length,
      passed: comparisons.filter(c => c.passed).length,
      failed: comparisons.filter(c => !c.passed),
      threshold: 0.99 // 99% similarity required
    };
  }
}
```

## Documentation Standards

### Component Documentation Template

```typescript
/**
 * ConsolidatedComponent
 * 
 * A comprehensive component that consolidates functionality from multiple
 * previous implementations while maintaining backward compatibility.
 * 
 * @version 2.0.0
 * @since 1.0.0
 * @category UI Components
 * 
 * @example
 * // Basic usage
 * <ConsolidatedComponent variant="primary">
 *   Click me
 * </ConsolidatedComponent>
 * 
 * @example
 * // With icon and loading state
 * <ConsolidatedComponent 
 *   variant="secondary"
 *   icon={<IconPlus />}
 *   loading={isSubmitting}
 *   onPress={handleSubmit}
 * >
 *   Submit Form
 * </ConsolidatedComponent>
 * 
 * @consolidation
 * This component consolidates:
 * - UI Button (variant system, loading states)
 * - Core Button (icon support, accessibility)
 * - Feature Button (tooltip integration, badge support)
 * 
 * @migration
 * Migrating from previous components:
 * - UI Button: Props remain the same
 * - Core Button: `onClick` becomes `onPress`
 * - Feature Button: Tooltip now uses `tooltip` prop
 */
export interface ConsolidatedComponentProps {
  /** Component variant controlling visual appearance */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline';
  
  /** Size of the component affecting padding and font size */
  size?: 'small' | 'medium' | 'large';
  
  /** Loading state with optional custom text */
  loading?: boolean;
  loadingText?: string;
  
  /** Icon element to display with optional positioning */
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  /** Tooltip content for enhanced accessibility */
  tooltip?: string;
  
  /** Badge content (text or number) */
  badge?: string | number;
  
  /** Click handler - preferred over onClick for consistency */
  onPress?: () => void;
  
  /** Long press handler for advanced interactions */
  onLongPress?: () => void;
}
```

### Migration Guide Documentation

```markdown
# Component Migration Guide

## Overview

This guide helps migrate from legacy components to consolidated implementations.

## Migration Map

| Legacy Component | New Component | Migration Complexity | Breaking Changes |
|------------------|---------------|---------------------|------------------|
| UI Button | ConsolidatedComponent | Low | None |
| Core Button | ConsolidatedComponent | Medium | onClick → onPress |
| Feature Button | ConsolidatedComponent | Medium | Tooltip API changed |

## Step-by-Step Migration

### From UI Button

✅ **No changes required** - All props are compatible.

```tsx
// Before
<UIButton variant="primary" size="large">
  Submit
</UIButton>

// After
<ConsolidatedComponent variant="primary" size="large">
  Submit
</ConsolidatedComponent>
```

### From Core Button

⚠️ **Event handler change required**

```tsx
// Before
<CoreButton onClick={handleClick} icon={<Icon />}>
  Click me
</CoreButton>

// After
<ConsolidatedComponent onPress={handleClick} icon={<Icon />}>
  Click me
</ConsolidatedComponent>
```

### From Feature Button

⚠️ **Tooltip API change required**

```tsx
// Before
<FeatureButton tooltip={{ content: "Help text", position: "top" }}>
  Help
</FeatureButton>

// After
<ConsolidatedComponent tooltip="Help text">
  Help
</ConsolidatedComponent>
```

## Automated Migration

Use the migration script for large codebases:

```bash
# Dry run to see what would change
npm run migrate:components --dry-run

# Apply migrations
npm run migrate:components

# Verify migrations
npm run test:migration
```
```

---

This comprehensive component consolidation guide provides systematic approaches for eliminating duplicate components while preserving all valuable functionality. Follow these procedures to create a more maintainable codebase without losing features or breaking existing implementations.
