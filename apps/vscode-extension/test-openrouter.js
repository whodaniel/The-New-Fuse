/**
 * Test script to configure OpenRouter in VSCode settings
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// VSCode user settings path
const vscodeSettingsPath = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Code',
  'User',
  'settings.json'
);

console.log('📝 Configuring OpenRouter in VSCode settings...');
console.log(`Settings path: ${vscodeSettingsPath}`);

// Read current settings
let settings = {};
try {
  if (fs.existsSync(vscodeSettingsPath)) {
    const content = fs.readFileSync(vscodeSettingsPath, 'utf8');
    settings = JSON.parse(content);
    console.log('✅ Current settings loaded');
  }
} catch (error) {
  console.log('⚠️  Creating new settings file');
}

// Configure OpenRouter
settings['theNewFuse.llmProviders'] = settings['theNewFuse.llmProviders'] || {};
settings['theNewFuse.llmProviders'].openrouter = {
  enabled: true,
  apiKey: 'REPLACE_WITH_YOUR_OPENROUTER_API_KEY',
  baseURL: 'https://openrouter.ai/api/v1',
  models: [],
};

settings['theNewFuse.selectedProvider'] = 'openrouter';
settings['theNewFuse.selectedModel'] = 'x-ai/grok-4-fast:free';

// Write updated settings
try {
  fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
  console.log('✅ OpenRouter configured successfully!');
  console.log('\n📋 Configuration:');
  console.log('  - Provider: OpenRouter');
  console.log('  - API Key: sk-or-v1-48c8...5421913 (configured)');
  console.log('  - Base URL: https://openrouter.ai/api/v1');
  console.log('  - Selected Model: x-ai/grok-4-fast:free');
  console.log('\n🔄 Please reload VSCode window to apply changes');
  console.log('   Use: Cmd+Shift+P → "Developer: Reload Window"');
} catch (error) {
  console.error('❌ Error writing settings:', error.message);
  process.exit(1);
}
