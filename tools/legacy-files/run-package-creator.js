#!/usr/bin/env node

// Quick runner for the TNF package creator
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running TNF Relay Package Creator...\n');

try {
    // Make the main script executable
    execSync('chmod +x create-complete-tnf-package.js');
    
    // Run the package creator
    execSync('node create-complete-tnf-package.js', { stdio: 'inherit' });
    
    console.log('\n✅ Package creation completed!');
    console.log('📁 Package location: tnf-relay-package/');
    console.log('\n🔧 Next steps:');
    console.log('1. cd tnf-relay-package');
    console.log('2. ./install.sh');
    console.log('3. npm start');
    console.log('4. Open http://localhost:3002');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
