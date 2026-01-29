#!/usr/bin/env node
/**
 * Environment Security Scanner
 * Scans for exposed secrets, weak configurations, and security anti-patterns
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Severity levels
const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
};

// Patterns to detect
const DANGEROUS_PATTERNS = [
  {
    pattern: /password\s*=\s*["'][^"']{1,11}["']/i,
    severity: SEVERITY.CRITICAL,
    message: 'Hardcoded short password detected',
    category: 'secrets',
  },
  {
    pattern: /api[_-]?key\s*=\s*["'][^"']+["']/i,
    severity: SEVERITY.CRITICAL,
    message: 'Hardcoded API key detected',
    category: 'secrets',
  },
  {
    pattern: /jwt[_-]?secret\s*=\s*["'][^"']{1,31}["']/i,
    severity: SEVERITY.HIGH,
    message: 'JWT secret too short (min 32 chars)',
    category: 'authentication',
  },
  {
    pattern: /eval\s*\(/,
    severity: SEVERITY.HIGH,
    message: 'Dangerous eval() usage detected',
    category: 'code-injection',
  },
  {
    pattern: /innerHTML\s*=/,
    severity: SEVERITY.HIGH,
    message: 'Potential XSS via innerHTML',
    category: 'xss',
  },
  {
    pattern: /process\.env\[[^\]]+\]/,
    severity: SEVERITY.MEDIUM,
    message: 'Dynamic environment variable access - verify safe usage',
    category: 'configuration',
  },
  {
    pattern: /console\.(log|debug|info)\s*\(/,
    severity: SEVERITY.LOW,
    message: 'Console logging in production code',
    category: 'logging',
  },
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env\.example/,
  /\.env\.sample/,
  /\.env\.template/,
];

class SecurityScanner {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.findings = [];
    this.scannedFiles = 0;
  }

  async scan() {
    console.log('🔍 Starting security scan...\n');

    await this.scanDirectory(this.rootDir);
    await this.checkEnvFiles();
    await this.checkMCPConfig();
    await this.checkNginxConfig();

    return this.generateReport();
  }

  async scanDirectory(dir) {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.relative(this.rootDir, fullPath);

      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
        continue;
      }

      try {
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else if (this.shouldScanFile(entry)) {
          await this.scanFile(fullPath, relativePath);
        }
      } catch (error) {
        // Permission denied or other error - skip
      }
    }
  }

  shouldScanFile(filename) {
    const scanExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.env'];
    return scanExtensions.some((ext) => filename.endsWith(ext));
  }

  async scanFile(filePath, relativePath) {
    try {
      const content = await readFile(filePath, 'utf-8');
      this.scannedFiles++;

      // Check each pattern
      for (const check of DANGEROUS_PATTERNS) {
        const matches = content.match(new RegExp(check.pattern, 'g'));
        if (matches) {
          matches.forEach((match, index) => {
            const lineNum = this.getLineNumber(content, match);
            this.addFinding({
              severity: check.severity,
              message: check.message,
              category: check.category,
              file: relativePath,
              line: lineNum,
              match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
            });
          });
        }
      }

      // Check for TODO/FIXME security comments
      const securityTodos = content.match(/\/\/\s*(TODO|FIXME|SECURITY)[^\n]*/gi);
      if (securityTodos) {
        securityTodos.forEach((todo) => {
          const lineNum = this.getLineNumber(content, todo);
          this.addFinding({
            severity: SEVERITY.INFO,
            message: `Security-related comment: ${todo.trim()}`,
            category: 'documentation',
            file: relativePath,
            line: lineNum,
            match: todo.substring(0, 50),
          });
        });
      }
    } catch (error) {
      console.error(`Error scanning ${relativePath}: ${error.message}`);
    }
  }

  async checkEnvFiles() {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

    for (const envFile of envFiles) {
      const envPath = path.join(this.rootDir, envFile);

      try {
        await stat(envPath);

        // Check if .env is in .gitignore
        const gitignorePath = path.join(this.rootDir, '.gitignore');
        let gitignoreContent = '';

        try {
          gitignoreContent = await readFile(gitignorePath, 'utf-8');
        } catch (e) {
          // No .gitignore
        }

        if (!gitignoreContent.includes('.env')) {
          this.addFinding({
            severity: SEVERITY.CRITICAL,
            message: `${envFile} may not be in .gitignore - risk of secret exposure`,
            category: 'git',
            file: envFile,
            line: 0,
            recommendation: 'Add .env* to .gitignore',
          });
        }
      } catch (e) {
        // File doesn't exist
      }
    }
  }

  async checkMCPConfig() {
    const mcpConfigPath = path.join(this.rootDir, '.kilocode', 'mcp.json');

    try {
      const content = await readFile(mcpConfigPath, 'utf-8');
      const config = JSON.parse(content);

      // Check for hardcoded credentials in MCP servers
      const servers = config.mcpServers || {};

      for (const [name, server] of Object.entries(servers)) {
        if (server.env) {
          for (const [key, value] of Object.entries(server.env)) {
            if (
              typeof value === 'string' &&
              (key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('key'))
            ) {
              if (value.length > 10 && !value.startsWith('${')) {
                this.addFinding({
                  severity: SEVERITY.CRITICAL,
                  message: `Hardcoded credential in MCP server "${name}": ${key}`,
                  category: 'mcp',
                  file: '.kilocode/mcp.json',
                  line: 0,
                  recommendation: 'Use environment variable references like ${ENV_VAR}',
                });
              }
            }
          }
        }

        // Check disabled status
        if (server.disabled === true) {
          this.addFinding({
            severity: SEVERITY.INFO,
            message: `MCP server "${name}" is disabled`,
            category: 'mcp',
            file: '.kilocode/mcp.json',
            line: 0,
          });
        }
      }
    } catch (e) {
      // MCP config not found or invalid
    }
  }

  async checkNginxConfig() {
    const nginxPath = path.join(this.rootDir, 'nginx', 'nginx.conf');

    try {
      const content = await readFile(nginxPath, 'utf-8');

      const requiredHeaders = [
        { name: 'X-Frame-Options', pattern: /X-Frame-Options/i },
        { name: 'X-Content-Type-Options', pattern: /X-Content-Type-Options/i },
        { name: 'X-XSS-Protection', pattern: /X-XSS-Protection/i },
      ];

      for (const header of requiredHeaders) {
        if (!header.pattern.test(content)) {
          this.addFinding({
            severity: SEVERITY.HIGH,
            message: `Missing security header: ${header.name}`,
            category: 'headers',
            file: 'nginx/nginx.conf',
            line: 0,
            recommendation: `Add "add_header ${header.name} ..." directive`,
          });
        }
      }
    } catch (e) {
      // nginx config not found
    }
  }

  getLineNumber(content, match) {
    const index = content.indexOf(match);
    if (index === -1) return 0;

    return content.substring(0, index).split('\n').length;
  }

  addFinding(finding) {
    this.findings.push({
      ...finding,
      timestamp: new Date().toISOString(),
    });
  }

  generateReport() {
    const counts = {
      [SEVERITY.CRITICAL]: 0,
      [SEVERITY.HIGH]: 0,
      [SEVERITY.MEDIUM]: 0,
      [SEVERITY.LOW]: 0,
      [SEVERITY.INFO]: 0,
    };

    this.findings.forEach((f) => counts[f.severity]++);

    const report = {
      summary: {
        scannedFiles: this.scannedFiles,
        totalFindings: this.findings.length,
        counts,
      },
      findings: this.findings.sort((a, b) => {
        const severityOrder = [
          SEVERITY.CRITICAL,
          SEVERITY.HIGH,
          SEVERITY.MEDIUM,
          SEVERITY.LOW,
          SEVERITY.INFO,
        ];
        return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      }),
      generatedAt: new Date().toISOString(),
    };

    return report;
  }
}

// CLI execution
if (require.main === module) {
  const scanner = new SecurityScanner({
    rootDir: process.argv[2] || process.cwd(),
  });

  scanner
    .scan()
    .then((report) => {
      console.log('\n📊 Security Scan Report');
      console.log('======================\n');
      console.log(`Files Scanned: ${report.summary.scannedFiles}`);
      console.log(`Total Findings: ${report.summary.totalFindings}\n`);

      console.log('Severity Breakdown:');
      console.log(`  🔴 Critical: ${report.summary.counts[SEVERITY.CRITICAL]}`);
      console.log(`  🟠 High: ${report.summary.counts[SEVERITY.HIGH]}`);
      console.log(`  🟡 Medium: ${report.summary.counts[SEVERITY.MEDIUM]}`);
      console.log(`  🟢 Low: ${report.summary.counts[SEVERITY.LOW]}`);
      console.log(`  ℹ️  Info: ${report.summary.counts[SEVERITY.INFO]}\n`);

      if (report.findings.length > 0) {
        console.log('Findings:');
        console.log('---------');

        report.findings.forEach((finding, i) => {
          const icon = {
            [SEVERITY.CRITICAL]: '🔴',
            [SEVERITY.HIGH]: '🟠',
            [SEVERITY.MEDIUM]: '🟡',
            [SEVERITY.LOW]: '🟢',
            [SEVERITY.INFO]: 'ℹ️',
          }[finding.severity];

          console.log(`\n${icon} [${finding.severity}] ${finding.message}`);
          console.log(`   File: ${finding.file}:${finding.line}`);
          console.log(`   Category: ${finding.category}`);
          if (finding.recommendation) {
            console.log(`   💡 ${finding.recommendation}`);
          }
        });
      } else {
        console.log('✅ No security issues found!');
      }

      // Exit with error code if critical or high findings
      const exitCode =
        report.summary.counts[SEVERITY.CRITICAL] + report.summary.counts[SEVERITY.HIGH] > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Scan failed:', error);
      process.exit(1);
    });
}

module.exports = { SecurityScanner, SEVERITY };
