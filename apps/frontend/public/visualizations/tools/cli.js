#!/usr/bin/env node

import { VisualizationGenerator } from './generate.js';
import fs from 'fs';
import path from 'path';

/**
 * CLI for Self-Contained Visualization Generator
 */

const HELP_TEXT = `
╔═══════════════════════════════════════════════════════════════╗
║  Self-Contained Visualization Generator                      ║
╚═══════════════════════════════════════════════════════════════╝

Generate interactive HTML visualizations with embedded D3.js and data.

USAGE:
  scv [options]

OPTIONS:
  --config <file>      Path to JSON configuration file (required)
  --output <file>      Path to output HTML file (default: output.html)
  --data <file>        Path to JSON data file (overrides config.data)
  --template <file>    Path to custom template (optional)
  --title <text>       Visualization title (overrides config)
  --open               Open in browser after generation
  --help               Show this help message

EXAMPLES:
  # Generate from config file
  scv --config my-config.json --output viz.html

  # Generate with custom data
  scv --config config.json --data my-data.json --output result.html

  # Generate and open in browser
  scv --config config.json --output viz.html --open

  # Use custom template
  scv --config config.json --template custom.html --output viz.html

CONFIG FILE FORMAT:
  {
    "title": "My Visualization",
    "headerTitle": "📊 My Data",
    "headerSubtitle": "Interactive exploration",
    "data": {
      "name": "root",
      "children": [...]
    },
    "metrics": {
      "size": "Size",
      "count": "Count"
    },
    "defaultMetric": "size",
    "primaryColor": "#667eea"
  }

DATA FILE FORMAT:
  {
    "name": "root",
    "children": [
      {
        "name": "Category 1",
        "children": [
          { "name": "Item A", "size": 100, "count": 5 },
          { "name": "Item B", "size": 200, "count": 10 }
        ]
      }
    ]
  }

For more information, see README.md

`;

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {
    config: null,
    output: 'output.html',
    data: null,
    template: null,
    title: null,
    open: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--config':
        options.config = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--data':
        options.data = args[++i];
        break;
      case '--template':
        options.template = args[++i];
        break;
      case '--title':
        options.title = args[++i];
        break;
      case '--open':
        options.open = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          console.error('Use --help to see available options');
          process.exit(1);
        }
    }
  }

  return options;
}

/**
 * Validate options
 */
function validateOptions(options) {
  if (options.help) {
    return true;
  }

  if (!options.config) {
    console.error('Error: --config is required');
    console.error('Use --help to see usage information');
    return false;
  }

  if (!fs.existsSync(options.config)) {
    console.error(`Error: Config file not found: ${options.config}`);
    return false;
  }

  if (options.data && !fs.existsSync(options.data)) {
    console.error(`Error: Data file not found: ${options.data}`);
    return false;
  }

  if (options.template && !fs.existsSync(options.template)) {
    console.error(`Error: Template file not found: ${options.template}`);
    return false;
  }

  return true;
}

/**
 * Open file in browser
 */
async function openInBrowser(filePath) {
  const { exec } = await import('child_process');
  const absolutePath = path.resolve(filePath);

  const commands = {
    darwin: `open "${absolutePath}"`,
    win32: `start "" "${absolutePath}"`,
    linux: `xdg-open "${absolutePath}"`
  };

  const command = commands[process.platform];

  if (!command) {
    console.error('Unable to open browser on this platform');
    return;
  }

  exec(command, (error) => {
    if (error) {
      console.error('Error opening browser:', error.message);
    } else {
      console.log('✓ Opened in browser');
    }
  });
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Show help
  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Validate options
  if (!validateOptions(options)) {
    process.exit(1);
  }

  try {
    // Load configuration
    console.log('\n📋 Loading configuration...');
    const config = VisualizationGenerator.loadConfigFromFile(options.config);
    console.log(`✓ Loaded config: ${options.config}`);

    // Override with data file if provided
    if (options.data) {
      console.log('\n📊 Loading data...');
      config.data = VisualizationGenerator.loadDataFromFile(options.data);
      console.log(`✓ Loaded data: ${options.data}`);
      config.dataSource = path.basename(options.data);
    }

    // Override title if provided
    if (options.title) {
      config.title = options.title;
      config.headerTitle = options.title;
    }

    // Create generator
    const generatorOptions = {};
    if (options.template) {
      generatorOptions.templatePath = options.template;
    }

    const generator = new VisualizationGenerator(generatorOptions);

    // Generate visualization
    const html = await generator.generate(config);

    // Save to file
    await generator.saveToFile(html, options.output);

    console.log('\n✨ Generation complete!\n');

    // Open in browser if requested
    if (options.open) {
      await openInBrowser(options.output);
    } else {
      console.log(`To view: open ${options.output}`);
    }

    console.log('');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Run CLI
main();
