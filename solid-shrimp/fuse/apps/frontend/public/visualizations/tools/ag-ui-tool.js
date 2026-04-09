#!/usr/bin/env node

/**
 * AG-UI Tool Integration for Self-Contained Visualizations
 *
 * This module exposes our visualization generator as an AG-UI tool
 * that can be used by Microsoft Agent Framework, LangGraph, CrewAI, etc.
 */

import { VisualizationGenerator } from './generate.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AG-UI Tool: Generate Self-Contained Visualization
 *
 * Purpose: Allows AI agents to create shareable, permanent HTML visualizations
 * from hierarchical data with optional AI-generated insights.
 */
export const AGUIVisualizationTool = {
  // Tool metadata for AG-UI protocol
  name: "generate_visualization",
  description: "Generate an interactive, self-contained HTML visualization from hierarchical data. Creates a single HTML file with embedded D3.js, data, and visualization logic. Perfect for sharing, archival, and offline viewing.",

  // Input schema (JSON Schema format)
  inputSchema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        description: "Hierarchical data structure with 'name' and optional 'children' array",
        required: ["name"],
        properties: {
          name: { type: "string" },
          children: { type: "array" },
          // Additional numeric properties become metrics
        }
      },
      title: {
        type: "string",
        description: "Visualization title",
        default: "Data Visualization"
      },
      subtitle: {
        type: "string",
        description: "Visualization subtitle",
        default: "Interactive exploration"
      },
      metrics: {
        type: "object",
        description: "Metrics to display (e.g., {\"size\": \"Bundle Size\", \"count\": \"Item Count\"})",
        default: { size: "Size", count: "Count" }
      },
      defaultMetric: {
        type: "string",
        description: "Default metric to display",
        default: "size"
      },
      aiInsights: {
        type: "string",
        description: "AI-generated insights or recommendations (HTML format)",
        default: null
      },
      colorScheme: {
        type: "string",
        description: "D3 color scheme (schemeSet3, schemeCategory10, etc.)",
        default: "schemeSet3"
      },
      primaryColor: {
        type: "string",
        description: "Primary color for UI elements (hex code)",
        default: "#667eea"
      },
      outputPath: {
        type: "string",
        description: "Output file path (relative or absolute)",
        default: null  // Auto-generate if not provided
      }
    },
    required: ["data"]
  },

  // Output schema
  outputSchema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      filePath: { type: "string", description: "Path to generated HTML file" },
      fileSize: { type: "number", description: "File size in bytes" },
      url: { type: "string", description: "file:// URL to open in browser" },
      message: { type: "string" }
    }
  },

  /**
   * Execute the tool
   */
  async execute(params) {
    try {
      console.log('🎨 AG-UI Tool: Generating visualization...');

      // Validate data structure
      if (!params.data || !params.data.name) {
        throw new Error('Data must have a root "name" property');
      }

      // Auto-generate output path if not provided
      let outputPath = params.outputPath;
      if (!outputPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const sanitizedTitle = (params.title || 'visualization')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        outputPath = path.join(__dirname, '../output', `${sanitizedTitle}-${timestamp}.html`);
      }

      // Build configuration
      const config = {
        title: params.title || 'Data Visualization',
        headerTitle: params.title || '📊 Interactive Treemap',
        headerSubtitle: params.subtitle || 'Explore hierarchical data',
        data: params.data,
        metrics: params.metrics || { size: 'Size', count: 'Count' },
        defaultMetric: params.defaultMetric || 'size',
        colorScheme: params.colorScheme || 'schemeSet3',
        primaryColor: params.primaryColor || '#667eea',
        primaryColorDark: this.darkenColor(params.primaryColor || '#667eea'),
        dataSource: 'AG-UI Agent Generated',
        customHTML: params.aiInsights ? `
          <div class="ai-insights" style="
            background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
            border-left: 4px solid ${params.primaryColor || '#667eea'};
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 8px;
          ">
            <h3 style="margin: 0 0 12px 0; color: #2d3748; font-size: 16px;">
              🤖 AI Analysis
            </h3>
            <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
              ${params.aiInsights}
            </div>
          </div>
        ` : ''
      };

      // Generate visualization
      const generator = new VisualizationGenerator();
      const html = await generator.generate(config);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save to file
      await generator.saveToFile(html, outputPath);

      // Get file stats
      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      // Build file:// URL
      const absolutePath = path.resolve(outputPath);
      const fileUrl = `file://${absolutePath}`;

      console.log('✓ Visualization generated successfully');
      console.log(`  Path: ${outputPath}`);
      console.log(`  Size: ${fileSizeKB} KB`);

      // Return AG-UI tool result
      return {
        success: true,
        filePath: absolutePath,
        fileSize: stats.size,
        url: fileUrl,
        message: `Successfully generated visualization: ${path.basename(outputPath)} (${fileSizeKB} KB). Open in browser: ${fileUrl}`
      };

    } catch (error) {
      console.error('❌ Error generating visualization:', error.message);

      return {
        success: false,
        error: error.message,
        message: `Failed to generate visualization: ${error.message}`
      };
    }
  },

  /**
   * Darken a hex color by 10%
   */
  darkenColor(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Darken by 10%
    const darken = (c) => Math.max(0, Math.floor(c * 0.9));

    // Convert back to hex
    const toHex = (c) => c.toString(16).padStart(2, '0');
    return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
  }
};

/**
 * Microsoft Agent Framework Integration
 *
 * Example usage with Microsoft's Agent Framework
 */
export class MicrosoftAgentTool {
  constructor() {
    this.name = AGUIVisualizationTool.name;
    this.description = AGUIVisualizationTool.description;
  }

  // Microsoft Agent Framework tool interface
  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      parameters: AGUIVisualizationTool.inputSchema
    };
  }

  async invoke(params) {
    return await AGUIVisualizationTool.execute(params);
  }
}

/**
 * LangGraph/LangChain Integration
 *
 * Example usage with LangGraph
 */
export class LangGraphTool {
  constructor() {
    this.name = AGUIVisualizationTool.name;
    this.description = AGUIVisualizationTool.description;
  }

  // LangChain/LangGraph tool interface
  get schema() {
    return AGUIVisualizationTool.inputSchema;
  }

  async _call(params) {
    return await AGUIVisualizationTool.execute(params);
  }
}

/**
 * Standalone CLI for testing
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n🔧 AG-UI Visualization Tool - Test Mode\n');

  // Example test data
  const testData = {
    data: {
      name: "root",
      children: [
        {
          name: "Category A",
          children: [
            { name: "Item 1", size: 100, count: 5 },
            { name: "Item 2", size: 200, count: 10 }
          ]
        },
        {
          name: "Category B",
          children: [
            { name: "Item 3", size: 150, count: 7 },
            { name: "Item 4", size: 250, count: 12 }
          ]
        }
      ]
    },
    title: "Test Visualization",
    subtitle: "Generated by AG-UI Tool",
    aiInsights: `
      <p><strong>Key Findings:</strong></p>
      <ul>
        <li>Category B contains larger items on average (200 vs 150)</li>
        <li>Item 4 is the largest single item at 250 units</li>
        <li>Total count across all items: 34</li>
      </ul>
      <p><strong>Recommendation:</strong> Consider optimizing Category B items for better performance.</p>
    `,
    primaryColor: "#3b82f6"
  };

  // Execute tool
  const result = await AGUIVisualizationTool.execute(testData);

  console.log('\n📊 Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✨ Success! Open the file:');
    console.log(`   ${result.url}`);
  }
}

export default AGUIVisualizationTool;
