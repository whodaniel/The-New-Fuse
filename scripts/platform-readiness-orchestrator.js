#!/usr/bin/env node

/**
 * Platform Readiness Orchestrator
 * Master script to validate platform readiness for millions of concurrent users
 * 
 * This orchestrator coordinates multiple specialized validators:
 * - Production Readiness Checklist
 * - Load Testing & Performance Validation
 * - Infrastructure Scalability Validation
 * - Security Audit Suite
 * - Database Performance Optimization
 * - Monitoring & Alerting System
 * - Disaster Recovery Validation
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PlatformReadinessOrchestrator {
    constructor() {
        this.config = this.loadConfiguration();
        this.validators = [
            {
                name: 'Production Readiness Checklist',
                script: 'production-readiness-checklist.js',
                weight: 20,
                critical: true,
                description: 'Comprehensive platform readiness validation'
            },
            {
                name: 'Load Testing & Performance',
                script: 'million-user-load-test.js',
                weight: 25,
                critical: true,
                description: 'Performance validation for millions of users'
            },
            {
                name: 'Infrastructure Scalability',
                script: 'infrastructure-scalability-validator.js',
                weight: 20,
                critical: true,
                description: 'Auto-scaling and resource management validation'
            },
            {
                name: 'Security Audit',
                script: 'security-audit-suite.js',
                weight: 15,
                critical: true,
                description: 'Security vulnerabilities and compliance checks'
            },
            {
                name: 'Database Performance',
                script: 'database-performance-optimizer.js',
                weight: 10,
                critical: true,
                description: 'Database scalability and optimization'
            },
            {
                name: 'Monitoring & Alerting',
                script: 'monitoring-alerting-system.js',
                weight: 5,
                critical: false,
                description: 'Observability and incident response systems'
            },
            {
                name: 'Disaster Recovery',
                script: 'disaster-recovery-validator.js',
                weight: 5,
                critical: false,
                description: 'Business continuity and failover validation'
            }
        ];
        this.results = {};
        this.overallScore = 0;
        this.criticalIssues = [];
        this.warnings = [];
        this.recommendations = [];
    }

    loadConfiguration() {
        const configPath = path.join(__dirname, 'orchestrator-config.json');
        
        const defaultConfig = {
            targetUsers: 1000000,
            environment: 'production',
            timeout: 3600000, // 1 hour timeout
            parallel: true,
            maxConcurrentValidators: 3,
            reportFormats: ['json', 'html', 'summary'],
            outputDir: './reports',
            thresholds: {
                overallScore: 85,
                criticalIssues: 0,
                warningThreshold: 5
            },
            notifications: {
                enabled: false,
                webhook: null,
                email: null
            }
        };

        if (fs.existsSync(configPath)) {
            try {
                const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return { ...defaultConfig, ...userConfig };
            } catch (error) {
                console.warn(`Warning: Could not load config from ${configPath}, using defaults`);
                return defaultConfig;
            }
        }

        return defaultConfig;
    }

    async initialize() {
        console.log('🚀 Platform Readiness Orchestrator');
        console.log('=====================================');
        console.log(`Target Users: ${this.config.targetUsers.toLocaleString()}`);
        console.log(`Environment: ${this.config.environment}`);
        console.log(`Parallel Execution: ${this.config.parallel ? 'Enabled' : 'Disabled'}`);
        console.log('');

        // Create output directory
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }

        // Validate prerequisites
        await this.validatePrerequisites();
    }

    async validatePrerequisites() {
        console.log('🔍 Validating Prerequisites...');
        
        const prerequisites = [
            { name: 'Node.js', command: 'node --version', required: true },
            { name: 'npm', command: 'npm --version', required: true },
            { name: 'Docker', command: 'docker --version', required: false },
            { name: 'kubectl', command: 'kubectl version --client', required: false },
            { name: 'k6', command: 'k6 version', required: false }
        ];

        for (const prereq of prerequisites) {
            try {
                const version = execSync(prereq.command, { encoding: 'utf8', stdio: 'pipe' });
                console.log(`  ✅ ${prereq.name}: ${version.trim().split('\n')[0]}`);
            } catch (error) {
                if (prereq.required) {
                    throw new Error(`❌ Required prerequisite missing: ${prereq.name}`);
                } else {
                    console.log(`  ⚠️  ${prereq.name}: Not available (optional)`);
                }
            }
        }

        // Check system resources
        const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024));
        const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024));
        const cpuCount = os.cpus().length;

        console.log(`  💾 System Memory: ${freeMemory}GB free / ${totalMemory}GB total`);
        console.log(`  🖥️  CPU Cores: ${cpuCount}`);

        if (freeMemory < 4) {
            this.warnings.push('Low available memory may impact validation performance');
        }

        console.log('');
    }

    async runValidators() {
        console.log('🔬 Running Platform Validators...');
        console.log('');

        const startTime = Date.now();

        if (this.config.parallel) {
            await this.runValidatorsParallel();
        } else {
            await this.runValidatorsSequential();
        }

        const duration = Date.now() - startTime;
        console.log(`⏱️  Total validation time: ${Math.round(duration / 1000)}s`);
        console.log('');
    }

    async runValidatorsParallel() {
        const chunks = this.chunkArray(this.validators, this.config.maxConcurrentValidators);
        
        for (const chunk of chunks) {
            const promises = chunk.map(validator => this.runValidator(validator));
            await Promise.all(promises);
        }
    }

    async runValidatorsSequential() {
        for (const validator of this.validators) {
            await this.runValidator(validator);
        }
    }

    async runValidator(validator) {
        const startTime = Date.now();
        console.log(`🔍 Running ${validator.name}...`);

        try {
            const scriptPath = path.join(__dirname, validator.script);
            
            if (!fs.existsSync(scriptPath)) {
                throw new Error(`Validator script not found: ${scriptPath}`);
            }

            const result = await this.executeValidator(scriptPath, validator);
            const duration = Date.now() - startTime;

            this.results[validator.name] = {
                ...result,
                duration: Math.round(duration / 1000),
                weight: validator.weight,
                critical: validator.critical
            };

            const status = result.readyForMillions ? '✅' : '❌';
            console.log(`  ${status} ${validator.name} (${Math.round(duration / 1000)}s)`);
            
            if (result.score !== undefined) {
                console.log(`     Score: ${result.score}%`);
            }

        } catch (error) {
            console.log(`  ❌ ${validator.name} - Error: ${error.message}`);
            
            this.results[validator.name] = {
                success: false,
                error: error.message,
                readyForMillions: false,
                score: 0,
                duration: Math.round((Date.now() - startTime) / 1000),
                weight: validator.weight,
                critical: validator.critical
            };

            if (validator.critical) {
                this.criticalIssues.push(`${validator.name}: ${error.message}`);
            }
        }
    }

    async executeValidator(scriptPath, validator) {
        return new Promise((resolve, reject) => {
            const child = spawn('node', [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: this.config.timeout
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Try to parse JSON output from validator
                        const lines = stdout.trim().split('\n');
                        let result = null;

                        // Look for JSON output in the last few lines
                        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
                            try {
                                const parsed = JSON.parse(lines[i]);
                                if (parsed.readyForMillions !== undefined) {
                                    result = parsed;
                                    break;
                                }
                            } catch (e) {
                                // Continue looking
                            }
                        }

                        if (!result) {
                            // Fallback: analyze output for success indicators
                            const successIndicators = [
                                'ready for millions',
                                'platform ready',
                                'validation passed',
                                'all checks passed'
                            ];

                            const hasSuccess = successIndicators.some(indicator => 
                                stdout.toLowerCase().includes(indicator)
                            );

                            result = {
                                success: hasSuccess,
                                readyForMillions: hasSuccess,
                                score: hasSuccess ? 85 : 60,
                                output: stdout,
                                issues: stderr ? [stderr] : []
                            };
                        }

                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Failed to parse validator output: ${error.message}`));
                    }
                } else {
                    reject(new Error(`Validator exited with code ${code}: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                reject(new Error(`Failed to execute validator: ${error.message}`));
            });
        });
    }

    calculateOverallScore() {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        for (const [name, result] of Object.entries(this.results)) {
            if (result.success !== false && result.score !== undefined) {
                totalWeightedScore += result.score * result.weight;
                totalWeight += result.weight;
            }
        }

        this.overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
    }

    analyzeResults() {
        console.log('📊 Analyzing Results...');
        
        this.calculateOverallScore();

        // Collect issues and recommendations
        for (const [name, result] of Object.entries(this.results)) {
            if (result.criticalIssues) {
                this.criticalIssues.push(...result.criticalIssues.map(issue => `${name}: ${issue}`));
            }
            
            if (result.warnings) {
                this.warnings.push(...result.warnings.map(warning => `${name}: ${warning}`));
            }
            
            if (result.recommendations) {
                this.recommendations.push(...result.recommendations.map(rec => `${name}: ${rec}`));
            }

            // Check for critical validator failures
            if (result.critical && (!result.readyForMillions || result.success === false)) {
                this.criticalIssues.push(`Critical validator failed: ${name}`);
            }
        }

        console.log(`  Overall Score: ${this.overallScore}%`);
        console.log(`  Critical Issues: ${this.criticalIssues.length}`);
        console.log(`  Warnings: ${this.warnings.length}`);
        console.log('');
    }

    async generateReports() {
        console.log('📝 Generating Reports...');

        const reportData = {
            timestamp: new Date().toISOString(),
            config: this.config,
            overallScore: this.overallScore,
            readyForMillions: this.isReadyForMillions(),
            results: this.results,
            criticalIssues: this.criticalIssues,
            warnings: this.warnings,
            recommendations: this.recommendations,
            summary: this.generateSummary()
        };

        // Generate requested report formats
        for (const format of this.config.reportFormats) {
            switch (format) {
                case 'json':
                    await this.generateJSONReport(reportData);
                    break;
                case 'html':
                    await this.generateHTMLReport(reportData);
                    break;
                case 'summary':
                    this.generateSummaryReport(reportData);
                    break;
            }
        }
    }

    async generateJSONReport(data) {
        const filePath = path.join(this.config.outputDir, 'platform-readiness-report.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`  📄 JSON Report: ${filePath}`);
    }

    async generateHTMLReport(data) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platform Readiness Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .score-card { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .score-item { text-align: center; padding: 20px; border-radius: 8px; flex: 1; margin: 0 10px; }
        .score-item.ready { background: #d4edda; color: #155724; }
        .score-item.not-ready { background: #f8d7da; color: #721c24; }
        .score-item.warning { background: #fff3cd; color: #856404; }
        .score-item h3 { margin: 0; font-size: 2em; }
        .score-item p { margin: 5px 0 0 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .validator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .validator-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .validator-card.success { border-left: 4px solid #28a745; }
        .validator-card.failure { border-left: 4px solid #dc3545; }
        .validator-card h3 { margin: 0 0 10px 0; color: #333; }
        .validator-score { font-size: 1.5em; font-weight: bold; margin: 10px 0; }
        .validator-score.high { color: #28a745; }
        .validator-score.medium { color: #ffc107; }
        .validator-score.low { color: #dc3545; }
        .issue-list { list-style: none; padding: 0; }
        .issue-list li { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .issue-list .critical { background: #f8d7da; color: #721c24; }
        .issue-list .warning { background: #fff3cd; color: #856404; }
        .issue-list .recommendation { background: #d1ecf1; color: #0c5460; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Platform Readiness Report</h1>
            <div class="subtitle">Validation for ${data.config.targetUsers.toLocaleString()} Concurrent Users</div>
        </div>
        
        <div class="content">
            <div class="score-card">
                <div class="score-item ${data.readyForMillions ? 'ready' : 'not-ready'}">
                    <h3>${data.overallScore}%</h3>
                    <p>Overall Score</p>
                </div>
                <div class="score-item ${data.criticalIssues.length === 0 ? 'ready' : 'not-ready'}">
                    <h3>${data.criticalIssues.length}</h3>
                    <p>Critical Issues</p>
                </div>
                <div class="score-item ${data.warnings.length <= 5 ? 'ready' : 'warning'}">
                    <h3>${data.warnings.length}</h3>
                    <p>Warnings</p>
                </div>
                <div class="score-item ${data.readyForMillions ? 'ready' : 'not-ready'}">
                    <h3>${data.readyForMillions ? '✅' : '❌'}</h3>
                    <p>Ready for Millions</p>
                </div>
            </div>

            <div class="section">
                <h2>Validator Results</h2>
                <div class="validator-grid">
                    ${Object.entries(data.results).map(([name, result]) => `
                        <div class="validator-card ${result.readyForMillions ? 'success' : 'failure'}">
                            <h3>${name}</h3>
                            <div class="validator-score ${result.score >= 80 ? 'high' : result.score >= 60 ? 'medium' : 'low'}">
                                ${result.score !== undefined ? result.score + '%' : 'N/A'}
                            </div>
                            <p><strong>Status:</strong> ${result.readyForMillions ? '✅ Ready' : '❌ Not Ready'}</p>
                            <p><strong>Duration:</strong> ${result.duration}s</p>
                            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            ${data.criticalIssues.length > 0 ? `
                <div class="section">
                    <h2>Critical Issues</h2>
                    <ul class="issue-list">
                        ${data.criticalIssues.map(issue => `<li class="critical">🚨 ${issue}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.warnings.length > 0 ? `
                <div class="section">
                    <h2>Warnings</h2>
                    <ul class="issue-list">
                        ${data.warnings.map(warning => `<li class="warning">⚠️ ${warning}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.recommendations.length > 0 ? `
                <div class="section">
                    <h2>Recommendations</h2>
                    <ul class="issue-list">
                        ${data.recommendations.map(rec => `<li class="recommendation">💡 ${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="section">
                <h2>Summary</h2>
                <p>${data.summary}</p>
            </div>
        </div>

        <div class="timestamp">
            Report generated on ${new Date(data.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;

        const filePath = path.join(this.config.outputDir, 'platform-readiness-report.html');
        fs.writeFileSync(filePath, html);
        console.log(`  📄 HTML Report: ${filePath}`);
    }

    generateSummaryReport(data) {
        console.log('');
        console.log('📋 PLATFORM READINESS SUMMARY');
        console.log('===============================');
        console.log(`Overall Score: ${data.overallScore}%`);
        console.log(`Ready for ${data.config.targetUsers.toLocaleString()} users: ${data.readyForMillions ? '✅ YES' : '❌ NO'}`);
        console.log(`Critical Issues: ${data.criticalIssues.length}`);
        console.log(`Warnings: ${data.warnings.length}`);
        console.log('');

        if (data.criticalIssues.length > 0) {
            console.log('🚨 CRITICAL ISSUES:');
            data.criticalIssues.forEach(issue => console.log(`  • ${issue}`));
            console.log('');
        }

        if (data.warnings.length > 0 && data.warnings.length <= 10) {
            console.log('⚠️  WARNINGS:');
            data.warnings.slice(0, 10).forEach(warning => console.log(`  • ${warning}`));
            if (data.warnings.length > 10) {
                console.log(`  ... and ${data.warnings.length - 10} more warnings`);
            }
            console.log('');
        }

        console.log('RECOMMENDATION:');
        console.log(data.summary);
        console.log('');
    }

    generateSummary() {
        if (this.criticalIssues.length > 0) {
            return `❌ Platform is NOT ready for millions of users. ${this.criticalIssues.length} critical issues must be resolved before public release. Focus on addressing critical validators that failed and ensure all security, performance, and infrastructure requirements are met.`;
        }

        if (this.overallScore < this.config.thresholds.overallScore) {
            return `⚠️ Platform readiness is below recommended threshold (${this.overallScore}% < ${this.config.thresholds.overallScore}%). While no critical issues were found, significant improvements are needed in performance, security, or infrastructure before handling millions of users.`;
        }

        if (this.warnings.length > this.config.thresholds.warningThreshold) {
            return `⚠️ Platform shows good overall readiness (${this.overallScore}%) but has ${this.warnings.length} warnings that should be addressed. Consider a phased rollout approach while monitoring these areas closely.`;
        }

        return `✅ Platform is ready for millions of users! Overall score of ${this.overallScore}% with ${this.criticalIssues.length} critical issues and ${this.warnings.length} warnings. Proceed with confidence, but maintain continuous monitoring and be prepared for rapid scaling adjustments.`;
    }

    isReadyForMillions() {
        return this.criticalIssues.length === 0 && 
               this.overallScore >= this.config.thresholds.overallScore;
    }

    async sendNotifications(data) {
        if (!this.config.notifications.enabled) return;

        console.log('📧 Sending Notifications...');

        // Webhook notification
        if (this.config.notifications.webhook) {
            try {
                const response = await fetch(this.config.notifications.webhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `Platform Readiness Report: ${data.readyForMillions ? '✅ Ready' : '❌ Not Ready'} (${data.overallScore}%)`,
                        attachments: [{
                            color: data.readyForMillions ? 'good' : 'danger',
                            fields: [
                                { title: 'Overall Score', value: `${data.overallScore}%`, short: true },
                                { title: 'Critical Issues', value: data.criticalIssues.length, short: true },
                                { title: 'Warnings', value: data.warnings.length, short: true }
                            ]
                        }]
                    })
                });
                console.log(`  📧 Webhook notification sent: ${response.status}`);
            } catch (error) {
                console.log(`  ❌ Webhook notification failed: ${error.message}`);
            }
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async run() {
        try {
            await this.initialize();
            await this.runValidators();
            this.analyzeResults();
            await this.generateReports();
            await this.sendNotifications({
                readyForMillions: this.isReadyForMillions(),
                overallScore: this.overallScore,
                criticalIssues: this.criticalIssues,
                warnings: this.warnings
            });

            // Exit with appropriate code
            const exitCode = this.isReadyForMillions() ? 0 : 1;
            console.log(`🏁 Platform readiness validation completed (exit code: ${exitCode})`);
            process.exit(exitCode);

        } catch (error) {
            console.error(`❌ Orchestrator failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const orchestrator = new PlatformReadinessOrchestrator();
    orchestrator.run().catch(error => {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

export default PlatformReadinessOrchestrator;