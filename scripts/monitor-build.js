#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('⏱️  Build Performance Monitor');
console.log('============================');

const commands = [
  { name: 'Fast Build', cmd: 'bun run build:fast' },
  { name: 'Optimized Build', cmd: 'bun run build:optimized' },
  { name: 'Production Build', cmd: 'bun run build:production' }
];

const results = [];

commands.forEach(({ name, cmd }) => {
  console.log(`\n🏃 Running: ${name}`);
  
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit' });
    const duration = Date.now() - start;
    results.push({ name, duration, success: true });
    console.log(`✅ ${name} completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ name, duration, success: false });
    console.log(`❌ ${name} failed after ${duration}ms`);
  }
});

// Save results
const report = {
  timestamp: new Date().toISOString(),
  results: results
};

fs.writeFileSync('build-performance.json', JSON.stringify(report, null, 2));
console.log('\n📊 Performance report saved to build-performance.json');
