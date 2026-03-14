const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const exampleConfigPath = path.join(__dirname, '..', 'config.example.json');

  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  console.warn('⚠️  config.json not found, using default paths from config.example.json');
  if (fs.existsSync(exampleConfigPath)) {
    return JSON.parse(fs.readFileSync(exampleConfigPath, 'utf-8'));
  }

  throw new Error('Configuration file not found. Please copy config.example.json to config.json and configure your paths.');
}

module.exports = loadConfig();
