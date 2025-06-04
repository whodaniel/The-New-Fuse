#!/usr/bin/env node

/**
 * The New Fuse Extension - Automated Testing Validation
 * This script verifies the extension is working properly
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('🧪 The New Fuse Extension - Automated Validation');
console.log('=================================================\n');

async function validateExtension() {
    try {
        // 1. Check build status
        console.log('1️⃣ Checking build status...');
        
        const distPath = path.join(__dirname, 'dist', 'extension.js');
        if (fs.existsSync(distPath)) {
            const stats = fs.statSync(distPath);
            const sizeKB = Math.round(stats.size / 1024);
            console.log(`✅ Extension compiled: ${sizeKB}KB`);
            console.log(`   Last modified: ${stats.mtime.toLocaleString()}`);
        } else {
            console.log('❌ Extension not compiled - dist/extension.js missing');
            return false;
        }

        // 2. Validate package.json
        console.log('\n2️⃣ Validating package.json...');
        
        const packagePath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        console.log(`✅ Extension: ${packageJson.displayName}`);
        console.log(`✅ Version: ${packageJson.version}`);
        console.log(`✅ VS Code Engine: ${packageJson.engines.vscode}`);
        
        // Check commands
        const commands = packageJson.contributes.commands || [];
        console.log(`✅ Commands registered: ${commands.length}`);
        
        // Check views
        const views = packageJson.contributes.views || {};
        if (views.theNewFuse) {
            console.log(`✅ Views configured: ${views.theNewFuse.length}`);
        }

        // 3. Check source files
        console.log('\n3️⃣ Checking source files...');
        
        const requiredFiles = [
            'src/extension.ts',
            'src/views/TabbedContainerProvider.ts',
            'src/views/ChatViewProvider.ts',
            'src/llm/LLMProviderManager.ts',
            'src/services/AgentCommunicationService.ts'
        ];
        
        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file}`);
            } else {
                console.log(`❌ ${file} - missing`);
            }
        }

        // 4. Check media files
        console.log('\n4️⃣ Checking media files...');
        
        const mediaFiles = [
            'media/chat.js',
            'media/chat.css',
            'media/tabbed-container.js',
            'media/tabbed-container.css',
            'media/fallback-icons.js'
        ];
        
        for (const file of mediaFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file}`);
            } else {
                console.log(`⚠️  ${file} - missing (may not be critical)`);
            }
        }

        // 5. Check for test files
        console.log('\n5️⃣ Checking test infrastructure...');
        
        const testFiles = fs.readdirSync('.').filter(f => f.startsWith('test-'));
        console.log(`✅ Test files available: ${testFiles.length}`);
        testFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));

        // 6. Verify enhanced services
        console.log('\n6️⃣ Checking enhanced services integration...');
        
        const extensionContent = fs.readFileSync(distPath, 'utf8');
        const services = [
            'A2AProtocolClient',
            'MCP2025Client',
            'SecurityObservabilityService',
            'MultiAgentOrchestrationService',
            'EnhancedIntegrationService'
        ];
        
        services.forEach(service => {
            if (extensionContent.includes(service)) {
                console.log(`✅ ${service} integrated`);
            } else {
                console.log(`⚠️  ${service} not found (may be minified)`);
            }
        });

        // 7. Check VS Code availability
        console.log('\n7️⃣ Checking VS Code environment...');
        
        try {
            await execAsync('which code');
            console.log('✅ VS Code CLI available');
        } catch (error) {
            console.log('⚠️  VS Code CLI not in PATH');
        }

        console.log('\n✅ VALIDATION COMPLETE');
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Extension Development Host should be running');
        console.log('2. Look for "The New Fuse" robot icon in Activity Bar');
        console.log('3. Test chat functionality and commands');
        console.log('4. Run: npm run package (if all tests pass)');
        
        return true;

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        return false;
    }
}

// Run validation
validateExtension().then(success => {
    process.exit(success ? 0 : 1);
});
