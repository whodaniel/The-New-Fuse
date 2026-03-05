#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Self-Contained Visualization Generator
 *
 * Generates a single HTML file with embedded D3.js, data, and visualization logic
 */

export class VisualizationGenerator {
  constructor(options = {}) {
    this.options = {
      templatePath: options.templatePath || path.join(__dirname, '../templates/visualization-template.html'),
      d3Version: options.d3Version || '7',
      version: '1.0.0',
      ...options
    };

    this.template = null;
    this.d3Library = null;
  }

  /**
   * Load the HTML template
   */
  loadTemplate() {
    if (!fs.existsSync(this.options.templatePath)) {
      throw new Error(`Template not found: ${this.options.templatePath}`);
    }

    this.template = fs.readFileSync(this.options.templatePath, 'utf-8');
    console.log('✓ Template loaded');
  }

  /**
   * Load D3.js library (for truly self-contained output)
   * Falls back to CDN link if local copy not found
   */
  async loadD3Library() {
    const d3Path = path.join(__dirname, `../lib/d3.v${this.options.d3Version}.min.js`);

    if (fs.existsSync(d3Path)) {
      this.d3Library = fs.readFileSync(d3Path, 'utf-8');
      console.log('✓ D3.js library loaded from local file');
    } else {
      // Use CDN as fallback
      this.d3Library = `// D3.js v${this.options.d3Version} - Load from CDN for now
// To make fully self-contained, download: https://d3js.org/d3.v${this.options.d3Version}.min.js
// and place in lib/ directory`;
      console.log(`⚠ D3.js not found locally, using CDN fallback`);
      console.log(`  Download: https://d3js.org/d3.v${this.options.d3Version}.min.js`);
      console.log(`  Save to: ${d3Path}`);
    }
  }

  /**
   * Generate visualization HTML from configuration
   */
  async generate(config) {
    console.log('\n🎨 Generating visualization...\n');

    // Load template and libraries
    this.loadTemplate();
    await this.loadD3Library();

    // Validate configuration
    this.validateConfig(config);

    // Build replacements object
    const replacements = this.buildReplacements(config);

    // Replace all placeholders
    let output = this.template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      output = output.replace(regex, value);
    }

    // Add D3 CDN script if needed (when library not embedded)
    if (!fs.existsSync(path.join(__dirname, `../lib/d3.v${this.options.d3Version}.min.js`))) {
      output = output.replace(
        '{{D3_LIBRARY}}',
        `// Using CDN - To make fully self-contained, download D3.js locally
  </script>
  <script src="https://cdn.jsdelivr.net/npm/d3@${this.options.d3Version}"></script>
  <script>`
      );
    }

    console.log('✓ Visualization generated');
    return output;
  }

  /**
   * Validate configuration object
   */
  validateConfig(config) {
    const required = ['data', 'title'];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!config.data.name) {
      throw new Error('Data must have a root "name" property');
    }
  }

  /**
   * Build all template replacements
   */
  buildReplacements(config) {
    const now = new Date().toISOString();

    // Default configuration
    const defaults = {
      title: 'Data Visualization',
      headerTitle: '📊 Interactive Treemap',
      headerSubtitle: 'Explore hierarchical data',
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      primaryColor: '#667eea',
      primaryColorDark: '#5a67d8',
      metrics: {
        size: 'Size',
        count: 'Count'
      },
      defaultMetric: 'size',
      padding: 2,
      topPadding: 20,
      colorScheme: 'schemeSet3',
      customCSS: '',
      customEventListeners: '',
      customRenderCode: '',
      customFunctions: '',
      dataSource: 'User provided',
      ...config
    };

    // Build formatters
    const formatters = {
      size: 'formatBytes',
      count: 'formatNumber',
      ...config.formatters
    };

    // Build controls HTML
    const controlsHTML = this.buildControlsHTML(defaults.metrics, defaults.defaultMetric);

    // Build configuration object for embedding
    const embeddedConfig = {
      padding: defaults.padding,
      topPadding: defaults.topPadding,
      colorScheme: defaults.colorScheme,
      metrics: defaults.metrics,
      defaultMetric: defaults.defaultMetric,
      formatters: formatters
    };

    // Build YAML-like config for comments
    const configYaml = Object.entries(embeddedConfig)
      .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return {
      TITLE: defaults.title,
      HEADER_TITLE: defaults.headerTitle,
      HEADER_SUBTITLE: defaults.headerSubtitle,
      BACKGROUND_GRADIENT: defaults.backgroundColor,
      PRIMARY_COLOR: defaults.primaryColor,
      PRIMARY_COLOR_DARK: defaults.primaryColorDark,
      CUSTOM_CSS: defaults.customCSS,
      CONTROLS_HTML: controlsHTML,
      D3_LIBRARY: this.d3Library,
      DATA_JSON: JSON.stringify(config.data, null, 2),
      CONFIG_JSON: JSON.stringify(embeddedConfig, null, 2),
      CUSTOM_EVENT_LISTENERS: defaults.customEventListeners,
      CUSTOM_RENDER_CODE: defaults.customRenderCode,
      CUSTOM_FUNCTIONS: defaults.customFunctions,
      GENERATED_DATE: now,
      VERSION: this.options.version,
      DATA_SOURCE: defaults.dataSource,
      CONFIG_YAML: configYaml
    };
  }

  /**
   * Build controls HTML based on metrics
   */
  buildControlsHTML(metrics, defaultMetric) {
    const options = Object.entries(metrics)
      .map(([key, label]) => {
        const selected = key === defaultMetric ? ' selected' : '';
        return `<option value="${key}"${selected}>${label}</option>`;
      })
      .join('\n        ');

    return `
      <label for="sizeMetric">Metric:</label>
      <select id="sizeMetric">
        ${options}
      </select>

      <button id="resetBtn">↺ Reset View</button>
    `.trim();
  }

  /**
   * Save generated HTML to file
   */
  async saveToFile(html, outputPath) {
    const dir = path.dirname(outputPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html, 'utf-8');

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✓ Saved to: ${outputPath}`);
    console.log(`  Size: ${sizeKB} KB`);
  }

  /**
   * Load configuration from JSON file
   */
  static loadConfigFromFile(configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Load data from JSON file
   */
  static loadDataFromFile(dataPath) {
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content);
  }
}

/**
 * Quick generation function
 */
export async function generateVisualization(config, outputPath) {
  const generator = new VisualizationGenerator();
  const html = await generator.generate(config);

  if (outputPath) {
    await generator.saveToFile(html, outputPath);
  }

  return html;
}

export default VisualizationGenerator;
