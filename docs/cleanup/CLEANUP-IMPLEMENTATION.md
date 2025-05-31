# The New Fuse - Cleanup Implementation Guide

This guide provides best practices for implementing changes identified by the cleanup process.

## Before You Begin

1. Make sure you've run the analysis scripts:
   ```bash
   node scripts/final-cleanup.js
   node scripts/cleanup-summary.js
   ```

2. Review the prioritized cleanup plan:
   ```bash
   cat CLEANUP-PRIORITIZED.md
   ```

3. Create a branch for your cleanup work:
   ```bash
   git checkout -b cleanup/implementation
   ```

## Implementation Strategy

### For Unused Imports

1. **Verify First**: Before removing an import, search for its usage throughout the file:
   - It might be used in JSX without explicit reference
   - It might be used for type declarations (TypeScript)
   - It might be used indirectly (e.g., for side effects)

2. **Remove Carefully**:
   ```javascript
   // Before
   import { Component1, Component2, UnusedComponent } from 'some-package';
   
   // After
   import { Component1, Component2 } from 'some-package';
   ```

3. **Handle Side Effects**: Some imports might be used for their side effects. If unsure, comment it out first:
   ```javascript
   // import 'some-polyfill'; // Temporarily commented to check for side effects
   ```

4. **Test After Each File**: Run the relevant tests or application after changing each file

### For Unused Files

1. **Check Import References**:
   ```bash
   grep -r "UnusedFile" --include="*.{js,ts,tsx,jsx}" ./src
   ```

2. **Check Indirect Usage**:
   - The file might be imported dynamically
   - The file might be used in build scripts
   - The file might be used through module resolution

3. **Move to a Backup First**:
   ```bash
   mkdir -p cleanup-staged/{src,components}
   mv src/components/UnusedComponent.tsx cleanup-staged/components/
   ```

4. **Commit in Small Batches**:
   - Group related changes
   - Include detailed commit messages explaining the reasoning
   - Reference the cleanup plan

## Handling Special Cases

### React Components

- Check for usage in JSX without imports (e.g., in a dynamic component system)
- Check for usage in storybooks or documentation
- Check if the component might be lazy-loaded

### Utility Functions

- Check for usage with string references (e.g., `utils['functionName']`)
- Check for usage in configuration files

### Types and Interfaces

- These are often safe to remove if unused, but be careful with exported types
- They might be used in .d.ts files not checked by normal imports

## Testing Your Changes

1. **Unit Tests**:
   ```bash
   npm test
   ```

2. **Build Check**:
   ```bash
   npm run build
   ```

3. **Manual Testing**:
   - Test critical features
   - Check browser console for errors
   - Test all supported browsers

## Rollback Plan

If issues arise:
1. Revert the specific commit
   ```bash
   git revert <commit-hash>
   ```

2. Or restore from backup
   ```bash
   cp -r cleanup-staged/components/UnusedComponent.tsx src/components/
   ```

## Final Verification Checklist

- [ ] All tests pass
- [ ] Application builds without warnings
- [ ] Application runs as expected
- [ ] No regressions in critical functionality
- [ ] Documentation is updated if public APIs changed
- [ ] Code quality (lint, formatting) is maintained

## Submitting Changes

1. Push your changes:
   ```bash
   git push origin cleanup/implementation
   ```

2. Create a detailed pull request describing:
   - What was removed
   - Your verification process
   - Any areas that need special attention during review
