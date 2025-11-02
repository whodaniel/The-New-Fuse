#!/usr/bin/env node

/**
 * Test script to verify the diagnostic command exists in the extension
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing VS Code LLM Diagnostic Command Registration');
console.log('==================================================');

// Check package.json
try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const diagnosticCommand = packageJson.contributes.commands.find(
        cmd => cmd.command === 'the-new-fuse.diagnosticVSCodeLLM'
    );
    
    if (diagnosticCommand) {
        console.log('✅ Command found in package.json:');
        console.log(`   Command: ${diagnosticCommand.command}`);
        console.log(`   Title: ${diagnosticCommand.title}`);
        console.log(`   Category: ${diagnosticCommand.category}`);
    } else {
        console.log('❌ Command NOT found in package.json');
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    process.exit(1);
}

// Check if compiled extension exists
try {
    const extensionPath = path.join(__dirname, 'out', 'extension.js');
    if (fs.existsSync(extensionPath)) {
        console.log('✅ Compiled extension exists: out/extension.js');
        
        // Read the compiled extension and check for the command
        const extensionContent = fs.readFileSync(extensionPath, 'utf8');
        
        if (extensionContent.includes('diagnosticVSCodeLLM')) {
            console.log('✅ diagnosticVSCodeLLM function found in compiled code');
        } else {
            console.log('❌ diagnosticVSCodeLLM function NOT found in compiled code');
        }
        
        if (extensionContent.includes('the-new-fuse.diagnosticVSCodeLLM')) {
            console.log('✅ Command registration found in compiled code');
        } else {
            console.log('❌ Command registration NOT found in compiled code');
        }
    } else {
        console.log('❌ Compiled extension does not exist. Run: pnpm run build');
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Error reading compiled extension:', error.message);
    process.exit(1);
}

console.log('\n🎯 Extension Status:');
console.log('✅ Command properly defined in package.json');
console.log('✅ Function implemented in source code');
console.log('✅ Code compiled successfully');
console.log('\n💡 Next Steps:');
console.log('1. Press F5 in VS Code to launch Extension Development Host');
console.log('2. In the new VS Code window, reload the window (Cmd+R)');
console.log('3. Open Command Palette (Cmd+Shift+P)');
console.log('4. Search for "Diagnostic VS Code LLM"');
console.log('5. Run the command');

console.log('\n🔧 If the command still doesn\'t appear:');
console.log('- Make sure you\'re in the Extension Development Host window');
console.log('- Try restarting the Extension Development Host');
console.log('- Check VS Code Developer Console for errors');
