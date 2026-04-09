#!/usr/bin/env node
/**
 * Bundle Size Analyzer
 * Analyzes bundle sizes and provides detailed breakdown
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

class BundleAnalyzer {
  constructor(distPath) {
    this.distPath = distPath;
    this.results = {
      total: 0,
      gzipped: 0,
      files: [],
      byType: {},
      warnings: [],
      recommendations: [],
    };
  }

  /**
   * Analyze bundle
   */
  analyze() {
    console.log('📊 Analyzing bundle size...\n');

    if (!fs.existsSync(this.distPath)) {
      console.error(`❌ Distribution folder not found: ${this.distPath}`);
      process.exit(1);
    }

    this.scanDirectory(this.distPath);
    this.generateReport();
    this.checkBudgets();
    this.saveResults();

    return this.results;
  }

  /**
   * Scan directory recursively
   */
  scanDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);
      const relPath = path.join(relativePath, entry);

      if (stats.isDirectory()) {
        this.scanDirectory(fullPath, relPath);
      } else {
        this.analyzeFile(fullPath, relPath, stats.size);
      }
    }
  }

  /**
   * Analyze individual file
   */
  analyzeFile(filePath, relativePath, size) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath);
    const gzipped = gzipSync(content).length;

    const fileInfo = {
      path: relativePath,
      size,
      gzipped,
      compression: ((1 - gzipped / size) * 100).toFixed(1),
      type: this.getFileType(ext),
    };

    this.results.files.push(fileInfo);
    this.results.total += size;
    this.results.gzipped += gzipped;

    // Group by type
    if (!this.results.byType[fileInfo.type]) {
      this.results.byType[fileInfo.type] = {
        size: 0,
        gzipped: 0,
        count: 0,
      };
    }

    this.results.byType[fileInfo.type].size += size;
    this.results.byType[fileInfo.type].gzipped += gzipped;
    this.results.byType[fileInfo.type].count++;
  }

  /**
   * Get file type
   */
  getFileType(ext) {
    const typeMap = {
      '.js': 'JavaScript',
      '.mjs': 'JavaScript',
      '.css': 'CSS',
      '.html': 'HTML',
      '.png': 'Image',
      '.jpg': 'Image',
      '.jpeg': 'Image',
      '.gif': 'Image',
      '.svg': 'Image',
      '.webp': 'Image',
      '.woff': 'Font',
      '.woff2': 'Font',
      '.ttf': 'Font',
      '.eot': 'Font',
      '.json': 'JSON',
      '.map': 'Source Map',
    };

    return typeMap[ext] || 'Other';
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('📦 Bundle Size Report');
    console.log('='.repeat(80));
    console.log(`Total Size: ${this.formatSize(this.results.total)}`);
    console.log(`Gzipped: ${this.formatSize(this.results.gzipped)}`);
    console.log(
      `Compression: ${((1 - this.results.gzipped / this.results.total) * 100).toFixed(1)}%`
    );
    console.log('');

    console.log('By File Type:');
    console.log('-'.repeat(80));
    console.log(
      `${'Type'.padEnd(20)} ${'Files'.padEnd(10)} ${'Size'.padEnd(15)} ${'Gzipped'.padEnd(15)}`
    );
    console.log('-'.repeat(80));

    for (const [type, data] of Object.entries(this.results.byType)) {
      console.log(
        `${type.padEnd(20)} ${String(data.count).padEnd(10)} ${this.formatSize(data.size).padEnd(15)} ${this.formatSize(data.gzipped).padEnd(15)}`
      );
    }

    console.log('');
    console.log('Largest Files:');
    console.log('-'.repeat(80));

    const largestFiles = this.results.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    for (const file of largestFiles) {
      console.log(`${file.path}`);
      console.log(`  Size: ${this.formatSize(file.size)} (gzipped: ${this.formatSize(file.gzipped)})`);
    }

    console.log('');
  }

  /**
   * Check against budgets
   */
  checkBudgets() {
    const budgets = {
      total: 500 * 1024, // 500KB
      gzipped: 150 * 1024, // 150KB
      js: 250 * 1024, // 250KB
      css: 50 * 1024, // 50KB
    };

    console.log('📊 Budget Check:');
    console.log('-'.repeat(80));

    // Check total size
    this.checkBudget('Total', this.results.total, budgets.total);
    this.checkBudget('Gzipped', this.results.gzipped, budgets.gzipped);

    // Check by type
    if (this.results.byType.JavaScript) {
      this.checkBudget('JavaScript', this.results.byType.JavaScript.size, budgets.js);
    }

    if (this.results.byType.CSS) {
      this.checkBudget('CSS', this.results.byType.CSS.size, budgets.css);
    }

    console.log('');

    // Generate recommendations
    if (this.results.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      for (const warning of this.results.warnings) {
        console.log(`  - ${warning}`);
      }
      console.log('');
    }

    if (this.results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      for (const rec of this.results.recommendations) {
        console.log(`  - ${rec}`);
      }
      console.log('');
    }
  }

  /**
   * Check individual budget
   */
  checkBudget(name, actual, budget) {
    const percentage = (actual / budget) * 100;
    const status = percentage <= 90 ? '✓' : percentage <= 100 ? '⚠' : '✗';
    const color = percentage <= 90 ? '\x1b[32m' : percentage <= 100 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `${color}${status}${reset} ${name}: ${this.formatSize(actual)} / ${this.formatSize(budget)} (${percentage.toFixed(1)}%)`
    );

    if (percentage > 100) {
      this.results.warnings.push(
        `${name} exceeds budget by ${this.formatSize(actual - budget)}`
      );
    } else if (percentage > 90) {
      this.results.warnings.push(`${name} is approaching budget limit`);
    }
  }

  /**
   * Format size
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  /**
   * Save results
   */
  saveResults() {
    const outputPath = path.join(this.distPath, 'bundle-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Full report saved to: ${outputPath}\n`);

    // Generate HTML report
    this.generateHTMLReport();
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { margin-bottom: 2rem; color: #333; }
    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat {
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
      border-left: 4px solid #007bff;
    }
    .stat-label { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #333; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9f9f9;
      font-weight: 600;
      color: #666;
    }
    .warning { color: #ff9800; }
    .error { color: #f44336; }
    .success { color: #4caf50; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Bundle Analysis Report</h1>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total Size</div>
        <div class="stat-value">${this.formatSize(this.results.total)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Gzipped Size</div>
        <div class="stat-value">${this.formatSize(this.results.gzipped)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Compression</div>
        <div class="stat-value">${((1 - this.results.gzipped / this.results.total) * 100).toFixed(1)}%</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total Files</div>
        <div class="stat-value">${this.results.files.length}</div>
      </div>
    </div>

    <div class="card">
      <h2>By File Type</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Files</th>
            <th>Size</th>
            <th>Gzipped</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(this.results.byType)
            .map(
              ([type, data]) => `
            <tr>
              <td>${type}</td>
              <td>${data.count}</td>
              <td>${this.formatSize(data.size)}</td>
              <td>${this.formatSize(data.gzipped)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Largest Files</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Size</th>
            <th>Gzipped</th>
            <th>Compression</th>
          </tr>
        </thead>
        <tbody>
          ${this.results.files
            .sort((a, b) => b.size - a.size)
            .slice(0, 20)
            .map(
              (file) => `
            <tr>
              <td>${file.path}</td>
              <td>${this.formatSize(file.size)}</td>
              <td>${this.formatSize(file.gzipped)}</td>
              <td>${file.compression}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;

    const htmlPath = path.join(this.distPath, 'bundle-analysis.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML report saved to: ${htmlPath}\n`);
  }
}

// Run if executed directly
if (require.main === module) {
  const distPath = process.argv[2] || path.join(__dirname, '../../apps/frontend/dist');
  const analyzer = new BundleAnalyzer(distPath);
  const results = analyzer.analyze();

  // Exit with error if budgets exceeded
  if (results.warnings.some((w) => w.includes('exceeds budget'))) {
    process.exit(1);
  }
}

module.exports = { BundleAnalyzer };
