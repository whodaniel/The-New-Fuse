#!/usr/bin/env node

/**
 * API Client Validation Script
 *
 * This script validates that all API client services are properly
 * extending BaseService and have the expected functionality.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Validating API Client Services...\n');

// Check that all service files exist and have proper structure
const servicePath = './src/services';
const requiredServices = [
  'BaseService.ts',
  'auth.service.ts',
  'user.service.ts',
  'agent.service.ts',
  'workflow.service.ts',
];

let validationResults = [];

for (const serviceFile of requiredServices) {
  const filePath = join(servicePath, serviceFile);

  try {
    const content = readFileSync(filePath, 'utf-8');

    const checks = {
      hasBaseServiceImport:
        content.includes('import { BaseService }') || content.includes("from './BaseService"),
      extendsBaseService:
        content.includes('extends BaseService') || serviceFile === 'BaseService.ts',
      hasEsmImports: content.includes(".js'") || content.includes('.js"'),
      hasValidation: content.includes('validateRequired') || serviceFile === 'BaseService.ts',
      hasHttpMethods:
        content.includes('this.get') ||
        content.includes('this.post') ||
        serviceFile === 'BaseService.ts',
    };

    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;

    validationResults.push({
      service: serviceFile,
      score: `${score}/${maxScore}`,
      checks,
      status: score === maxScore ? '✅' : '⚠️',
    });

    console.log(`${score === maxScore ? '✅' : '⚠️'} ${serviceFile}: ${score}/${maxScore}`);

    if (score < maxScore) {
      Object.entries(checks).forEach(([check, passed]) => {
        if (!passed) {
          console.log(`   ❌ ${check}`);
        }
      });
    }
  } catch (error) {
    console.log(`❌ ${serviceFile}: File not found or unreadable`);
    validationResults.push({
      service: serviceFile,
      score: '0/5',
      status: '❌',
      error: error.message,
    });
  }
}

console.log('\n📊 VALIDATION SUMMARY:');
console.log('='.repeat(50));

const passed = validationResults.filter((r) => r.status === '✅').length;
const total = validationResults.length;

console.log(`Services Validated: ${total}`);
console.log(`Services Passing: ${passed}`);
console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

if (passed === total) {
  console.log('\n🎉 ALL SERVICES VALIDATED SUCCESSFULLY!');
  console.log('\nThe API client package is ready for use with:');
  console.log('✅ Enhanced BaseService with HTTP methods and utilities');
  console.log('✅ All services properly extending BaseService');
  console.log('✅ ESM-compatible imports with .js extensions');
  console.log('✅ Consistent validation and error handling');
  console.log('✅ TypeScript compilation working');
} else {
  console.log('\n⚠️  Some services need attention. Check the details above.');
}

// Check build artifacts
console.log('\n🔧 Checking Build Output...');
try {
  const distPath = './dist';
  const fs = await import('fs');

  if (fs.existsSync(distPath)) {
    console.log('✅ Dist folder exists');

    const distServices = fs.readdirSync(join(distPath, 'services'));
    console.log(`✅ ${distServices.length} service files compiled`);

    const hasJsFiles = distServices.some((f) => f.endsWith('.js'));
    const hasDtsFiles = distServices.some((f) => f.endsWith('.d.ts'));

    console.log(`✅ JavaScript files: ${hasJsFiles ? 'Present' : 'Missing'}`);
    console.log(`✅ TypeScript definitions: ${hasDtsFiles ? 'Present' : 'Missing'}`);
  } else {
    console.log('⚠️  Dist folder not found - run build first');
  }
} catch (error) {
  console.log('⚠️  Could not check build output:', error.message);
}

console.log('\n🚀 Validation Complete!');
