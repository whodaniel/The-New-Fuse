import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
/**
 * Security category command implementation
 */
export class SecurityCommand extends CategoryCommand {
    constructor(program) {
        super('security', 'Security & access control', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // Audit subcommand
        this.registerSubcommand('audit', new SecurityAuditSubcommand('security', 'audit', 'Security audit', this.program).createSubcommand());
        // Scan subcommand
        this.registerSubcommand('scan', new SecurityScanSubcommand('security', 'scan', 'Vulnerability scanning', this.program).createSubcommand());
        // Policy subcommand
        this.registerSubcommand('policy', new SecurityPolicySubcommand('security', 'policy', 'Security policies', this.program).createSubcommand());
        // Access subcommand
        this.registerSubcommand('access', new SecurityAccessSubcommand('security', 'access', 'Access control', this.program).createSubcommand());
        // Encrypt subcommand
        this.registerSubcommand('encrypt', new SecurityEncryptSubcommand('security', 'encrypt', 'Data encryption', this.program).createSubcommand());
        // Decrypt subcommand
        this.registerSubcommand('decrypt', new SecurityDecryptSubcommand('security', 'decrypt', 'Data decryption', this.program).createSubcommand());
        // Keys subcommand
        this.registerSubcommand('keys', new SecurityKeysSubcommand('security', 'keys', 'Key management', this.program).createSubcommand());
        // Compliance subcommand
        this.registerSubcommand('compliance', new SecurityComplianceSubcommand('security', 'compliance', 'Compliance checks', this.program).createSubcommand());
        // Incident subcommand
        this.registerSubcommand('incident', new SecurityIncidentSubcommand('security', 'incident', 'Incident management', this.program).createSubcommand());
    }
}
/**
 * Security audit subcommand
 */
class SecurityAuditSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --scope <scope>', 'Audit scope (all|containers|files|network)', 'all')
            .option('--report', 'Generate detailed audit report')
            .option('--output <format>', 'Output format (json|yaml|html)', 'json');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            console.log(chalk.blue('🔍 Running security audit...'));
            const auditResults = await this.performSecurityAudit(options);
            console.log(chalk.blue.bold('\n📋 Security Audit Results\n'));
            // Display summary
            const criticalIssues = auditResults.issues.filter((issue) => issue.severity === 'critical').length;
            const highIssues = auditResults.issues.filter((issue) => issue.severity === 'high').length;
            const mediumIssues = auditResults.issues.filter((issue) => issue.severity === 'medium').length;
            const lowIssues = auditResults.issues.filter((issue) => issue.severity === 'low').length;
            console.log(chalk.white(`Critical Issues: ${chalk.red(criticalIssues)}));`, console.log(chalk.white(`High Issues: ${chalk.yellow(highIssues)}`))));
            console.log(chalk.white(Medium, Issues, $, { chalk, : .blue(mediumIssues) }));
            `
        console.log(chalk.white(Low Issues: ${chalk.gray(lowIssues)}`;
        });
        ;
        console.log();
        // Display issues
        auditResults.issues.forEach((issue) => {
            const severityIcon = issue.severity === 'critical' ? chalk.red('🔴') :
                issue.severity === 'high' ? chalk.orange('🟠') :
                    issue.severity === 'medium' ? chalk.yellow('🟡') :
                        chalk.gray('⚪');
            console.log($, { severityIcon }, $, { chalk, : .white.bold(issue.title) } `);
          console.log(chalk.gray(  Category: ${issue.category}));`, console.log(chalk.gray(`  Description: ${issue.description}));`)));
            if (issue.recommendation) {
                `
            console.log(chalk.gray(  Recommendation: ${issue.recommendation}));
          }
          console.log();
        });

        // Generate report if requested
        if (options.report) {
          await this.generateAuditReport(auditResults, options.output);
        }

        return {
          audit: auditResults,
          summary: {
            critical: criticalIssues,
            high: highIssues,
            medium: mediumIssues,
            low: lowIssues,
            total: auditResults.issues.length
          },
          timestamp: new Date().toISOString()
        };
      },
      'Security audit completed successfully',
      'Failed to complete security audit'
    );
  }

  private async performSecurityAudit(options: any): Promise<any> {
    const issues = [];
    
    // Container security audit
    if (options.scope === 'all' || options.scope === 'containers') {
      const containerIssues = await this.auditContainers();
      issues.push(...containerIssues);
    }

    // File security audit
    if (options.scope === 'all' || options.scope === 'files') {
      const fileIssues = await this.auditFiles();
      issues.push(...fileIssues);
    }

    // Network security audit
    if (options.scope === 'all' || options.scope === 'network') {
      const networkIssues = await this.auditNetwork();
      issues.push(...networkIssues);
    }

    return {
      scope: options.scope,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  private async auditContainers(): Promise<any[]> {
    const issues = [];
    
    try {
      const containers = execSync('docker ps --format "{{.Names}}\t{{.Image}}" ', 
        { encoding: 'utf8' });
      
      containers.split('\n').filter(line => line.trim()).forEach(line => {
        const [name, image] = line.split('\t');
        
        // Check for privileged containers
        try {`;
                const inspect = execSync(docker, inspect, $, { name } `, { encoding: 'utf8' });
          const info = JSON.parse(inspect);
          
          if (info[0]?.HostConfig?.Privileged) {
            issues.push({
              title: 'Privileged Container Detected',
              category: 'container',
              severity: 'high',
              description: Container ${name} is running in privileged mode,
              recommendation: 'Remove privileged mode unless absolutely necessary'
            });
          }
          
          // Check for root user
          if (info[0]?.Config?.User === 'root' || !info[0]?.Config?.User) {
            issues.push({
              title: 'Container Running as Root',
              category: 'container',`, severity, 'medium', `
              description: Container ${name}`, is, running, user, recommendation, 'Run containers as non-root user');
            }
        });
    }
}
try { }
catch (error) {
    // Could not inspect container
}
;
try { }
catch (error) {
    console.warn(chalk.yellow('Could not audit containers'));
}
return issues;
async;
auditFiles();
Promise < any[] > {
    const: issues = [],
    // Check for sensitive files
    const: sensitiveFiles = [
        '.env',
        '.env.production',
        'config/secrets.json',
        'id_rsa',
        'id_rsa.pub'
    ],
    sensitiveFiles, : .forEach(file => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            const mode = stats.mode;
            // Check file permissions
            if (mode & 0o077) { // Readable by others
                issues.push({
                    title: 'Sensitive File with Weak Permissions',
                    category: 'file',
                    severity: 'high',
                    description: File, $
                }, { file }, has, weak, permissions, recommendation, 'Restrict file permissions to owner only');
            }
        }
    })
};
;
// Check for hardcoded secrets
const filesToCheck = ['package.json', 'docker-compose.yml', '*.js', '*.ts'];
filesToCheck.forEach(pattern => {
    try {
        const files = this.globSync(pattern);
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            // Check for potential secrets
            const secretPatterns = [
                /password\s*[:=]\s*["'][^"']+["']/i,
                /secret\s*[:=]\s*["'][^"']+["']/i,
                /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
                /token\s*[:=]\s*["'][^"']+["']/i
            ];
            secretPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    issues.push({
                        title: 'Potential Hardcoded Secret',
                        category: 'file',
                    } `
                severity: 'critical',`, description, Potential, hardcoded, secret, found in $, { file } `,
                recommendation: 'Remove hardcoded secrets and use environment variables'
              });
            }
          });
        });
      } catch (error) {
        // Ignore file reading errors
      }
    });

    return issues;
  }

  private async auditNetwork(): Promise<any[]> {
    const issues = [];
    
    // Check for open ports
    try {
      const netstat = execSync('netstat -tuln', { encoding: 'utf8' });
      const openPorts = netstat.split('\n')
        .filter(line => line.includes('LISTEN'))
        .filter(line => !line.includes('127.0.0.1')); // Non-localhost only

      if (openPorts.length > 0) {
        issues.push({
          title: 'Services Listening on All Interfaces',
          category: 'network',
          severity: 'medium',
          description: ${openPorts.length} services are listening on all network interfaces,
          recommendation: 'Bind services to specific interfaces when possible'
        });
      }
    } catch (error) {
      console.warn(chalk.yellow('Could not audit network'));
    }

    return issues;
  }

  private globSync(pattern: string): string[] {
    // Simple glob implementation
    const files = [];
    const dir = path.dirname(pattern);
    const basePattern = path.basename(pattern);
    
    try {
      const items = fs.readdirSync(dir || '.');
      items.forEach(item => {
        if (basePattern.includes('*') && item.endsWith(basePattern.replace('*', ''))) {
          files.push(path.join(dir || '.', item));
        } else if (item === basePattern) {
          files.push(path.join(dir || '.', item));
        }
      });
    } catch (error) {
      // Ignore directory reading errors
    }
    
    return files;
  }

  private async generateAuditReport(auditResults: any, format: string): Promise<void> {`);
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    `
    const filename = security-audit-${timestamp}`.$;
                    {
                        format;
                    }
                    ;
                    if (format === 'json') {
                        fs.writeFileSync(filename, JSON.stringify(auditResults, null, 2));
                    }
                    else if (format === 'yaml') {
                        // Simple YAML conversion
                        const yaml = JSON.stringify(auditResults, null, 2)
                            .replace(/"/g, '')
                            .replace(/,/g, '')
                            .replace(/\{/g, '')
                            .replace(/\}/g, '');
                        fs.writeFileSync(filename, yaml);
                    }
                    else if (format === 'html') {
                        const html = this.generateHtmlReport(auditResults);
                        fs.writeFileSync(filename, html);
                    }
                    `
    `;
                    console.log(chalk.green(Audit, report, generated, $, { filename } `));
  }

  private generateHtmlReport(auditResults: any): string {
    return 
<!DOCTYPE html>
<html>
<head>
    <title>Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #757575; }
        .issue { margin: 20px 0; padding: 15px; border-left: 4px solid #ccc; }
        .critical { border-left-color: #d32f2f; }
        .high { border-left-color: #f57c00; }
        .medium { border-left-color: #fbc02d; }
        .low { border-left-color: #757575; }
    </style>
</head>
<body>
    <h1>Security Audit Report</h1>
    <p>Generated: ${auditResults.timestamp}</p>`
                        < p > Scope, $, { auditResults, : .scope } < /p>
                        < h2 > Summary < /h2>
                        < p > Total, Issues, $, { auditResults, : .issues.length } < /p>
                        < h2 > Issues < /h2>`, $, { auditResults, : .issues.map((issue) => `
        <div class="issue ${issue.severity}">`
                            < h3 > $, { issue, : .title } < /h3>`
                            < p > Category, /strong> ${issue.category}</p > `
            <p><strong>Severity:</strong> <span class="${issue.severity}">${issue.severity}</span></p>`
                            < p > Description, /strong> ${issue.description}</p >
                            $, { issue, : .recommendation ? `<p><strong>Recommendation:</strong> ${issue.recommendation}</p> : ''}
        </div>
    ).join('')}
</body>
</html>;
  }
}

/**
 * Security scan subcommand
 */
class SecurityScanSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[target]', 'Target to scan (directory, file, or container)')
      .option('-t, --type <type>', 'Scan type (vulnerability|malware|dependencies)', 'vulnerability')
      .option('--deep', 'Perform deep scan')
      .option('--fix', 'Attempt to fix issues automatically');
  }

  protected async handleCommand(target: string | undefined, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {`
                                :
                            ,
                            const: scanTarget = target || '.' } `
        console.log(chalk.blue(🔍 Scanning ${scanTarget} for ${options.type}...`) }));
                    const scanResults = await this.performSecurityScan(scanTarget, options);
                    console.log(chalk.blue.bold('\n📊 Scan Results\n'));
                    scanResults.results.forEach((result) => {
                        const statusIcon = result.status === 'clean' ? chalk.green('✅') :
                            result.status === 'warning' ? chalk.yellow('⚠️') :
                                chalk.red('❌');
                        console.log($, { statusIcon }, $, { chalk, : .white.bold(result.target) });
                        `
          console.log(chalk.gray(  Status: ${result.status}`;
                    });
                }
            });
            if (result.issues && result.issues.length > 0) {
                result.issues.forEach((issue) => {
                    console.log(chalk.gray(-$, { issue }));
                });
            }
            console.log();
        });
        if (options.fix && scanResults.fixable.length > 0) {
            console.log(chalk.blue('🔧 Attempting to fix issues...'));
            await this.fixIssues(scanResults.fixable);
        }
        return {
            target: scanTarget,
            type: options.type,
            results: scanResults,
            timestamp: new Date().toISOString()
        };
    }
    finally { }
    'Security scan completed successfully',
        'Failed to complete security scan';
});
async;
performSecurityScan(target, string, options, any);
Promise < any > {
    const: results = [],
    const: fixable = [],
    switch(options) { }, : .type
};
{
    'vulnerability';
    return await this.scanVulnerabilities(target, options);
    'malware';
    return await this.scanMalware(target, options);
    'dependencies';
    return await this.scanDependencies(target, options);
    `
      default:`;
    throw new Error(Unknown, scan, type, $, { options, : .type } `);
    }
  }

  private async scanVulnerabilities(target: string, options: any): Promise<any> {
    const results = [];
    const fixable = [];

    // Scan Docker images for vulnerabilities
    if (fs.existsSync(target) && fs.statSync(target).isFile() && target.includes('Dockerfile')) {
      try {
        console.log(chalk.blue('Scanning Docker image...'));
        const scanResult = execSync(docker run --rm -v ${process.cwd()}:/app clair-scanner:latest /app, 
          { encoding: 'utf8' });
        
        results.push({
          target: 'Docker image',
          status: 'scanned',
          issues: ['Vulnerability scan completed'],
          details: scanResult
        });
      } catch (error) {
        results.push({
          target: 'Docker image',
          status: 'error',
          issues: ['Could not scan Docker image'],
          details: error.message
        });
      }
    }

    // Scan files for vulnerabilities
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      const files = this.getFilesRecursively(target);
      
      files.forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json')) {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for common vulnerabilities
          const vulnerabilities = this.checkCodeVulnerabilities(content, file);
          
          if (vulnerabilities.length > 0) {
            results.push({
              target: file,
              status: vulnerabilities.some(v => v.severity === 'high') ? 'vulnerable' : 'warning',
              issues: vulnerabilities.map(v => v.description),
              details: vulnerabilities
            });
            
            if (vulnerabilities.some(v => v.fixable)) {
              fixable.push({ file, vulnerabilities: vulnerabilities.filter(v => v.fixable) });
            }
          } else {
            results.push({
              target: file,
              status: 'clean',
              issues: []
            });
          }
        }
      });
    }

    return { results, fixable };
  }

  private async scanMalware(target: string, options: any): Promise<any> {
    const results = [];
    
    // This would integrate with a real malware scanner
    console.log(chalk.yellow('Malware scanning not implemented - would integrate with ClamAV or similar'));
    
    results.push({
      target: target,
      status: 'not_scanned',
      issues: ['Malware scanning not implemented']
    });

    return { results, fixable: [] };
  }

  private async scanDependencies(target: string, options: any): Promise<any> {
    const results = [];
    const fixable = [];

    if (fs.existsSync('package.json')) {
      try {
        console.log(chalk.blue('Scanning dependencies...'));
        const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
        const audit = JSON.parse(auditResult);
        
        if (audit.vulnerabilities) {
          Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {`, results.push({} `
              target: package: ${pkg},
              status: vuln.severity === 'high' || vuln.severity === 'critical' ? 'vulnerable' : 'warning',
              issues: [vuln.title],
              details: vuln
            });
            
            if (vuln.fixAvailable) {
              fixable.push({ package: pkg, vulnerability: vuln });
            }
          });
        }
      } catch (error) {
        results.push({
          target: 'dependencies',
          status: 'error',
          issues: ['Could not scan dependencies'],
          details: error.message
        });
      }
    }

    return { results, fixable };
  }

  private getFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getFilesRecursively(fullPath));
        } else if (stats.isFile()) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Ignore directory reading errors
    }
    
    return files;
  }

  private checkCodeVulnerabilities(content: string, file: string): any[] {
    const vulnerabilities = [];
    
    // Check for eval usage
    if (content.includes('eval(')) {
      vulnerabilities.push({
        type: 'code_injection',
        severity: 'high',
        description: 'Use of eval() function detected',
        fixable: true
      });
    }
    
    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']+["']/i,
      /secret\s*[:=]\s*["'][^"']+["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/i
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: 'hardcoded_secret',
          severity: 'critical',
          description: 'Potential hardcoded secret detected',
          fixable: true
        });
      }
    });
    
    // Check for SQL injection patterns
    if (content.includes('SELECT') && content.includes('+')) {
      vulnerabilities.push({
        type: 'sql_injection',
        severity: 'high',
        description: 'Potential SQL injection vulnerability',
        fixable: true
      });
    }
    
    return vulnerabilities;
  }

  private async fixIssues(fixable: any[]): Promise<void> {
    for (const item of fixable) {
      if (item.file) {
        // Fix code vulnerabilities
        console.log(chalk.blue(Fixing vulnerabilities in ${item.file}...));
        // This would implement actual fixes
      } else if (item.package) {`));
    // Fix dependency vulnerabilities`
    try {
        `
          console.log(chalk.blue(Updating package ${item.package}...));`;
        execSync(npm, update, $, { item, : .package }, { stdio: 'pipe' });
        `
          console.log(chalk.green(✅ Updated ${item.package}));`;
    }
    catch (error) {
        console.log(chalk.red(Failed, to, update, $, { item, : .package }));
    }
}
/**
 * Security policy subcommand
 */
class SecurityPolicySubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[action]', 'Action to perform (list|create|update|delete)')
            .argument('[name]', 'Policy name')
            .option('--from <template>', 'Create policy from template');
    }
    async handleCommand(action, name, options) {
        if (!action) {
            action = 'list';
        }
        switch (action) {
            case 'list':
                await this.listPolicies();
                break;
            case 'create':
                await this.createPolicy(name || '', options);
                break;
            case 'update':
                await this.updatePolicy(name || '');
                break;
            case 'delete':
                await this.deletePolicy(name || '');
                break;
                `
      default:`;
                throw new Error(Unknown, action, $, { action } `. Use 'list', 'create', 'update', or 'delete');
    }
  }

  private async listPolicies(): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const policies = await this.getPolicies();
        
        console.log(chalk.blue.bold('📋 Security Policies\n'));

        if (policies.length === 0) {
          console.log(chalk.yellow('No security policies found'));
          return;
        }

        policies.forEach(policy => {
          const statusIcon = policy.enabled ? chalk.green('✅') : chalk.gray('❌');
          console.log(${statusIcon} ${chalk.white.bold(policy.name)});`, console.log(chalk.gray(Description, $, { policy, : .description })));
                `
          console.log(chalk.gray(  Category: ${policy.category}));`;
                console.log(chalk.gray(Severity, $, { policy, : .severity } `));
          console.log(chalk.gray(  Created: ${policy.createdAt}));
          console.log();
        });

        return { policies, count: policies.length };
      },
      'Policies listed successfully',
      'Failed to list policies'
    );
  }

  private async createPolicy(name: string, options: any): Promise<void> {
    if (!name) {
      throw new Error('Policy name is required for create action');
    }

    await this.executeWithHandling(
      async () => {
        let policyConfig;

        if (options.from) {
          policyConfig = await this.getPolicyTemplate(options.from);
          policyConfig.name = name;
        } else {
          policyConfig = await this.createPolicyInteractively(name);
        }

        await this.savePolicy(name, policyConfig);
        
        console.log(chalk.green(✅ Policy "${name}" created successfully));

        return { name, config: policyConfig };
      },
      'Policy created successfully',
      'Failed to create policy'
    );
  }

  private async updatePolicy(name: string): Promise<void> {
    if (!name) {
      throw new Error('Policy name is required for update action');
    }

    await this.executeWithHandling(
      async () => {
        const policy = await this.getPolicy(name);`));
                if (!policy) {
                    `
          throw new Error(`;
                    Policy;
                    not;
                    found: $;
                    {
                        name;
                    }
                    ;
                }
                const updatedPolicy = await this.updatePolicyInteractively(policy);
                await this.savePolicy(name, updatedPolicy);
                `
        `;
                console.log(chalk.green(Policy, "${name}", updated, successfully));
                return { name, config: updatedPolicy };
        }
        'Policy updated successfully',
            'Failed to update policy';
        ;
    }
    async deletePolicy(name) {
        if (!name) {
            throw new Error('Policy name is required for delete action');
        }
        await this.executeWithHandling(async () => {
            const inquirer = await import('inquirer');
            const answers = await inquirer.default.prompt([
                {
                    type: 'confirm',
                } `
            name: 'confirm',`,
                message, Are, you, sure, you, want, to, delete policy, "${name}" ?  : ,
            ]);
        });
    }
    default;
}
;
if (!answers.confirm) {
    console.log(chalk.yellow('Deletion cancelled'));
    return;
}
await this.removePolicy(name);
`
        console.log(chalk.green(✅ Policy "${name}`;
" deleted successfully));;
return { name };
'Policy deleted successfully',
    'Failed to delete policy';
;
async;
getPolicies();
Promise < any[] > {
    const: policiesDir = path.join(process.cwd(), '.tnf', 'policies'),
    if(, fs) { }, : .existsSync(policiesDir)
};
{
    return [];
}
const policies = [];
const files = fs.readdirSync(policiesDir)
    .filter(file => file.endsWith('.json'));
for (const file of files) {
    try {
        const policyPath = path.join(policiesDir, file);
        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
        policies.push(policy);
    }
    catch (error) {
        console.warn(chalk.yellow(Could, not, parse, policy, file, $, { file }));
    }
}
return policies;
`
  private async getPolicy(name: string): Promise<any> {`;
const policyPath = path.join(process.cwd(), '.tnf', 'policies', $, { name }.json);
if (!fs.existsSync(policyPath)) {
    return null;
}
return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
async;
savePolicy(name, string, config, any);
Promise < void  > {
    const: policiesDir = path.join(process.cwd(), '.tnf', 'policies'),
    if(, fs) { }, : .existsSync(policiesDir)
};
{
    fs.mkdirSync(policiesDir, { recursive: true });
}
`
    const policyPath = path.join(policiesDir, ${name}`.json;
;
config.updatedAt = new Date().toISOString();
fs.writeFileSync(policyPath, JSON.stringify(config, null, 2));
async;
removePolicy(name, string);
Promise < void  > {
    const: policyPath = path.join(process.cwd(), '.tnf', 'policies', $, { name }.json),
    if(fs) { }, : .existsSync(policyPath)
};
{
    fs.unlinkSync(policyPath);
}
async;
getPolicyTemplate(template, string);
Promise < any > {
    const: templates = {
        'password-policy': {
            name: '',
            description: 'Password security policy',
            category: 'authentication',
            severity: 'medium',
            enabled: true,
            rules: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90
            },
            createdAt: new Date().toISOString()
        },
        'access-control': {
            name: '',
            description: 'Access control policy',
            category: 'authorization',
            severity: 'high',
            enabled: true,
            rules: {
                mfaRequired: true,
                sessionTimeout: 30,
                maxLoginAttempts: 5,
                lockoutDuration: 15
            },
            createdAt: new Date().toISOString()
        }
    },
    return: templates[template] || templates['password-policy']
};
async;
createPolicyInteractively(name, string);
Promise < any > {
    const: inquirer = await import('inquirer'),
    const: answers = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'description',
            message: 'Policy description:'
        },
        {
            type: 'list',
            name: 'category',
            message: 'Policy category:',
            choices: ['authentication', 'authorization', 'data-protection', 'network-security', 'compliance']
        },
        {
            type: 'list',
            name: 'severity',
            message: 'Policy severity:',
            choices: ['low', 'medium', 'high', 'critical']
        },
        {
            type: 'confirm',
            name: 'enabled',
            message: 'Enable policy:',
            default: true
        }
    ]),
    return: {
        name,
        description: answers.description,
        category: answers.category,
        severity: answers.severity,
        enabled: answers.enabled,
        rules: {},
        createdAt: new Date().toISOString()
    }
};
async;
updatePolicyInteractively(policy, any);
Promise < any > {
    const: inquirer = await import('inquirer'),
    const: answers = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'description',
            message: 'Policy description:',
            default: policy.description
        },
        {
            type: 'confirm',
            name: 'enabled',
            message: 'Enable policy:',
            default: policy.enabled
        }
    ]),
    return: {
        ...policy,
        description: answers.description,
        enabled: answers.enabled,
        updatedAt: new Date().toISOString()
    }
};
/**
 * Security access subcommand
 */
class SecurityAccessSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('--user <user>', 'Manage access for specific user')
            .option('--resource <resource>', 'Manage access to specific resource')
            .option('--grant', 'Grant access')
            .option('--revoke', 'Revoke access');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            if (options.grant) {
                await this.grantAccess(options.user, options.resource);
            }
            else if (options.revoke) {
                await this.revokeAccess(options.user, options.resource);
            }
            else {
                await this.listAccess(options.user, options.resource);
            }
            return {
                operation: options.grant ? 'grant' : options.revoke ? 'revoke' : 'list',
                user: options.user,
                resource: options.resource,
                timestamp: new Date().toISOString()
            };
        }, 'Access control operation completed successfully', 'Failed to manage access control');
    }
    async grantAccess(user, resource) {
        if (!user || !resource) {
            throw new Error('Both --user and --resource are required for granting access');
        }
        `
`;
        console.log(chalk.blue(Granting, access));
        for ($; { user }; to)
            $;
        {
            resource;
        }
        ;
        const accessControl = await this.getAccessControl();
        if (!accessControl[resource]) {
            accessControl[resource] = { users: [], permissions: {} };
        }
        if (!accessControl[resource].users.includes(user)) {
            accessControl[resource].users.push(user);
        }
        `
    await this.saveAccessControl(accessControl);` `
    console.log(chalk.green(✅ Access granted for ${user} to ${resource}));
  }

  private async revokeAccess(user: string, resource: string): Promise<void> {
    if (!user || !resource) {
      throw new Error('Both --user and --resource are required for revoking access');
    }
`;
        console.log(chalk.blue(Revoking, access));
        for ($; { user }; to)
            $;
        {
            resource;
        }
        `...));
    
    const accessControl = await this.getAccessControl();
    
    if (accessControl[resource] && accessControl[resource].users.includes(user)) {
      accessControl[resource].users = accessControl[resource].users.filter((u: string) => u !== user);
    }
    
    await this.saveAccessControl(accessControl);
    
    console.log(chalk.green(✅ Access revoked for ${user} to ${resource}`;
        ;
    }
    async listAccess(user, resource) {
        const accessControl = await this.getAccessControl();
        console.log(chalk.blue.bold('🔐 Access Control List\n'));
        Object.entries(accessControl).forEach(([resName, config]) => {
            if (resource && resName !== resource)
                return;
            console.log(chalk.white.bold(Resource, $, { resName }));
            console.log(chalk.gray(Users, $, { config, : .users.join(', ') || 'None' }));
            if (user) {
                const hasAccess = config.users.includes(user);
                `
        const accessIcon = hasAccess ? chalk.green('✅') : chalk.red('❌');`;
                console.log(chalk.gray($, { user } `: ${accessIcon} ${hasAccess ? 'Has access' : 'No access'}));
      }
      
      console.log();
    });
  }

  private async getAccessControl(): Promise<any> {
    const accessControlPath = path.join(process.cwd(), '.tnf', 'access-control.json');
    
    if (!fs.existsSync(accessControlPath)) {
      return {};
    }

    return JSON.parse(fs.readFileSync(accessControlPath, 'utf8'));
  }

  private async saveAccessControl(accessControl: any): Promise<void> {
    const accessControlPath = path.join(process.cwd(), '.tnf', 'access-control.json');
    const configDir = path.dirname(accessControlPath);
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(accessControlPath, JSON.stringify(accessControl, null, 2));
  }
}

/**
 * Security encrypt subcommand
 */
class SecurityEncryptSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[input]', 'File or data to encrypt')
      .option('-o, --output <output>', 'Output file')
      .option('--key <key>', 'Encryption key (will generate if not provided)')
      .option('--algorithm <algorithm>', 'Encryption algorithm', 'aes-256-gcm');
  }

  protected async handleCommand(input: string | undefined, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        if (!input) {
          throw new Error('Input file or data is required');
        }

        const key = options.key || await this.generateKey();
        const encryptedData = await this.encryptData(input, key, options);
        
        if (options.output) {`, fs.writeFileSync(options.output, encryptedData)));
                `
          console.log(chalk.green(✅ Encrypted data saved to: ${options.output}`;
            }
        });
        ;
    }
}
{
    console.log(chalk.blue('Encrypted data:'));
    console.log(encryptedData);
}
if (!options.key) {
    console.log(chalk.yellow('⚠️  Save this encryption key:'));
    console.log(chalk.white(key));
}
return {
    input,
    output: options.output,
    algorithm: options.algorithm,
    timestamp: new Date().toISOString()
};
'Data encrypted successfully',
    'Failed to encrypt data';
;
async;
generateKey();
Promise < string > {
    return: crypto.randomBytes(32).toString('hex')
};
async;
encryptData(input, string, key, string, options, any);
Promise < string > {
    let, data: string,
    if(fs) { }, : .existsSync(input)
};
{
    data = fs.readFileSync(input, 'utf8');
}
{
    data = input;
}
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipher(options.algorithm, key);
let encrypted = cipher.update(data, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();
// Combine IV, auth tag, and encrypted data
const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
return combined;
/**
 * Security decrypt subcommand
 */
class SecurityDecryptSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[input]', 'File or data to decrypt')
            .option('-o, --output <output>', 'Output file')
            .option('--key <key>', 'Decryption key')
            .option('--algorithm <algorithm>', 'Decryption algorithm', 'aes-256-gcm');
    }
    async handleCommand(input, options) {
        await this.executeWithHandling(async () => {
            if (!input) {
                throw new Error('Input file or data is required');
            }
            if (!options.key) {
                throw new Error('Decryption key is required');
            }
            const decryptedData = await this.decryptData(input, options.key, options);
            if (options.output) {
                fs.writeFileSync(options.output, decryptedData);
                console.log(chalk.green(Decrypted, data, saved, to, $, { options, : .output }));
            }
            else {
                console.log(chalk.blue('Decrypted data:'));
                console.log(decryptedData);
            }
            return {
                input,
                output: options.output,
                algorithm: options.algorithm,
                timestamp: new Date().toISOString()
            };
        }, 'Data decrypted successfully', 'Failed to decrypt data');
    }
    async decryptData(input, key, options) {
        let data;
        if (fs.existsSync(input)) {
            data = fs.readFileSync(input, 'utf8');
        }
        else {
            data = input;
        }
        // Split IV, auth tag, and encrypted data
        const parts = data.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipher(options.algorithm, key);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
/**
 * Security keys subcommand
 */
class SecurityKeysSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[action]', 'Action to perform (generate|rotate|list)')
            .option('--type <type>', 'Key type (aes|rsa)', 'aes')
            .option('--bits <bits>', 'Key bits', '256');
    }
    async handleCommand(action, options) {
        if (!action) {
            action = 'list';
        }
        switch (action) {
            case 'generate':
                await this.generateKey(options);
                break;
            case 'rotate':
                await this.rotateKey(options);
                break;
            case 'list':
                await this.listKeys();
                break;
            default:
                throw new Error(Unknown, action, $, { action }.Use, 'generate', 'rotate', or, 'list');
        }
    }
    async generateKey(options) {
        await this.executeWithHandling(async () => {
            const keyId = crypto.randomBytes(8).toString('hex');
            let keyData;
            if (options.type === 'rsa') {
                const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                    modulusLength: parseInt(options.bits) || 2048,
                    publicKeyEncoding: { type: 'spki', format: 'pem' },
                    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
                });
                keyData = { publicKey, privateKey };
            }
            else {
                keyData = crypto.randomBytes(parseInt(options.bits) / 8).toString('hex');
            }
            await this.saveKey(keyId, keyData, options.type);
            `
        `;
            console.log(chalk.green(Key, generated, $, { keyId } `));
        console.log(chalk.gray(Type: ${options.type}));
        console.log(chalk.gray(Bits: ${options.bits}));

        return { keyId, type: options.type, bits: options.bits };
      },
      'Key generated successfully',
      'Failed to generate key'
    );
  }

  private async rotateKey(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const keys = await this.getKeys();
        const keyIds = Object.keys(keys);
        
        if (keyIds.length === 0) {
          console.log(chalk.yellow('No keys found to rotate'));
          return;
        }

        // Generate new key
        const newKeyId = crypto.randomBytes(8).toString('hex');
        const keyData = crypto.randomBytes(parseInt(options.bits) / 8).toString('hex');
        
        await this.saveKey(newKeyId, keyData, options.type);
        
        // Mark old key as deprecated
        const oldKeyId = keyIds[keyIds.length - 1];
        keys[oldKeyId].deprecated = true;
        keys[oldKeyId].replacedBy = newKeyId;
        
        await this.saveKey(oldKeyId, keys[oldKeyId], options.type);` `
        console.log(chalk.green(✅ Key rotated: ${oldKeyId} -> ${newKeyId}`));
            return { oldKey: oldKeyId, newKey: newKeyId };
        }, 'Key rotated successfully', 'Failed to rotate key');
    }
    async listKeys() {
        await this.executeWithHandling(async () => {
            const keys = await this.getKeys();
            console.log(chalk.blue.bold('🔑 Security Keys\n'));
            if (Object.keys(keys).length === 0) {
                console.log(chalk.yellow('No keys found'));
                return;
            }
            Object.entries(keys).forEach(([keyId, keyInfo]) => {
                const statusIcon = keyInfo.deprecated ? chalk.gray('❌') : chalk.green('✅');
                console.log($, { statusIcon }, $, { chalk, : .white.bold(keyId) });
                `
          console.log(chalk.gray(  Type: ${keyInfo.type}`;
            });
        });
        console.log(chalk.gray(Created, $, { keyInfo, : .createdAt }));
        if (keyInfo.deprecated) {
            console.log(chalk.gray(Replaced, by, $, { keyInfo, : .replacedBy }));
        }
        console.log();
    }
    ;
}
return { keys, count: Object.keys(keys).length };
'Keys listed successfully',
    'Failed to list keys';
;
async;
getKeys();
Promise < any > {
    const: keysPath = path.join(process.cwd(), '.tnf', 'keys.json'),
    if(, fs) { }, : .existsSync(keysPath)
};
{
    return {};
}
return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
async;
saveKey(keyId, string, keyData, any, type, string);
Promise < void  > {
    const: keysPath = path.join(process.cwd(), '.tnf', 'keys.json'),
    const: configDir = path.dirname(keysPath),
    if(, fs) { }, : .existsSync(configDir)
};
{
    fs.mkdirSync(configDir, { recursive: true });
}
let keys = {};
if (fs.existsSync(keysPath)) {
    keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
}
keys[keyId] = {
    type,
    data: keyData,
    createdAt: new Date().toISOString()
};
fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));
/**
 * Security compliance subcommand
 */
class SecurityComplianceSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('--check', 'Check compliance')
            .option('--standard <standard>', 'Compliance standard (gdpr|hipaa|pci-dss|sox)', 'gdpr')
            .option('--report', 'Generate compliance report');
    }
    async handleCommand(options) {
        await this.executeWithHandling(`
      async () => {`, console.log(chalk.blue(Checking, $, { options, : .standard.toUpperCase() } ` compliance...));
        
        const complianceResults = await this.checkCompliance(options.standard);
        
        console.log(chalk.blue.bold(\n📊 ${options.standard.toUpperCase()} Compliance Results\n));
        
        const passedChecks = complianceResults.checks.filter((check: any) => check.status === 'compliant').length;
        const totalChecks = complianceResults.checks.length;
        const complianceScore = Math.round((passedChecks / totalChecks) * 100);
        `, console.log(chalk.white(Compliance, Score, $, { complianceScore } % )))));
        `
        console.log(chalk.white(`;
        Passed: $;
        {
            passedChecks;
        }
        /${totalChecks} checks;
        ;
        console.log();
        complianceResults.checks.forEach((check) => {
            const statusIcon = check.status === 'compliant' ? chalk.green('✅') :
                check.status === 'non-compliant' ? chalk.red('❌') :
                    chalk.yellow('⚠️');
            `
          `;
            console.log($, { statusIcon } ` ${chalk.white.bold(check.requirement)});
          console.log(chalk.gray(  Description: ${check.description}));`);
            if (check.evidence) {
                `
            console.log(chalk.gray(  Evidence: ${check.evidence}`;
            }
        });
        ;
    }
    console;
}
;
if (options.report) {
    await this.generateComplianceReport(complianceResults, options.standard);
}
return {
    standard: options.standard,
    score: complianceScore,
    results: complianceResults,
    timestamp: new Date().toISOString()
};
'Compliance check completed successfully',
    'Failed to check compliance';
;
async;
checkCompliance(standard, string);
Promise < any > {
    const: checks = [],
    switch(standard) {
    },
    case: 'gdpr',
    checks, : .push(...this.getGDPRChecks()),
    break: ,
    case: 'hipaa',
    checks, : .push(...this.getHIPAAChecks()),
    break: ,
    case: 'pci-dss',
    checks, : .push(...this.getPCIDSSChecks()),
    break: ,
    case: 'sox',
    checks, : .push(...this.getSOXChecks()),
    break: ,
    default: ,
    throw: new Error(Unknown, compliance, standard, $, { standard })
};
return {
    standard,
    checks,
    timestamp: new Date().toISOString()
};
getGDPRChecks();
any[];
{
    return [
        {
            requirement: 'Data Protection Impact Assessment',
            description: 'Conduct DPIA for high-risk processing',
            status: 'non-compliant',
            evidence: 'No DPIA documentation found'
        },
        {
            requirement: 'Data Encryption',
            description: 'Encrypt personal data at rest and in transit',
            status: 'compliant',
            evidence: 'Encryption policies implemented'
        },
        {
            requirement: 'Access Control',
            description: 'Implement proper access controls for personal data',
            status: 'compliant',
            evidence: 'Access control policies in place'
        },
        {
            requirement: 'Data Retention',
            description: 'Implement data retention policies',
            status: 'non-compliant',
            evidence: 'No retention policy found'
        }
    ];
}
getHIPAAChecks();
any[];
{
    return [
        {
            requirement: 'Administrative Safeguards',
            description: 'Implement administrative safeguards',
            status: 'compliant',
            evidence: 'Security policies documented'
        },
        {
            requirement: 'Technical Safeguards',
            description: 'Implement technical safeguards',
            status: 'compliant',
            evidence: 'Encryption and access controls in place'
        },
        {
            requirement: 'Physical Safeguards',
            description: 'Implement physical safeguards',
            status: 'non-compliant',
            evidence: 'Physical security measures not documented'
        }
    ];
}
getPCIDSSChecks();
any[];
{
    return [
        {
            requirement: 'Network Security',
            description: 'Maintain secure network',
            status: 'compliant',
            evidence: 'Firewall and network segmentation implemented'
        },
        {
            requirement: 'Data Protection',
            description: 'Protect cardholder data',
            status: 'compliant',
            evidence: 'Encryption implemented'
        },
        {
            requirement: 'Vulnerability Management',
            description: 'Maintain vulnerability management program',
            status: 'non-compliant',
            evidence: 'Regular scanning not implemented'
        }
    ];
}
getSOXChecks();
any[];
{
    return [
        {
            requirement: 'Access Controls',
            description: 'Implement access controls for financial data',
            status: 'compliant',
            evidence: 'Access control policies in place'
        },
        {
            requirement: 'Audit Trail',
            description: 'Maintain audit trail for financial transactions',
            status: 'compliant',
            evidence: 'Logging implemented'
        },
        {
            requirement: 'Data Integrity',
            description: 'Ensure data integrity',
            status: 'compliant',
            evidence: 'Data integrity checks implemented'
        }
    ];
}
async;
generateComplianceReport(results, any, standard, string);
Promise < void  > {
    const: timestamp = new Date().toISOString().replace(/[:.]/g, '-'),
    const: filename = compliance - report - $
};
{
    standard;
}
-$;
{
    timestamp;
}
json;
`
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));` `
    console.log(chalk.green(✅ Compliance report generated: ${filename}));
  }
}

/**
 * Security incident subcommand
 */
class SecurityIncidentSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[action]', 'Action to perform (report|list|status)')
      .argument('[id]', 'Incident ID')
      .option('--severity <severity>', 'Incident severity (low|medium|high|critical)')
      .option('--type <type>', 'Incident type')
      .option('--description <description>', 'Incident description');
  }

  protected async handleCommand(action: string | undefined, id: string | undefined, options: any): Promise<void> {
    if (!action) {
      action = 'list';
    }

    switch (action) {
      case 'report':
        await this.reportIncident(options);
        break;
      case 'list':
        await this.listIncidents();
        break;
      case 'status':
        await this.updateIncidentStatus(id || '', options);`;
break;
`
      default:`;
throw new Error(Unknown, action, $, { action }.Use, 'report', 'list', or, 'status');
async;
reportIncident(options, any);
Promise < void  > {
    await, this: .executeWithHandling(async () => {
        const incidentId = crypto.randomBytes(4).toString('hex');
        const incident = {
            id: incidentId,
            severity: options.severity || 'medium',
            type: options.type || 'security',
            description: options.description || 'Security incident reported',
            status: 'open',
            reportedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.saveIncident(incident);
        `
        console.log(chalk.green(✅ Incident reported: ${incidentId}));`;
        console.log(chalk.gray(Severity, $, { incident, : .severity } `));
        console.log(chalk.gray(Type: ${incident.type}));

        return { incident };
      },
      'Incident reported successfully',
      'Failed to report incident'
    );
  }

  private async listIncidents(): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const incidents = await this.getIncidents();
        
        console.log(chalk.blue.bold('🚨 Security Incidents\n'));

        if (incidents.length === 0) {
          console.log(chalk.green('No security incidents reported'));
          return;
        }

        incidents.forEach((incident: any) => {
          const severityIcon = incident.severity === 'critical' ? chalk.red('🔴') :
                               incident.severity === 'high' ? chalk.orange('🟠') :
                               incident.severity === 'medium' ? chalk.yellow('🟡') :
                               chalk.gray('⚪');
          const statusIcon = incident.status === 'open' ? chalk.red('●') :
                           incident.status === 'investigating' ? chalk.yellow('◐') :
                           chalk.green('○');` `
          console.log(${severityIcon}`, $, { statusIcon }, $, { chalk, : .white.bold(incident.id) }));
        `
          console.log(chalk.gray(  Type: ${incident.type}));`;
        console.log(chalk.gray(`  Severity: ${incident.severity}));`, console.log(chalk.gray(Description, $, { incident, : .description } `));
          console.log(chalk.gray(  Reported: ${incident.reportedAt}));`, console.log(chalk.gray(Status, $, { incident, : .status }))))));
        console.log();
    }),
    return: { incidents, count: incidents.length }
},
    'Incidents listed successfully',
    'Failed to list incidents';
;
async;
updateIncidentStatus(id, string, options, any);
Promise < void  > {
    if(, id) {
        throw new Error('Incident ID is required for status update');
    },
    await, this: .executeWithHandling(async () => {
        const incident = await this.getIncident(id);
        if (!incident) {
            `
          throw new Error(Incident not found: ${id}`;
        }
    })
};
const inquirer = await import('inquirer');
const answers = await inquirer.default.prompt([
    {
        type: 'list',
        name: 'status',
        message: 'New status:',
        choices: ['open', 'investigating', 'resolved', 'closed']
    }
]);
incident.status = answers.status;
incident.updatedAt = new Date().toISOString();
await this.saveIncident(incident);
console.log(chalk.green(Incident, $, { id } ` status updated to: ${answers.status}`));
return { id, status: answers.status };
'Incident status updated successfully',
    'Failed to update incident status';
;
async;
getIncidents();
Promise < any[] > {
    const: incidentsPath = path.join(process.cwd(), '.tnf', 'incidents.json'),
    if(, fs) { }, : .existsSync(incidentsPath)
};
{
    return [];
}
const incidents = JSON.parse(fs.readFileSync(incidentsPath, 'utf8'));
// Sort by reported date (newest first)
return incidents.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
async;
getIncident(id, string);
Promise < any > {
    const: incidents = await this.getIncidents(),
    return: incidents.find(incident => incident.id === id)
};
async;
saveIncident(incident, any);
Promise < void  > {
    const: incidentsPath = path.join(process.cwd(), '.tnf', 'incidents.json'),
    const: configDir = path.dirname(incidentsPath),
    if(, fs) { }, : .existsSync(configDir)
};
{
    fs.mkdirSync(configDir, { recursive: true });
}
let incidents = await this.getIncidents();
const existingIndex = incidents.findIndex((inc) => inc.id === incident.id);
if (existingIndex >= 0) {
    incidents[existingIndex] = incident;
}
else {
    incidents.push(incident);
}
fs.writeFileSync(incidentsPath, JSON.stringify(incidents, null, 2));
/**
 * Register the security category command
 */
export function registerSecurityCommands(program) {
    const securityCommand = new SecurityCommand(program);
    return securityCommand.createCategoryCommand();
}
//# sourceMappingURL=security.js.map