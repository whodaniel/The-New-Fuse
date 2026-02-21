const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Continuous Improver: Scanning...');

// 1. Run TNF Doctor
try {
  execSync('./tnf doctor', { stdio: 'pipe' });
  console.log('✅ TNF Doctor passed.');
} catch (e) {
  console.warn('⚠️ TNF Doctor reported issues. Task: Review doctor output.');
  // TODO: Create a task in Redis for "Fix tnf doctor issues"
}

// 2. TODO Scan
const grepTodos = 'grep -r "TODO" src/ --include="*.ts" | wc -l';
try {
  const todoCount = execSync(grepTodos).toString().trim();
  console.log(`ℹ️ Found ${todoCount} TODOs in codebase.`);
  if (parseInt(todoCount) > 50) {
    console.warn('⚠️ TODO backlog high. Task: Prioritize tech debt reduction.');
  }
} catch (e) {
  // Grep might fail if no matches (exit code 1)
  console.log('✅ No critical TODOs found via grep.');
}

console.log('Continuous Improver: Scan complete.');
