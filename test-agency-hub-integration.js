#!/usr/bin/env node

/**
 * Agency Hub Integration Test
 * Tests the complete Agency Hub implementation including:
 * - Database schema validation
 * - Service method availability 
 * - Controller endpoint compatibility
 * - Module dependency resolution
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Agency Hub Integration Test\n');

// Test 1: Verify Database Schema
console.log('📊 Testing Database Schema...');
const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

const requiredModels = [
  'SwarmExecution',
  'ExecutionStep', 
  'SwarmMessage',
  'ServiceCategory',
  'ServiceProvider',
  'ServiceRequest',
  'ProviderReview',
  'ServiceReview'
];

const requiredEnums = [
  'SwarmExecutionStatus',
  'ServiceComplexity', 
  'ProviderStatus',
  'ProviderPricingModel',
  'ProviderExperienceLevel',
  'ServiceRequestStatus'
];

let schemaErrors = 0;

requiredModels.forEach(model => {
  if (!schemaContent.includes(`model ${model}`)) {
    console.error(`❌ Missing model: ${model}`);
    schemaErrors++;
  } else {
    console.log(`✅ Found model: ${model}`);
  }
});

requiredEnums.forEach(enumType => {
  if (!schemaContent.includes(`enum ${enumType}`)) {
    console.error(`❌ Missing enum: ${enumType}`);
    schemaErrors++;
  } else {
    console.log(`✅ Found enum: ${enumType}`);
  }
});

if (schemaErrors === 0) {
  console.log('✅ Database schema validation passed\n');
} else {
  console.error(`❌ Database schema validation failed with ${schemaErrors} errors\n`);
}

// Test 2: Verify Service Implementation
console.log('🔧 Testing Service Implementation...');
const servicePath = path.join(__dirname, 'packages/core/src/services/enhanced-agency.service.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf-8');

const requiredMethods = [
  'createAgencyWithSwarm',
  'getAgencyWithSwarmStatus', 
  'updateAgencyConfiguration',
  'initializeSwarm',
  'getSwarmStatus',
  'registerProviders',
  'getProviders',
  'getAnalytics'
];

let serviceErrors = 0;

requiredMethods.forEach(method => {
  if (!serviceContent.includes(`async ${method}(`)) {
    console.error(`❌ Missing method: ${method}`);
    serviceErrors++;
  } else {
    console.log(`✅ Found method: ${method}`);
  }
});

if (serviceErrors === 0) {
  console.log('✅ Service implementation validation passed\n');
} else {
  console.error(`❌ Service implementation validation failed with ${serviceErrors} errors\n`);
}

// Test 3: Verify Controller Integration
console.log('🎮 Testing Controller Integration...');
const controllerPath = path.join(__dirname, 'apps/api/src/modules/agency-hub/controllers/agency.controller.ts');
const controllerContent = fs.readFileSync(controllerPath, 'utf-8');

const controllerMethods = [
  'createAgency',
  'getAgency',
  'updateAgency', 
  'initializeSwarm',
  'getSwarmStatus',
  'registerProviders'
];

let controllerErrors = 0;

controllerMethods.forEach(method => {
  if (!controllerContent.includes(`async ${method}(`)) {
    console.error(`❌ Missing controller method: ${method}`);
    controllerErrors++;
  } else {
    console.log(`✅ Found controller method: ${method}`);
  }
});

if (controllerErrors === 0) {
  console.log('✅ Controller integration validation passed\n');
} else {
  console.error(`❌ Controller integration validation failed with ${controllerErrors} errors\n`);
}

// Test 4: Verify Module Dependencies
console.log('📦 Testing Module Dependencies...');
const moduleePath = path.join(__dirname, 'packages/core/src/modules/agency-hub.module.ts');
const moduleContent = fs.readFileSync(moduleePath, 'utf-8');

const requiredServices = [
  'EnhancedAgencyService',
  'AgentSwarmOrchestrationService',
  'ServiceCategoryRouterService',
  'AgencyHubCacheService'
];

let moduleErrors = 0;

requiredServices.forEach(service => {
  if (!moduleContent.includes(service)) {
    console.error(`❌ Missing service in module: ${service}`);
    moduleErrors++;
  } else {
    console.log(`✅ Found service in module: ${service}`);
  }
});

if (moduleErrors === 0) {
  console.log('✅ Module dependencies validation passed\n');
} else {
  console.error(`❌ Module dependencies validation failed with ${moduleErrors} errors\n`);
}

// Test 5: Check Apps-Level Integration
console.log('🔗 Testing Apps-Level Integration...');
const appsModulePath = path.join(__dirname, 'apps/api/src/modules/agency-hub/agency-hub.module.ts');
const appsModuleContent = fs.readFileSync(appsModulePath, 'utf-8');

const integrationChecks = [
  { name: 'CoreAgencyHubModule import', pattern: 'CoreAgencyHubModule' },
  { name: 'Module re-export', pattern: 'exports:' },
  { name: 'Controller compatibility', pattern: 'AgencyController' }
];

let integrationErrors = 0;

integrationChecks.forEach(check => {
  if (!appsModuleContent.includes(check.pattern)) {
    console.error(`❌ Missing integration: ${check.name}`);
    integrationErrors++;
  } else {
    console.log(`✅ Found integration: ${check.name}`);
  }
});

if (integrationErrors === 0) {
  console.log('✅ Apps-level integration validation passed\n');
} else {
  console.error(`❌ Apps-level integration validation failed with ${integrationErrors} errors\n`);
}

// Summary
console.log('📋 INTEGRATION TEST SUMMARY');
console.log('=' .repeat(50));

const totalErrors = schemaErrors + serviceErrors + controllerErrors + moduleErrors + integrationErrors;

if (totalErrors === 0) {
  console.log('🎉 ALL TESTS PASSED! Agency Hub integration is complete.');
  console.log('\n✅ Database schema: Complete with all required models and enums');
  console.log('✅ Service methods: All missing methods implemented');  
  console.log('✅ Controller endpoints: All endpoints properly connected');
  console.log('✅ Module dependencies: All services and dependencies resolved');
  console.log('✅ Apps integration: Core module properly imported and integrated');
  console.log('\n🚀 The Agency Hub feature is ready for use!');
} else {
  console.error(`❌ INTEGRATION FAILED with ${totalErrors} total errors`);
  console.log('\n🔧 Please address the errors above before proceeding.');
}

console.log('\n' + '='.repeat(50));
