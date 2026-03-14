/**
 * Personal Data Manager
 *
 * Manages user's personal knowledge base location and data organization.
 * This makes the application truly multi-user ready.
 */

const fs = require('fs');
const path = require('path');

class PersonalDataManager {
  constructor(appRootDir) {
    this.appRootDir = appRootDir || __dirname;
    this.configFile = path.join(this.appRootDir, 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * Load application configuration
   */
  loadConfig() {
    if (fs.existsSync(this.configFile)) {
      return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
    }
    return { personalDataPath: null };
  }

  /**
   * Save application configuration
   */
  saveConfig() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
  }

  /**
   * Check if personal data location is configured
   */
  isConfigured() {
    return this.config.personalDataPath && fs.existsSync(this.config.personalDataPath);
  }

  /**
   * Get personal data path
   */
  getPersonalDataPath() {
    if (!this.isConfigured()) {
      throw new Error('Personal data location not configured. Run setup-personal-knowledge-base.js');
    }
    return this.config.personalDataPath;
  }

  /**
   * Set personal data path
   */
  setPersonalDataPath(dataPath) {
    this.config.personalDataPath = dataPath;
    this.config.lastUpdated = new Date().toISOString();
    this.saveConfig();
  }

  /**
   * Get video library path
   */
  getVideoLibraryPath() {
    return path.join(this.getPersonalDataPath(), 'video-library', 'ai_video_library.html');
  }

  /**
   * Get video reports directory
   */
  getVideoReportsDir() {
    return path.join(this.getPersonalDataPath(), 'video-reports');
  }

  /**
   * Get knowledge base directory
   */
  getKnowledgeBaseDir() {
    return path.join(this.getPersonalDataPath(), 'knowledge-base');
  }

  /**
   * Get consolidated knowledge base path
   */
  getConsolidatedKBPath() {
    return path.join(this.getKnowledgeBaseDir(), 'consolidated_ai_knowledge.md');
  }

  /**
   * Get exports directory
   */
  getExportsDir() {
    return path.join(this.getPersonalDataPath(), 'exports');
  }

  /**
   * Get processing logs directory
   */
  getProcessingLogsDir() {
    return path.join(this.getPersonalDataPath(), 'processing-logs');
  }

  /**
   * Get config directory
   */
  getConfigDir() {
    return path.join(this.getPersonalDataPath(), 'config');
  }

  /**
   * Load personal processing config
   */
  loadProcessingConfig() {
    const configPath = path.join(this.getConfigDir(), 'processing-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return null;
  }

  /**
   * Load personal preferences
   */
  loadPreferences() {
    const prefsPath = path.join(this.getConfigDir(), 'preferences.json');
    if (fs.existsSync(prefsPath)) {
      return JSON.parse(fs.readFileSync(prefsPath, 'utf-8'));
    }
    return null;
  }

  /**
   * Load personal stats
   */
  loadStats() {
    const statsPath = path.join(this.getConfigDir(), 'stats.json');
    if (fs.existsSync(statsPath)) {
      return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    }
    return null;
  }

  /**
   * Update personal stats
   */
  updateStats(updates) {
    const statsPath = path.join(this.getConfigDir(), 'stats.json');
    let stats = this.loadStats() || {
      totalVideos: 0,
      processedVideos: 0,
      totalCost: 0,
      lastUpdated: new Date().toISOString()
    };

    stats = { ...stats, ...updates, lastUpdated: new Date().toISOString() };
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    return stats;
  }

  /**
   * Get all video reports
   */
  getAllReports() {
    const reportsDir = this.getVideoReportsDir();
    if (!fs.existsSync(reportsDir)) {
      return [];
    }

    return fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(reportsDir, f));
  }

  /**
   * Check if video is processed
   */
  isVideoProcessed(videoId, index) {
    const reportsDir = this.getVideoReportsDir();
    if (!fs.existsSync(reportsDir)) {
      return false;
    }

    const files = fs.readdirSync(reportsDir);
    return files.some(f => f.includes(videoId) || f.includes(`_${index}_`));
  }

  /**
   * Save report
   */
  saveReport(videoId, index, content) {
    const reportsDir = this.getVideoReportsDir();
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `api_${index}_${videoId}.md`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Generate consolidated knowledge base
   */
  generateConsolidatedKB() {
    const reports = this.getAllReports();
    const kbPath = this.getConsolidatedKBPath();

    console.log(`Consolidating ${reports.length} reports...`);

    const consolidated = reports
      .map(reportPath => fs.readFileSync(reportPath, 'utf-8'))
      .join('\n\n---\n\n');

    fs.writeFileSync(kbPath, consolidated, 'utf-8');

    console.log(`✅ Consolidated knowledge base: ${kbPath}`);
    console.log(`   Size: ${(consolidated.length / 1024 / 1024).toFixed(2)} MB`);

    return kbPath;
  }

  /**
   * Export for NotebookLM
   */
  exportForNotebookLM(format = 'urls') {
    const exportsDir = path.join(this.getExportsDir(), 'notebooklm');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    if (format === 'urls') {
      // Generate URL exports
      const libraryPath = this.getVideoLibraryPath();
      const content = fs.readFileSync(libraryPath, 'utf-8');
      const urlRegex = /href="([^"]+youtube[^"]+)"/g;
      const urls = [];
      let match;

      while ((match = urlRegex.exec(content)) !== null) {
        urls.push(match[1]);
      }

      const outputPath = path.join(exportsDir, `all-videos-${Date.now()}.txt`);
      fs.writeFileSync(outputPath, urls.join('\n'));

      return outputPath;

    } else if (format === 'markdown') {
      // Export consolidated markdown
      const kbPath = this.getConsolidatedKBPath();
      if (!fs.existsSync(kbPath)) {
        this.generateConsolidatedKB();
      }

      const outputPath = path.join(exportsDir, `consolidated-${Date.now()}.md`);
      fs.copyFileSync(kbPath, outputPath);

      return outputPath;
    }

    throw new Error(`Unknown format: ${format}`);
  }

  /**
   * Create backup
   */
  createBackup() {
    const backupDir = path.join(this.getPersonalDataPath(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.tar.gz`);

    // Use the backup script if available
    const backupScript = path.join(this.getPersonalDataPath(), 'backup.sh');
    if (fs.existsSync(backupScript)) {
      const { execSync } = require('child_process');
      execSync(backupScript, { cwd: this.getPersonalDataPath() });
    }

    return backupPath;
  }
}

module.exports = PersonalDataManager;
