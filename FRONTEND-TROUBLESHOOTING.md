# Frontend Troubleshooting Guide

This guide provides solutions for common issues you might encounter when running The New Fuse frontend application.

## Common Issues and Solutions

### 1. Dependency Resolution Issues

**Symptoms:**
- "No candidates found" errors
- Missing peer dependencies
- Version conflicts

**Solutions:**
- Try using `--force` flag: `yarn install --force`
- Use npm instead of yarn: `npm install`
- Install specific versions of problematic packages: `yarn add package@version`
- Check for circular dependencies in workspace packages

### 2. TypeScript Errors

**Symptoms:**
- Type errors during build
- "Cannot find module" errors
- Path alias resolution issues

**Solutions:**
- Check tsconfig.json for proper configuration
- Ensure path aliases match in both tsconfig.json and vite.config.ts
- Add missing type definitions: `yarn add -D @types/package-name`
- Use `// @ts-ignore` or `// @ts-nocheck` temporarily to bypass errors

### 3. Vite Configuration Issues

**Symptoms:**
- Build errors related to plugins
- Module resolution errors
- Environment variable issues

**Solutions:**
- Check vite.config.ts for proper configuration
- Ensure all plugins are correctly installed and configured
- Verify environment variables are properly defined
- Try running with `--debug` flag: `vite --debug`

### 4. React Component Errors

**Symptoms:**
- "React is not defined" errors
- JSX syntax errors
- Hook rules violations

**Solutions:**
- Ensure React is imported in all component files
- Check for proper JSX syntax and file extensions (.jsx or .tsx)
- Verify hook rules are followed (hooks called at top level, etc.)
- Check for missing React imports in components

### 5. Workspace Package Issues

**Symptoms:**
- "Cannot find module" errors for workspace packages
- Version conflicts between workspace packages
- Build order issues

**Solutions:**
- Build packages in the correct order (types → utils → core → ui → features)
- Check package.json for correct workspace references
- Ensure all workspace packages are built before running the frontend
- Use absolute imports instead of relative imports for workspace packages

### 6. Docker-related Issues

**Symptoms:**
- Container build failures
- Port binding issues
- Volume mounting problems

**Solutions:**
- Check Docker and docker-compose installation
- Ensure no other services are using port 3000
- Verify volume paths are correct
- Check Docker logs for detailed error messages

## Debugging Techniques

1. **Enable Verbose Logging:**
   - For yarn: `yarn --verbose`
   - For npm: `npm --loglevel verbose`
   - For Vite: `vite --debug`

2. **Check Browser Console:**
   - Open browser developer tools (F12)
   - Look for errors in the Console tab

3. **Inspect Network Requests:**
   - Use the Network tab in browser developer tools
   - Check for failed requests or 404 errors

4. **Analyze Build Output:**
   - Check the dist directory for build artifacts
   - Look for missing files or unexpected output

5. **Isolate Components:**
   - Create a minimal reproduction of the issue
   - Test components in isolation

## Getting Help

If you're still experiencing issues after trying these solutions, please:

1. Create a detailed issue report with:
   - Steps to reproduce
   - Error messages
   - Environment information (OS, Node.js version, etc.)
   - Screenshots or logs

2. Reach out to the development team through:
   - GitHub Issues
   - Development chat channels
   - Email support
