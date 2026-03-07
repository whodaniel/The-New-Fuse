#!/usr/bin/env node

/**
 * Route Audit Script
 * Automatically verifies that all pages have corresponding routes
 * and identifies missing routes or dead links
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RouteAuditor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.frontendRoot = path.join(this.projectRoot, 'apps/frontend/src');
    this.allPagesPath = path.join(this.frontendRoot, 'pages/AllPages.tsx');
    this.routerPath = path.join(this.frontendRoot, 'ComprehensiveRouter.tsx');
    
    this.pageFiles = [];
    this.allPagesRoutes = [];
    this.routerRoutes = [];
    this.issues = [];
  }

  /**
   * Find all page files in the project
   */
  findPageFiles() {
    console.log('🔍 Scanning for page files...');
    
    const patterns = [
      'apps/frontend/src/pages/**/*.{tsx,ts,jsx,js}',
      'src/pages/**/*.{tsx,ts,jsx,js}',
      'packages/frontend/src/pages/**/*.{tsx,ts,jsx,js}',
      'packages/testing/src/e2e/pages/**/*.{tsx,ts,jsx,js}'
    ];

    patterns.forEach(pattern => {
      const files = glob.sync(pattern, { cwd: this.projectRoot });
      this.pageFiles.push(...files);
    });

    console.log(`   Found ${this.pageFiles.length} page files`);
    return this.pageFiles;
  }

  /**
   * Extract routes from AllPages.tsx
   */
  extractAllPagesRoutes() {
    console.log('📄 Extracting routes from AllPages.tsx...');
    
    try {
      const content = fs.readFileSync(this.allPagesPath, 'utf8');
      
      // Extract path values from the allPages array
      const pathRegex = /path:\s*['"`]([^'"`]+)['"`]/g;
      let match;
      
      while ((match = pathRegex.exec(content)) !== null) {
        this.allPagesRoutes.push(match[1]);
      }
      
      console.log(`   Found ${this.allPagesRoutes.length} routes in AllPages.tsx`);
    } catch (error) {
      this.issues.push(`❌ Could not read AllPages.tsx: ${error.message}`);
    }
    
    return this.allPagesRoutes;
  }

  /**
   * Extract routes from ComprehensiveRouter.tsx
   */
  extractRouterRoutes() {
    console.log('🔀 Extracting routes from ComprehensiveRouter.tsx...');
    
    try {
      const content = fs.readFileSync(this.routerPath, 'utf8');
      
      // Extract path values from Route components
      const routeRegex = /<Route\s+path=['"`]([^'"`]+)['"`]/g;
      let match;
      
      while ((match = routeRegex.exec(content)) !== null) {
        this.routerRoutes.push(match[1]);
      }
      
      console.log(`   Found ${this.routerRoutes.length} routes in ComprehensiveRouter.tsx`);
    } catch (error) {
      this.issues.push(`❌ Could not read ComprehensiveRouter.tsx: ${error.message}`);
    }
    
    return this.routerRoutes;
  }

  /**
   * Find missing routes
   */
  findMissingRoutes() {
    console.log('🔍 Checking for missing routes...');
    
    const missingFromRouter = this.allPagesRoutes.filter(route => 
      !this.routerRoutes.includes(route) && 
      !route.includes(':id') // Skip dynamic routes for now
    );
    
    const missingFromAllPages = this.routerRoutes.filter(route => 
      !this.allPagesRoutes.includes(route) && 
      route !== '*' && // Skip catch-all route
      !route.includes(':id') // Skip dynamic routes for now
    );

    if (missingFromRouter.length > 0) {
      this.issues.push(`⚠️  Routes in AllPages.tsx but missing from router (${missingFromRouter.length}):`);
      missingFromRouter.forEach(route => {
        this.issues.push(`   • ${route}`);
      });
    }

    if (missingFromAllPages.length > 0) {
      this.issues.push(`⚠️  Routes in router but missing from AllPages.tsx (${missingFromAllPages.length}):`);
      missingFromAllPages.forEach(route => {
        this.issues.push(`   • ${route}`);
      });
    }
  }

  /**
   * Check for page files without routes
   */
  findOrphanedPageFiles() {
    console.log('👻 Checking for orphaned page files...');
    
    const orphanedFiles = [];
    
    this.pageFiles.forEach(file => {
      // Skip certain files
      if (file.includes('/__tests__/') || 
          file.includes('.test.') || 
          file.includes('.spec.') ||
          file.includes('_app.') ||
          file.includes('_document.') ||
          file.includes('/api/') ||
          file.endsWith('.d.ts') ||
          file.endsWith('utils.ts') ||
          file.endsWith('types.ts')) {
        return;
      }

      // Try to infer what route this file might need
      const relativePath = file.replace(/^apps\/frontend\/src\/pages\//, '');
      const routePath = this.inferRouteFromFile(relativePath);
      
      if (routePath && !this.routerRoutes.includes(routePath)) {
        orphanedFiles.push({ file, expectedRoute: routePath });
      }
    });

    if (orphanedFiles.length > 0) {
      this.issues.push(`🏝️  Page files that might need routes (${orphanedFiles.length}):`);
      orphanedFiles.forEach(({ file, expectedRoute }) => {
        this.issues.push(`   • ${file} → ${expectedRoute}`);
      });
    }
  }

  /**
   * Infer route from file path
   */
  inferRouteFromFile(filePath) {
    // Handle index files
    if (filePath.endsWith('/index.tsx') || filePath.endsWith('/index.ts')) {
      const dir = path.dirname(filePath);
      return dir === '.' ? '/' : `/${dir.toLowerCase()}`;
    }

    // Handle regular files
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    if (name === 'AllPages') return '/all-pages';
    if (name === 'BuildInfo') return '/build-info';
    if (name === 'DebugRouting') return '/debug-routing';
    
    // Convert file structure to route
    const parts = dir === '.' ? [name] : [dir, name];
    return `/${parts.join('/').toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`;
  }

  /**
   * Generate audit report
   */
  generateReport() {
    console.log('\n📊 ROUTE AUDIT REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📈 Summary:`);
    console.log(`   • Page files found: ${this.pageFiles.length}`);
    console.log(`   • Routes in AllPages.tsx: ${this.allPagesRoutes.length}`);
    console.log(`   • Routes in router: ${this.routerRoutes.length}`);
    console.log(`   • Issues detected: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log(`\n⚠️  Issues Detected:`);
      this.issues.forEach(issue => console.log(issue));
    } else {
      console.log(`\n✅ No issues detected! All routes are properly configured.`);
    }

    console.log(`\n🔧 Recommendations:`);
    console.log(`   1. Review missing routes and add them to ComprehensiveRouter.tsx`);
    console.log(`   2. Update AllPages.tsx to include all documented routes`);
    console.log(`   3. Consider removing unused page files or adding routes for them`);
    console.log(`   4. Run this audit script regularly during development`);
  }

  /**
   * Run the complete audit
   */
  async run() {
    console.log('🚀 Starting Route Audit...\n');
    
    this.findPageFiles();
    this.extractAllPagesRoutes();
    this.extractRouterRoutes();
    this.findMissingRoutes();
    this.findOrphanedPageFiles();
    this.generateReport();
    
    // Exit with error code if issues found
    process.exit(this.issues.length > 0 ? 1 : 0);
  }
}

// Main execution function
async function main() {
  // Check if glob is available, if not provide instructions
  try {
    await import('glob');
  } catch (error) {
    console.log('📦 Installing required dependency: glob');
    console.log('Run: pnpm add glob --dev');
    process.exit(1);
  }

  // Run the auditor
  const auditor = new RouteAuditor();
  await auditor.run();
}

main().catch(console.error);