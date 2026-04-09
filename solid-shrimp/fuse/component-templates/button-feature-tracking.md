# Button Component Feature Tracking

## Component Implementations

1. **UI Button**: `packages/ui/src/components/Button.tsx`
2. **Core Button**: `packages/core/components/ui/Button.tsx`
3. **Feature Button**: `packages/features/common/Button.tsx`

## Feature Inventory

| Feature ID | Feature Description | Implementation Details | Used By | Priority | Migration Status |
|------------|---------------------|------------------------|---------|----------|------------------|
| BTN-001 | Primary/Secondary/Tertiary variants | Different CSS classes for styling button types | Dashboard, Forms, Navigation | High | Not Started |
| BTN-002 | Size variations (sm, md, lg) | CSS classes for different button sizes | Throughout app | High | Not Started |
| BTN-003 | Loading state with spinner | State management and conditional rendering of spinner | Forms, Data tables | Medium | Not Started |
| BTN-004 | Icon support (left/right) | Accepts icon component as prop with position option | Navigation, Toolbars | Medium | Not Started |
| BTN-005 | Tooltip support | Uses title attribute or custom tooltip component | Advanced UI | Low | Not Started |
| BTN-006 | Disabled state | Visual styling and preventing click events | Forms, Actions | High | Not Started |
| BTN-007 | Full width option | Styling for 100% width buttons | Mobile views, Forms | Medium | Not Started |
| BTN-008 | Custom colors | Prop for overriding default color scheme | Branding areas | Low | Not Started |
| BTN-009 | Link functionality | Renders as anchor tag when href provided | Navigation | Medium | Not Started |
| BTN-010 | Click animations | Visual feedback on button press | All button instances | Low | Not Started |

## Feature Comparison Matrix

| Feature | UI Button | Core Button | Feature Button | Target Implementation |
|---------|-----------|-------------|---------------|----------------------|
| Variants | ✓ (3 variants with consistent styling) | ✓ (5 variants but inconsistent) | ✓ (2 variants) | UI Button - more consistent design system |
| Sizes | ✓ (3 sizes with rem units) | ✓ (3 sizes with px units) | ✓ (2 sizes) | UI Button - better responsive design |
| Loading | ✓ (spinner with text) | ✗ | ✓ (text only) | UI Button - better UX |
| Icons | ✓ (limited positioning) | ✓ (flexible positioning) | ✗ | Core Button - more flexible |
| Tooltip | ✗ | ✓ (basic title) | ✓ (custom component) | Feature Button - better accessibility |
| Disabled | ✓ (styling + aria) | ✓ (styling only) | ✓ (styling + aria) | UI Button - better accessibility |
| Full width | ✓ | ✗ | ✓ | UI Button - cleaner implementation |
| Custom colors | ✓ (theme based) | ✓ (direct hex) | ✗ | UI Button - better theme integration |
| Link functionality | ✓ (full router support) | ✓ (basic href) | ✗ | UI Button - better navigation integration |
| Click animations | ✓ (subtle) | ✗ | ✓ (pronounced) | UI Button - better balance |

## Usage Analysis

### UI Button Usage

- Used in 24 components across the application
- Most commonly used for form submissions and navigation actions
- All size variants are used, with medium being most common
- Loading state used primarily in form submissions

### Core Button Usage

- Used in 18 components, mostly in older parts of the application
- Primarily used for utility functions and secondary actions
- Icon functionality heavily used in toolbars and navigation
- Custom colors used for specialized UI sections

### Feature Button Usage

- Used in 7 components, all within specific feature modules
- Custom tooltip functionality used for complex interactions
- Limited to primary/secondary variants

## Consolidation Decision

Based on the feature comparison and usage analysis, we will create a consolidated Button component that:

1. Uses UI Button as the base implementation
2. Incorporates the flexible icon positioning from Core Button
3. Integrates the custom tooltip component from Feature Button
4. Maintains backward compatibility with all existing usage patterns

## Migration Plan

1. Create consolidated Button component in `packages/ui/src/components/Button.tsx`
2. Add comprehensive tests for all features
3. Update imports in phases, starting with newest components
4. Verify functionality after each batch of updates
5. Document API changes and migration steps

## Testing Checklist

- [ ] Unit tests for all variants
- [ ] Unit tests for all sizes
- [ ] Unit tests for loading state
- [ ] Unit tests for icon positioning
- [ ] Unit tests for tooltip functionality
- [ ] Unit tests for disabled state
- [ ] Unit tests for full width option
- [ ] Unit tests for custom colors
- [ ] Unit tests for link functionality
- [ ] Integration tests with forms
- [ ] Integration tests with navigation
- [ ] Visual regression tests

## Notes

- The Core Button has 2 unique variants not present in other implementations
- Feature Button has the most accessible tooltip implementation
- UI Button has the most consistent styling with the design system
- Consider creating a ButtonGroup component after consolidation