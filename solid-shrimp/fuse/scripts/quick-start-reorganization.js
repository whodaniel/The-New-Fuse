#!/usr/bin/env node

/**
 * Quick Start Reorganization Script
 * Executes the first phase of reorganization automatically
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting The New Fuse Reorganization - Phase 1');
console.log('================================================');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
  }

  // Create backup branch
  console.log('📦 Creating backup branch...');
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  try {
    execSync(`git checkout -b backup-${date}`, { stdio: 'pipe' });
    execSync('git checkout -', { stdio: 'pipe' });
    console.log(`✅ Created backup branch: backup-${date}`);
  } catch (error) {
    console.log('⚠️  Backup branch may already exist or Git not initialized');
  }

  // Create reorganization branch
  console.log('🔧 Creating reorganization branch...');
  try {
    execSync('git checkout -b feature/comprehensive-reorganization', { stdio: 'pipe' });
    console.log('✅ Created reorganization branch');
  } catch (error) {
    console.log('⚠️  Reorganization branch may already exist');
  }

  // Create validation results directory
  if (!fs.existsSync('validation-results')) {
    fs.mkdirSync('validation-results');
    console.log('✅ Created validation-results directory');
  }

  // Run Phase 1 - Import Updates
  console.log('🔄 Starting Phase 1: Package standardization...');
  
  if (fs.existsSync('scripts/update-imports.js')) {
    console.log('Running import updates...');
    execSync('node scripts/update-imports.js', { stdio: 'inherit' });
  } else {
    console.log('⚠️  Import update script not found, skipping for now');
  }

  // Type check
  console.log('🔍 Running type check...');
  try {
    execSync('pnpm run type-check', { stdio: 'pipe' });
    console.log('✅ Type check passed');
  } catch (error) {
    console.log('⚠️  Type check found issues - see COMPREHENSIVE_REORGANIZATION_PLAN.md for fixes');
  }

  console.log('\n🎉 Phase 1 initialization complete!');
  console.log('\n📖 Next steps:');
  console.log('1. Review COMPREHENSIVE_REORGANIZATION_PLAN.md for detailed instructions');
  console.log('2. Execute Phase 2: TypeScript configuration unification');
  console.log('3. Run validation: pnpm run reorganize:validate');
  console.log('4. If issues arise: pnpm run reorganize:rollback');

} catch (error) {
  console.error('❌ Reorganization initialization failed:', error.message);
  process.exit(1);
}
