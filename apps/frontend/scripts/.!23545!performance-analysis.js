#!/usr/bin/env node
/**
 * Frontend Performance Analysis
 * Analyzes build output and generates performance reports
 */

const fs = require('fs');
const path = require('path');
const { gzipSync, brotliCompressSync } = require('zlib');

const DIST_PATH = path.join(__dirname, '../dist');
const BUDGETS = {
  total: 500 * 1024, // 500KB
  js: 250 * 1024, // 250KB
  css: 50 * 1024, // 50KB
  images: 100 * 1024, // 100KB
  fonts: 150 * 1024, // 150KB
};

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      files: [],
      budgets: {},
      recommendations: [],
    };
  }

  analyze() {
    console.log('= Analyzing frontend performance...\n');

    if (!fs.existsSync(DIST_PATH)) {
      console.error('L Build output not found. Run `pnpm build` first.');
      process.exit(1);
    }

    this.scanFiles();
    this.calculateSummary();
    this.checkBudgets();
    this.generateRecommendations();
    this.printReport();
    this.saveReport();
  }

  scanFiles(dir = DIST_PATH, basePath = '') {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.join(basePath, entry);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        this.scanFiles(fullPath, relativePath);
      } else {
        this.analyzeFile(fullPath, relativePath);
      }
    }
  }

  analyzeFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath);
    const size = content.length;
    const gzipped = gzipSync(content).length;
    const brotli = brotliCompressSync(content).length;

    const fileInfo = {
      path: relativePath,
      size,
      gzipped,
      brotli,
      type: this.getFileType(filePath),
      compressionRatio: ((1 - gzipped / size) * 100).toFixed(1),
    };

    this.results.files.push(fileInfo);
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'js',
      '.mjs': 'js',
      '.css': 'css',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.webp': 'image',
      '.avif': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font',
    };
    return typeMap[ext] || 'other';
  }

  calculateSummary() {
    const summary = {
      total: { size: 0, gzipped: 0, brotli: 0, count: 0 },
      js: { size: 0, gzipped: 0, brotli: 0, count: 0 },
      css: { size: 0, gzipped: 0, brotli: 0, count: 0 },
      image: { size: 0, gzipped: 0, brotli: 0, count: 0 },
      font: { size: 0, gzipped: 0, brotli: 0, count: 0 },
      other: { size: 0, gzipped: 0, brotli: 0, count: 0 },
    };

    for (const file of this.results.files) {
      summary.total.size += file.size;
      summary.total.gzipped += file.gzipped;
      summary.total.brotli += file.brotli;
      summary.total.count++;

      if (summary[file.type]) {
        summary[file.type].size += file.size;
        summary[file.type].gzipped += file.gzipped;
        summary[file.type].brotli += file.brotli;
        summary[file.type].count++;
      }
    }

    this.results.summary = summary;
  }

  checkBudgets() {
    const budgets = {
      total: this.checkBudget('Total', this.results.summary.total.gzipped, BUDGETS.total),
      js: this.checkBudget('JavaScript', this.results.summary.js.gzipped, BUDGETS.js),
      css: this.checkBudget('CSS', this.results.summary.css.gzipped, BUDGETS.css),
      images: this.checkBudget('Images', this.results.summary.image.size, BUDGETS.images),
      fonts: this.checkBudget('Fonts', this.results.summary.font.size, BUDGETS.fonts),
    };

    this.results.budgets = budgets;
  }

  checkBudget(name, actual, budget) {
    const percentage = (actual / budget) * 100;
    const status = percentage <= 90 ? 'pass' : percentage <= 100 ? 'warn' : 'fail';

    return {
      name,
      actual,
      budget,
      percentage: percentage.toFixed(1),
      status,
    };
  }

  generateRecommendations() {
    const { summary, files } = this.results;

    // Check for large JavaScript files
    const largeJsFiles = files
      .filter(f => f.type === 'js' && f.gzipped > 100 * 1024)
      .sort((a, b) => b.gzipped - a.gzipped);

    if (largeJsFiles.length > 0) {
      this.results.recommendations.push({
        type: 'optimization',
        severity: 'high',
        message: `${largeJsFiles.length} JavaScript file(s) exceed 100KB (gzipped)`,
        action: 'Consider code splitting or lazy loading for these modules',
        files: largeJsFiles.slice(0, 5).map(f => f.path),
      });
    }

    // Check for unoptimized images
    const unoptimizedImages = files
      .filter(f => f.type === 'image' && f.compressionRatio < 10)
      .sort((a, b) => b.size - a.size);

    if (unoptimizedImages.length > 0) {
      this.results.recommendations.push({
        type: 'optimization',
        severity: 'medium',
        message: `${unoptimizedImages.length} image(s) have poor compression`,
        action: 'Optimize images using WebP or AVIF formats',
        files: unoptimizedImages.slice(0, 5).map(f => f.path),
      });
    }

    // Check for multiple font files
    if (summary.font.count > 5) {
      this.results.recommendations.push({
        type: 'optimization',
        severity: 'medium',
        message: `${summary.font.count} font files detected`,
        action: 'Consider reducing the number of font weights/variants or using system fonts',
      });
    }

    // Check for CSS size
    if (summary.css.gzipped > BUDGETS.css * 0.9) {
      this.results.recommendations.push({
        type: 'optimization',
        severity: 'medium',
        message: 'CSS bundle approaching size budget',
        action: 'Consider removing unused CSS or splitting into critical/non-critical CSS',
      });
    }
  }

  printReport() {
