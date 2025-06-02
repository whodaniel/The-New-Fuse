const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Final VSIX Creation Attempt');
console.log('================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('dist/extension.js')) {
    console.error('❌ Missing required files');
    process.exit(1);
}

console.log('✅ Required files found');

// Read package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📦 Package: ${pkg.name} v${pkg.version}`);

// Create a simple zip using system commands
const fileName = `${pkg.name}-${pkg.version}.vsix`;

try {
    // Create temp directory structure
    console.log('📁 Creating temporary structure...');
    if (fs.existsSync('temp-vsix')) {
        execSync('rm -rf temp-vsix');
    }
    fs.mkdirSync('temp-vsix');
    
    // Copy essential files
    execSync('cp package.json temp-vsix/');
    execSync('cp -r dist temp-vsix/');
    if (fs.existsSync('README.md')) {execSync('cp README.md temp-vsix/');}
    if (fs.existsSync('CHANGELOG.md')) {execSync('cp CHANGELOG.md temp-vsix/');}
    if (fs.existsSync('media')) {execSync('cp -r media temp-vsix/');}
    
    console.log('📦 Creating archive...');
    
    // Create the zip file
    process.chdir('temp-vsix');
    execSync(`zip -r ../${fileName} ./*`);
    process.chdir('..');
    
    // Clean up
    execSync('rm -rf temp-vsix');
    
    if (fs.existsSync(fileName)) {
        const stats = fs.statSync(fileName);
        console.log(`🎉 SUCCESS: Created ${fileName}`);
        console.log(`📊 Size: ${Math.round(stats.size / 1024)}KB`);
        console.log('');
        console.log('🚀 Installation Instructions:');
        console.log('1. Open VS Code');
        console.log('2. Press Cmd+Shift+P (or Ctrl+Shift+P)');
        console.log('3. Type: Extensions: Install from VSIX...');
        console.log(`4. Select: ${fileName}`);
        console.log('');
        console.log('💻 Command line installation:');
        console.log(`   code --install-extension ${fileName}`);
    } else {
        console.error('❌ Package creation failed');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
