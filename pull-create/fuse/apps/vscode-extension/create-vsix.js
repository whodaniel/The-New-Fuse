#!/usr/bin/env node

/**
 * VSIX Package Creation Script for The New Fuse Extension
 * Creates a deployable .vsix package from the extension source
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VSIXPackager {
    constructor() {
        this.extensionDir = __dirname;
        this.packageName = 'the-new-fuse';
        this.version = this.getVersion();
    }

    getVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version || '1.0.0';
        } catch {
            console.warn('Could not read version from package.json, using default');
            return '1.0.0';
        }
    }

    checkVSCE() {
        try {
            execSync('npx vsce --version', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }

    installVSCE() {
        console.log('📦 Installing VS Code Extension Manager (vsce)...');
        try {
            execSync('npm install -g @vscode/vsce', { stdio: 'inherit' });
            console.log('✅ VSCE installed successfully');
        } catch (error) {
            console.error('❌ Failed to install vsce:', error.message);
            throw error;
        }
    }

    createVSIX() {
        const outputFileName = `${this.packageName}-${this.version}.vsix`;

        console.log(`🔨 Creating VSIX package: ${outputFileName}`);
        console.log(`📁 Extension directory: ${this.extensionDir}`);

        try {
            // Create the VSIX package
            execSync(`npx vsce package --out "${outputFileName}"`, {
                stdio: 'inherit',
                cwd: this.extensionDir
            });

            console.log(`✅ VSIX package created successfully: ${outputFileName}`);
            return outputFileName;
        } catch (error) {
            console.error('❌ Failed to create VSIX package:', error.message);
            throw error;
        }
    }

    verifyPackage(vsixFile) {
        console.log(`🔍 Verifying package: ${vsixFile}`);

        if (!fs.existsSync(vsixFile)) {
            throw new Error(`VSIX file not found: ${vsixFile}`);
        }

        const stats = fs.statSync(vsixFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ Package verified:`);
        console.log(`   📊 Size: ${fileSizeMB} MB`);
        console.log(`   📅 Created: ${stats.birthtime}`);

        return {
            fileName: vsixFile,
            size: stats.size,
            sizeMB: fileSizeMB,
            created: stats.birthtime
        };
    }

    run() {
        console.log('🚀 Starting The New Fuse VSIX packaging process...\n');

        try {
            // Check if vsce is installed
            if (!this.checkVSCE()) {
                this.installVSCE();
            }

            // Create the VSIX package
            const vsixFile = this.createVSIX();

            // Verify the package
            const packageInfo = this.verifyPackage(vsixFile);

            console.log('\n🎉 VSIX packaging completed successfully!');
            console.log(`📦 Package: ${packageInfo.fileName}`);
            console.log(`📊 Size: ${packageInfo.sizeMB} MB`);
            console.log('\n📋 Installation Instructions:');
            console.log(`   1. Open VS Code`);
            console.log(`   2. Go to Extensions (Ctrl+Shift+X)`);
            console.log(`   3. Click "..." menu → "Install from VSIX..."`);
            console.log(`   4. Select: ${vsixFile}`);
            console.log(`   5. Reload VS Code when prompted`);

            return packageInfo;

        } catch (error) {
            console.error('\n❌ VSIX packaging failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the packager if this script is executed directly
const packager = new VSIXPackager();
packager.run();