#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create .vsix package manually using Node.js
async function createVsixPackage() {
    try {
        console.log('Creating VSIX package...');
        
        // Read package.json to get extension info
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const extensionName = packageJson.name || 'the-new-fuse';
        const version = packageJson.version || '0.0.1';
        const publisher = packageJson.publisher || 'the-new-fuse';
        
        const vsixFileName = `${publisher}.${extensionName}-${version}.vsix`;
        
        console.log(`Package name: ${vsixFileName}`);
        
        // Files to include in the package
        const filesToInclude = [
            'package.json',
            'README.md',
            'CHANGELOG.md',
            'dist/',
            'media/',
            'src/',
            '.vscodeignore'
        ];
        
        // Create a temporary directory for packaging
        const tempDir = './temp-vsix';
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempDir);
        
        // Copy files to temp directory
        for (const file of filesToInclude) {
            if (fs.existsSync(file)) {
                const targetPath = path.join(tempDir, file);
                
                if (fs.statSync(file).isDirectory()) {
                    // Copy directory recursively
                    await copyDirectory(file, targetPath);
                } else {
                    // Copy file
                    fs.copyFileSync(file, targetPath);
                }
                console.log(`Copied: ${file}`);
            } else {
                console.log(`Skipping missing file: ${file}`);
            }
        }
        
        // Create [Content_Types].xml
        const contentTypesXml = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="json" ContentType="application/json" />
    <Default Extension="js" ContentType="application/javascript" />
    <Default Extension="md" ContentType="text/markdown" />
    <Default Extension="png" ContentType="image/png" />
    <Default Extension="jpg" ContentType="image/jpeg" />
    <Default Extension="gif" ContentType="image/gif" />
    <Default Extension="svg" ContentType="image/svg+xml" />
    <Default Extension="txt" ContentType="text/plain" />
    <Default Extension="ts" ContentType="text/typescript" />
    <Override PartName="/extension.vsixmanifest" ContentType="text/xml" />
</Types>`;
        
        fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml);
        
        // Create extension.vsixmanifest
        const manifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${extensionName}" Version="${version}" Publisher="${publisher}"/>
    <DisplayName>${packageJson.displayName || extensionName}</DisplayName>
    <Description>${packageJson.description || 'VS Code Extension'}</Description>
    <Categories>${packageJson.categories ? packageJson.categories.join(',') : 'Other'}</Categories>
    <Tags>${packageJson.keywords ? packageJson.keywords.join(',') : ''}</Tags>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" Version="[${packageJson.engines.vscode}]"/>
  </Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="package.json" Addressable="true" />
  </Assets>
</PackageManifest>`;
        
        fs.writeFileSync(path.join(tempDir, 'extension.vsixmanifest'), manifest);
        
        // Use zip to create the .vsix file (which is just a renamed zip)
        console.log('Creating zip archive...');
        
        return new Promise((resolve, reject) => {
            const zipCommand = `cd "${tempDir}" && zip -r "../${vsixFileName}" . -x "*.DS_Store*"`;
            
            exec(zipCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error creating zip:', error);
                    reject(error);
                    return;
                }
                
                console.log('Zip created successfully');
                
                // Clean up temp directory
                fs.rmSync(tempDir, { recursive: true, force: true });
                
                if (fs.existsSync(vsixFileName)) {
                    const stats = fs.statSync(vsixFileName);
                    console.log(`\n✅ SUCCESS! Created ${vsixFileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                    console.log(`\nTo install: code --install-extension ${vsixFileName}`);
                    resolve(vsixFileName);
                } else {
                    reject(new Error('VSIX file was not created'));
                }
            });
        });
        
    } catch (error) {
        console.error('Error creating VSIX package:', error);
        throw error;
    }
}

// Helper function to copy directory recursively
async function copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Run the package creation
if (require.main === module) {
    createVsixPackage()
        .then(filename => {
            console.log('Package creation completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Package creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createVsixPackage };
