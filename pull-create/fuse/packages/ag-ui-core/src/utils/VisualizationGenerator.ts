/**
 * Embedded Visualization Generator for AG-UI Core
 *
 * Generates self-contained HTML visualizations from data configurations.
 */

export interface VisualizationConfig {
  title: string;
  data: any;
  type: string;
  aiInsights?: string;
  metadata?: Record<string, any>;
}

export class VisualizationGenerator {
  async generate(config: VisualizationConfig): Promise<string> {
    const jsonString = JSON.stringify(config.data, null, 2);
    const metadataString = JSON.stringify(config.metadata || {}, null, 2);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${config.title} - The New Fuse AG-UI</title>
    <style>
        body { font-family: -apple-system, sans-serif; padding: 2rem; background: #f0f4f8; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
        .metadata { font-size: 0.9rem; color: #718096; margin-bottom: 2rem; }
        .insights { background: #ebf8ff; border-left: 4px solid #4299e1; padding: 1rem; margin: 2rem 0; }
        pre { background: #2d3748; color: #fff; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        .viz-placeholder { height: 400px; background: #edf2f7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #a0aec0; border: 2px dashed #cbd5e0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${config.title}</h1>
        <div class="metadata">
            Generated via AG-UI Protocol <br>
            Timestamp: ${new Date().toISOString()} <br>
            Type: ${config.type}
        </div>

        ${config.aiInsights ? `<div class="insights">${config.aiInsights}</div>` : ''}

        <div class="viz-placeholder">
            [ Interactive Visualization: ${config.type} ]
            <br>
            (Data loaded successfully)
        </div>

        <h3>Data Payload</h3>
        <pre>${jsonString}</pre>

        <h3>Metadata</h3>
        <pre>${metadataString}</pre>
    </div>
</body>
</html>`;
  }
}
