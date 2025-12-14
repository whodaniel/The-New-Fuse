/**
 * Security Dashboard for VSCode Extension
 * Provides UI components for security monitoring and management
 */
class SecurityDashboard {
    constructor(securityOrchestrator, context) {
        this.securityOrchestrator = securityOrchestrator;
        this.context = context;
    }

    /**
     * Show security dashboard
     */
    async showSecurityDashboard() {
        const dashboard = await this.securityOrchestrator.getSecurityDashboard();

        const content = this._generateDashboardHTML(dashboard);

        this._showFeature('Security Dashboard', '🛡️ Security Monitoring Center', content);
    }

    /**
     * Run security scan
     */
    async runSecurityScan() {
        try {
            const results = await this.securityOrchestrator.performSecurityScan();

            const content = this._generateScanResultsHTML(results);

            this._showFeature('Security Scan Results', '🔍 Security Scan Complete', content);
        } catch (error) {
            this._showFeature('Security Scan Failed', '❌ Security Scan Error',
                `**Security scan failed:** ${error.message}

**Troubleshooting:**
• Check network connectivity
• Verify file permissions
• Ensure security modules are initialized
• Review scan configuration

**Quick Actions:**
• Try running the scan again
• Check security dashboard for status
• Review audit logs for details`);
        }
    }

    /**
     * Generate dashboard HTML
     */
    _generateDashboardHTML(dashboard) {
        const statusColor = dashboard.securityEnabled ? '🟢' : '🔴';
        const emergencyColor = dashboard.emergencyMode ? '🔴' : '🟢';

        return `
# 🛡️ Security Monitoring Dashboard

## System Status
- **Security Status**: ${statusColor} ${dashboard.securityEnabled ? 'ENABLED' : 'DISABLED'}
- **Emergency Mode**: ${emergencyColor} ${dashboard.emergencyMode ? 'ACTIVE' : 'INACTIVE'}
- **Last Check**: ${new Date(dashboard.lastSecurityCheck).toLocaleString()}

## Module Health
${Object.entries(dashboard.modules).map(([module, status]) =>
    `- **${module}**: ${status.status === 'healthy' ? '🟢 Healthy' : '🔴 ' + status.status}`
).join('\n')}

## Vulnerability Scan Status
- **Last Scan**: ${dashboard.vulnerabilityScan.lastScanTime ?
    new Date(dashboard.vulnerabilityScan.lastScanTime).toLocaleString() : 'Never'}
- **Status**: ${dashboard.vulnerabilityScan.scanStatus === 'completed' ? '🟢 Completed' :
    dashboard.vulnerabilityScan.scanStatus === 'running' ? '🟡 Running' : '🔴 Never Run'}

### Vulnerability Summary
- **Critical**: ${dashboard.vulnerabilityScan.vulnerabilitySummary.critical}
- **High**: ${dashboard.vulnerabilityScan.vulnerabilitySummary.high}
- **Medium**: ${dashboard.vulnerabilityScan.vulnerabilitySummary.medium}
- **Low**: ${dashboard.vulnerabilityScan.vulnerabilitySummary.low}
- **Total**: ${dashboard.vulnerabilityScan.vulnerabilitySummary.totalVulnerabilities}

## Recent Security Events
${dashboard.auditStats.recentErrors.slice(0, 5).map(event =>
    `- **[${event.severity.toUpperCase()}]** ${event.eventType} (${new Date(event.timestamp).toLocaleString()})`
).join('\n') || '*No recent security events*'}

## Connection Security
- **Active Connections**: ${dashboard.connectionStats.activeConnections}
- **HTTPS Enforced**: ${dashboard.connectionStats.encryptionEnabled ? '✅ Yes' : '❌ No'}
- **Certificate Cache**: ${dashboard.connectionStats.cachedCertificates} entries

## Rate Limiting
- **Active Limits**: ${dashboard.rateLimitStats.rateLimitEntries} entries
- **Input Validation**: ✅ Active
- **Content Filtering**: ✅ Active

## Quick Actions
- 🔍 **Run Security Scan** - Perform comprehensive vulnerability scan
- 📊 **View Audit Logs** - Review detailed security event logs
- ⚙️ **Security Settings** - Configure security preferences
- 🚨 **Emergency Mode** - ${dashboard.emergencyMode ? 'Disable' : 'Enable'} emergency mode

## Security Score
**Overall Security Score: ${this._calculateSecurityScore(dashboard)}/100**

${this._getSecurityRecommendations(dashboard)}
        `;
    }

    /**
     * Generate scan results HTML
     */
    _generateScanResultsHTML(results) {
        const duration = (results.scanDuration / 1000).toFixed(2);

        return `
# 🔍 Security Scan Results

## Scan Summary
- **Scan ID**: ${results.scanId}
- **Timestamp**: ${new Date(results.timestamp).toLocaleString()}
- **Duration**: ${duration} seconds
- **Targets Scanned**: ${results.targets.join(', ')}

## Vulnerability Summary
- **Critical**: ${results.summary.critical}
- **High**: ${results.summary.high}
- **Medium**: ${results.summary.medium}
- **Low**: ${results.summary.low}
- **Total Findings**: ${results.summary.totalVulnerabilities}

## Detailed Findings
${results.findings.map(finding => `
### ${finding.severity.toUpperCase()}: ${finding.type}
**Location**: ${finding.target}${finding.file ? ` - ${finding.file}` : ''}
**Description**: ${finding.description}
**Recommendation**: ${finding.recommendation}
${finding.codeSnippet ? `**Code Snippet**:\n\`\`\`\n${finding.codeSnippet}\n\`\`\`` : ''}
${finding.lineNumbers ? `**Lines**: ${finding.lineNumbers.join(', ')}` : ''}
`).join('\n')}

## Next Steps
${results.summary.critical > 0 || results.summary.high > 0 ?
    `🚨 **Immediate Action Required**: Address critical and high-severity findings immediately.` :
    results.summary.medium > 0 || results.summary.low > 0 ?
    `⚠️ **Review Recommended**: Address medium and low-severity findings when possible.` :
    `✅ **Scan Passed**: No significant security issues found.`
}

## Recommendations
- Review all findings and implement fixes
- Run regular security scans (recommended: weekly)
- Keep security modules updated
- Monitor audit logs for suspicious activity
- Configure appropriate rate limiting
        `;
    }

    /**
     * Calculate security score
     */
    _calculateSecurityScore(dashboard) {
        let score = 100;

        // Deduct points for disabled security
        if (!dashboard.securityEnabled) score -= 50;
        if (dashboard.emergencyMode) score -= 30;

        // Deduct points for unhealthy modules
        const unhealthyModules = Object.values(dashboard.modules).filter(m => m.status !== 'healthy').length;
        score -= unhealthyModules * 10;

        // Deduct points for vulnerabilities
        const vulns = dashboard.vulnerabilityScan.vulnerabilitySummary;
        score -= (vulns.critical * 20) + (vulns.high * 10) + (vulns.medium * 5) + (vulns.low * 1);

        // Deduct points for recent errors
        score -= Math.min(dashboard.auditStats.recentErrors.length * 5, 20);

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get security recommendations
     */
    _getSecurityRecommendations(dashboard) {
        const recommendations = [];

        if (!dashboard.securityEnabled) {
            recommendations.push('• **Enable Security**: Reactivate security features for full protection');
        }

        if (dashboard.emergencyMode) {
            recommendations.push('• **Disable Emergency Mode**: Return to normal security operations');
        }

        const unhealthyModules = Object.entries(dashboard.modules)
            .filter(([, status]) => status.status !== 'healthy')
            .map(([module]) => module);

        if (unhealthyModules.length > 0) {
            recommendations.push(`• **Fix Modules**: Address issues with: ${unhealthyModules.join(', ')}`);
        }

        const vulns = dashboard.vulnerabilityScan.vulnerabilitySummary;
        if (vulns.totalVulnerabilities > 0) {
            recommendations.push(`• **Fix Vulnerabilities**: Address ${vulns.totalVulnerabilities} security findings`);
        }

        if (dashboard.auditStats.recentErrors.length > 0) {
            recommendations.push('• **Review Errors**: Investigate recent security events in audit logs');
        }

        if (recommendations.length === 0) {
            return '\n## ✅ Security Status: Excellent\nYour security posture is strong. Continue monitoring and regular scans.';
        }

        return '\n## 📋 Security Recommendations\n' + recommendations.join('\n');
    }

    /**
     * Show feature in chat
     */
    _showFeature(title, header, content) {
        // This will be called from the ChatViewProvider
        if (this._showFeatureCallback) {
            this._showFeatureCallback(title, header, content);
        }
    }

    /**
     * Set callback for showing features
     */
    setShowFeatureCallback(callback) {
        this._showFeatureCallback = callback;
    }
}

module.exports = SecurityDashboard;