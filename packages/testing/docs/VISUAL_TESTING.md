# Visual Testing Guide for The New Fuse

## Overview

This guide covers visual regression testing practices for The New Fuse platform using Playwright and our custom VisualTesting utility.

## Visual Testing Strategy

### What to Test

1. **Core Components**
   - Navigation elements
   - Workflow editor canvas
   - Dashboard components
   - Form elements
   - Modals and dialogs

2. **Interactive States**
   - Default state
   - Hover state
   - Focus state
   - Active/Pressed state
   - Loading state
   - Error state

3. **Responsive Layouts**
   - Desktop (1920x1080)
   - Laptop (1280x720)
   - Tablet (768x1024)
   - Mobile (375x812)

### Test Structure

```typescript
import { test } from '../../fixtures/custom-test';
import { VisualTesting } from '../../utils/visual-testing';

test.describe('Component Visual Tests', () => {
  let visualTesting: VisualTesting;

  test.beforeEach(async ({ page }) => {
    visualTesting = new VisualTesting(page, test.info());
  });

  test('component states', async () => {
    await visualTesting.captureInteractionStates(
      '[data-testid="component"]',
      'component-name'
    );
  });
});
```

## Best Practices

### 1. Baseline Management

- Store baselines in version control
- Update baselines with significant UI changes
- Review baseline changes in PRs
- Maintain separate baselines per environment

```bash
# Update baselines
npm run test:e2e:update-snapshots

# Review specific baseline
npm run test:e2e:review component-name
```

### 2. Selector Strategy

Prefer in order:
1. `data-testid` attributes
2. ARIA attributes
3. Semantic HTML elements
4. CSS classes (only if stable)

Example:
```html
<button data-testid="save-workflow">Save</button>
<nav aria-label="Main navigation">
<main>
```

### 3. Handling Dynamic Content

- Mask dynamic areas
- Use consistent test data
- Set fixed dimensions for variable content
- Handle animations and transitions

Example configuration:
```typescript
await visualTesting.compareElement('[data-testid="component"]', 'name', {
  mask: ['[data-dynamic]'],
  animation: 'disabled'
});
```

### 4. Test Environment Setup

Required configuration:
- Consistent viewport sizes
- System fonts
- Color schemes
- Browser versions
- Operating systems

### 5. CI/CD Integration

The visual testing pipeline:
1. Generate new screenshots
2. Compare with baselines
3. Generate difference images
4. Store artifacts
5. Report results in PR

## Common Scenarios

### 1. Testing Theme Variations

```typescript
test('theme appearances', async ({ page }) => {
  // Test light theme
  await visualTesting.compareFullPage('component-light');
  
  // Switch to dark theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  
  // Test dark theme
  await visualTesting.compareFullPage('component-dark');
});
```

### 2. Testing Responsive Behavior

```typescript
test('responsive layouts', async () => {
  await visualTesting.compareResponsive('component', [
    { width: 1920, height: 1080 },
    { width: 375, height: 812 }
  ]);
});
```

### 3. Testing Interactive Components

```typescript
test('interactive states', async () => {
  await visualTesting.captureInteractionStates(
    '[data-testid="button"]',
    'primary-button',
    ['hover', 'focus', 'active', 'disabled']
  );
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Inconsistent Screenshots**
   - Use fixed viewport sizes
   - Disable animations
   - Wait for network idle
   - Handle dynamic content

2. **False Positives**
   - Adjust comparison threshold
   - Mask dynamic areas
   - Use consistent test data
   - Review browser rendering differences

3. **Missing Elements**
   - Verify element visibility
   - Check loading states
   - Ensure proper waiting strategies
   - Validate selector presence

## Tools and Resources

### Built-in Utilities

- `VisualTesting` class for screenshot management
- Comparison threshold controls
- Responsive testing helpers
- Interactive state capture

### External Tools

- Playwright Test
- Image comparison libraries
- CI/CD integrations
- Artifact storage

## Maintenance

### Regular Tasks

1. Update baselines after UI changes
2. Review and adjust thresholds
3. Clean up unused snapshots
4. Verify test coverage
5. Monitor performance impact

### Version Control

- Store baselines in git
- Review visual changes in PRs
- Document baseline updates
- Track visual debt

## Contributing

1. Follow naming conventions
2. Document visual test cases
3. Review baseline changes
4. Update documentation
5. Consider performance impact