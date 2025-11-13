"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMonitorAgent = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
const MetricsService_1 = require("../../monitoring/MetricsService");
let SecurityMonitorAgent = class SecurityMonitorAgent {
    logger;
    metricsService;
    threats = new Map();
    securityRules = new Map();
    securityActions = new Map();
    securityAlerts = [];
    vulnerabilityAssessments = [];
    securityIncidents = new Map();
    blockedIPs = new Set();
    quarantinedUsers = new Set();
    isInitialized = false;
    metrics;
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
        this.metrics = this.initializeMetrics();
        this.initializeDefaultRules();
    }
    initializeMetrics() {
        return {
            total_threats: 0,
            active_threats: 0,
            resolved_threats: 0,
            false_positives: 0,
            blocked_ips: 0,
            quarantined_users: 0,
            alerts_sent: 0,
            response_time_avg_ms: 0,
            detection_accuracy: 0,
            last_scan: new Date(),
            system_health_score: 100
        };
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                id: 'brute_force_detection',
                name: 'Brute Force Attack Detection',
                description: 'Detects repeated failed login attempts from same IP',
                rule_type: 'rate_limit',
                conditions: {
                    failed_attempts: 5,
                    time_window: 300000, // 5 minutes
                    resource: 'authentication'
                },
                actions: ['block_ip', 'alert_admin'],
                severity: 'high',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'sql_injection_detection',
                name: 'SQL Injection Detection',
                description: 'Detects potential SQL injection patterns in requests',
                rule_type: 'pattern_match',
                conditions: {
                    patterns: ['UNION SELECT', 'DROP TABLE', 'OR 1=1', '--', ';'],
                    case_sensitive: false
                },
                actions: ['block_ip', 'log_event', 'alert_admin'],
                severity: 'critical',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'xss_detection',
                name: 'Cross-Site Scripting Detection',
                description: 'Detects potential XSS attacks in user input',
                rule_type: 'pattern_match',
                conditions: {
                    patterns: ['<script>', 'javascript:', 'onload=', 'onerror=', 'onclick='],
                    case_sensitive: false
                },
                actions: ['log_event', 'alert_admin'],
                severity: 'medium',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'unusual_access_pattern',
                name: 'Unusual Access Pattern Detection',
                description: 'Detects access patterns that deviate from normal behavior',
                rule_type: 'anomaly_detection',
                conditions: {
                    deviation_threshold: 3,
                    baseline_days: 7,
                    min_requests: 10
                },
                actions: ['log_event'],
                severity: 'low',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
        defaultRules.forEach(rule => {
            this.securityRules.set(rule.id, rule);
        });
    }
    async initialize() {
        try {
            this.logger.log('Initializing Security Monitor Agent...', 'SecurityMonitorAgent');
            // Start monitoring intervals
            this.startThreatDetection();
            this.startMetricsCollection();
            this.startAlertProcessing();
            this.startVulnerabilityScanning();
            this.isInitialized = true;
            this.logger.log('Security Monitor Agent initialized successfully', 'SecurityMonitorAgent');
            await this.metricsService.recordMetric('security_monitor_initialized', 1, 'counter', { labels: { component: 'security_monitor' } });
        }
        catch (error) {
            this.logger.error('Failed to initialize Security Monitor Agent', error instanceof Error ? error : new Error(String(error)), 'SecurityMonitorAgent');
            throw error;
        }
    }
    async detectThreat(type, sourceIP, targetResource, evidence, severity) {
        try {
            const threat = {
                id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
        type,
        severity: severity || this.calculateSeverity(type, evidence),
        source_ip: sourceIP,
        target_resource: targetResource,
        description: this.generateThreatDescription(type, evidence),
        evidence,
        indicators: this.extractIndicators(evidence),
        status: 'detected',
        detected_at: new Date(),
        updated_at: new Date(),
        response_actions: []
      };

      this.threats.set(threat.id, threat);
      this.metrics.total_threats++;
      this.metrics.active_threats++;

      // Trigger automated response
      await this.triggerAutomatedResponse(threat);

      // Send alerts
      await this.sendSecurityAlert(threat);
`,
                this: .logger.warn(Security, threat, detected, $, { threat, : .type } ` from ${sourceIP}`, 'SecurityMonitorAgent'),
                await: this.metricsService.recordMetric('security_threat_detected', 1, 'counter', {
                    labels: {
                        type: threat.type,
                        severity: threat.severity
                    }
                }),
                return: threat
            };
            try { }
            catch (error) {
                this.logger.error('Failed to detect threat', error instanceof Error ? error : new Error(String(error)), 'SecurityMonitorAgent');
                throw error;
            }
        }
        finally {
        }
        async;
        updateThreatStatus(threatId, string, status, SecurityThreat['status']);
        Promise < boolean > {
            try: {
                const: threat = this.threats.get(threatId),
                if(, threat) {
                    return false;
                },
                const: oldStatus = threat.status,
                threat, : .status = status,
                threat, : .updated_at = new Date(),
                if(status) { }
            } === 'resolved' || status === 'false_positive'
        };
        {
            threat.resolved_at = new Date();
            this.metrics.active_threats--;
            if (status === 'resolved') {
                this.metrics.resolved_threats++;
            }
            else {
                this.metrics.false_positives++;
            }
        }
        this.threats.set(threatId, threat);
        await this.metricsService.recordMetric('security_threat_status_updated', 1, 'counter', {
            labels: {
                from_status: oldStatus,
                to_status: status
            }
        });
        return true;
    }
    catch(error) {
        this.logger.error('Failed to update threat status', error instanceof Error ? error : new Error(String(error)), 'SecurityMonitorAgent');
        return false;
    }
};
exports.SecurityMonitorAgent = SecurityMonitorAgent;
exports.SecurityMonitorAgent = SecurityMonitorAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService])
], SecurityMonitorAgent);
async;
blockIP(ipAddress, string, reason, string, duration ?  : number);
Promise < boolean > {
    try: {
        this: .blockedIPs.add(ipAddress),
        this: .metrics.blocked_ips++,
        // Schedule unblock if duration is specified
        if(duration) {
            setTimeout(() => {
                this.blockedIPs.delete(ipAddress);
                this.metrics.blocked_ips--;
                this.logger.log(IP, $, { ipAddress }, automatically, unblocked, after, $, { duration }, ms, 'SecurityMonitorAgent');
            }, duration);
        }
    } `
      this.logger.warn(`, IP, $
};
{
    ipAddress;
}
blocked: $;
{
    reason;
}
`, 'SecurityMonitorAgent');
      
      await this.metricsService.recordMetric('ip_blocked', 1, 'counter', { labels: { ip: ipAddress } });

      return true;
    } catch (error) {
      this.logger.error('Failed to block IP', error instanceof Error ? error : new Error(String(error)), 'SecurityMonitorAgent');
      return false;
    }
  }

  async isIPBlocked(ipAddress: string): Promise<boolean> {
    return this.blockedIPs.has(ipAddress);
  }

  async quarantineUser(userId: string, reason: string, duration?: number): Promise<boolean> {
    try {
      this.quarantinedUsers.add(userId);
      this.metrics.quarantined_users++;

      // Schedule release if duration is specified
      if (duration) {
        setTimeout(() => {
          this.quarantinedUsers.delete(userId);
          this.metrics.quarantined_users--;
          this.logger.log(User ${userId} automatically released from quarantine after ${duration}ms, 'SecurityMonitorAgent');
        }, duration);
      }
`;
this.logger.warn(User, $, { userId }, quarantined, $, { reason } ``, 'SecurityMonitorAgent');
await this.metricsService.recordMetric('user_quarantined', 1, 'counter', { labels: { user_id: userId } });
return true;
try { }
catch (error) {
    this.logger.error('Failed to quarantine user', error instanceof Error ? error : new Error(String(error)), 'SecurityMonitorAgent');
    return false;
}
async;
isUserQuarantined(userId, string);
Promise < boolean > {
    return: this.quarantinedUsers.has(userId)
};
async;
createSecurityRule(rule, (Omit));
Promise < SecurityRule > {
    const: securityRule, SecurityRule = {
        id: rule_$
    }
};
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
rule,
    created_at;
new Date(),
    updated_at;
new Date();
;
this.securityRules.set(securityRule.id, securityRule);
await this.metricsService.recordMetric('security_rule_created', 1, 'counter', { labels: { type: rule.rule_type } });
return securityRule;
async;
runVulnerabilityAssessment(targetSystem, string, assessmentType, VulnerabilityAssessment['assessment_type']);
Promise < VulnerabilityAssessment > {
    try: {
        const: assessment, VulnerabilityAssessment = {} `
        id: vuln_assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assessment_type: assessmentType,
        target_system: targetSystem,
        vulnerabilities: await this.scanForVulnerabilities(targetSystem),
        scan_results: await this.performSecurityScan(targetSystem),
        recommendations: [],
        risk_score: 0,
        completed_at: new Date(),
        next_assessment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    // Calculate risk score
    assessment, : .risk_score = this.calculateRiskScore(assessment.vulnerabilities),
    // Generate recommendations
    assessment, : .recommendations = this.generateRecommendations(assessment.vulnerabilities),
    this: .vulnerabilityAssessments.push(assessment),
    await, this: .metricsService.recordMetric('vulnerability_assessment_completed', 1, 'counter', {
        labels: {
            type: assessmentType,
            target: targetSystem
        }
    }),
    return: assessment
};
try { }
catch (error) {
    this.logger.error('Failed to run vulnerability assessment', error instanceof Error ? error : new Error(String(error)), 'SecurityMonitorAgent');
    throw error;
}
async;
createSecurityIncident(title, string, description, string, severity, SecurityIncident['severity'], affectedSystems, string[], threatIds, string[] = []);
Promise < SecurityIncident > {
    const: incident, SecurityIncident = {
        id: incident_$
    }
};
{
    Date.now();
}
`_${Math.random().toString(36).substr(2, 9)},
      title,
      description,
      severity,
      status: 'open',
      affected_systems: affectedSystems,
      threat_ids: threatIds,
      impact_assessment: {
        data_compromised: false,
        systems_affected: affectedSystems.length,
        users_impacted: 0,
        business_impact: 'Under investigation',
        estimated_cost: 0
      },
      timeline: {
        detected_at: new Date(),
        reported_at: new Date()
      },
      assigned_to: 'security_team',
      stakeholders: [],
      communications: [],
      lessons_learned: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    this.securityIncidents.set(incident.id, incident);

    await this.metricsService.recordMetric('security_incident_created', 1, 'counter', { 
      labels: { 
        severity: severity 
      } 
    });

    return incident;
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async getActiveThreats(): Promise<SecurityThreat[]> {
    return Array.from(this.threats.values()).filter(threat => 
      threat.status === 'detected' || threat.status === 'investigating'
    );
  }

  async getSecurityIncidents(status?: SecurityIncident['status']): Promise<SecurityIncident[]> {
    const incidents = Array.from(this.securityIncidents.values());
    return status ? incidents.filter(incident => incident.status === status) : incidents;
  }

  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: Record<string, any> }> {
    try {
      const activeThreats = this.metrics.active_threats;
      const criticalThreats = Array.from(this.threats.values()).filter(t => 
        t.severity === 'critical' && (t.status === 'detected' || t.status === 'investigating')
      ).length;
      
      const status = criticalThreats > 0 ? 'unhealthy' : 
                    activeThreats > 10 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          active_threats: activeThreats,
          critical_threats: criticalThreats,
          blocked_ips: this.metrics.blocked_ips,
          quarantined_users: this.metrics.quarantined_users,
          system_health_score: this.metrics.system_health_score,
          last_scan: this.metrics.last_scan,
          initialized: this.isInitialized
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private calculateSeverity(type: SecurityThreat['type'], evidence: Record<string, any>): SecurityThreat['severity'] {
    switch (type) {
      case 'sql_injection':
      case 'data_breach':
      case 'privilege_escalation':
        return 'critical';
      case 'brute_force':
      case 'ddos':
      case 'malware':
        return 'high';
      case 'xss':
      case 'csrf':
        return 'medium';
      default:
        return 'low';
    }
  }

  private generateThreatDescription(type: SecurityThreat['type'], evidence: Record<string, any>): string {
    const descriptions = {
      brute_force: 'Multiple failed authentication attempts detected',
      sql_injection: 'Potential SQL injection attack detected in request parameters',
      xss: 'Cross-site scripting attempt detected in user input',
      csrf: 'Cross-site request forgery attack detected',
      malware: 'Malicious file or content detected',
      ddos: 'Distributed denial of service attack detected',
      suspicious_activity: 'Unusual activity pattern detected',
      data_breach: 'Potential data breach or unauthorized access detected',
      privilege_escalation: 'Unauthorized privilege escalation attempt detected'
    };

    return descriptions[type] || 'Security threat detected';
  }

  private extractIndicators(evidence: Record<string, any>): string[] {
    const indicators: string[] = [];
    `;
if (evidence.ip_address)
    indicators.push(IP, $, { evidence, : .ip_address });
`
    if (evidence.user_agent) indicators.push(`;
User - Agent;
$;
{
    evidence.user_agent;
}
;
if (evidence.request_path)
    indicators.push(Path, $, { evidence, : .request_path });
if (evidence.payload)
    indicators.push(Payload, detected);
return indicators;
async;
triggerAutomatedResponse(threat, SecurityThreat);
Promise < void  > {
    const: applicableRules = Array.from(this.securityRules.values()).filter(rule => rule.is_active && this.ruleApplies(rule, threat)),
    for(, rule, of, applicableRules) {
        for (const actionType of rule.actions) {
            const action = await this.createSecurityAction(threat.id, actionType, rule);
            await this.executeSecurityAction(action);
        }
    }
};
ruleApplies(rule, SecurityRule, threat, SecurityThreat);
boolean;
{
    // Simple rule matching - in a real implementation this would be more sophisticated
    return rule.severity === threat.severity || rule.rule_type === 'pattern_match';
}
async;
createSecurityAction(threatId, string, actionType, SecurityAction['action_type'], rule, SecurityRule);
Promise < SecurityAction > {} `
    const action: SecurityAction = {`;
id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      threat_id: threatId,`;
action_type: actionType, `
      description: Automated ${actionType}`;
triggered;
by;
rule: $;
{
    rule.name;
}
parameters: { }
status: 'pending',
    created_at;
new Date();
;
this.securityActions.set(action.id, action);
return action;
async;
executeSecurityAction(action, SecurityAction);
Promise < void  > {
    try: {
        action, : .status = 'executing',
        action, : .executed_at = new Date(),
        const: threat = this.threats.get(action.threat_id),
        if(, threat) { }, return: ,
        switch(action) { }, : .action_type
    }
};
{
    'block_ip';
    await this.blockIP(threat.source_ip, Threat, $, { threat, : .type }, 24 * 60 * 60 * 1000); // 24 hours
    break;
    'alert_admin';
    await this.sendSecurityAlert(threat);
    break;
    `
        case 'log_event':`;
    this.logger.warn(`Security action: ${action.description}, 'SecurityMonitorAgent');
          break;
        // Add more action types as needed
      }

      action.status = 'completed';
      action.result = { success: true };
    } catch (error) {
      action.status = 'failed';
      action.result = { error: error instanceof Error ? error.message : String(error) };
    }

    this.securityActions.set(action.id, action);
  }

  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    const alert: SecurityAlert = {`, id, alert_$, { Date, : .now() }, _$, { Math, : .random().toString(36).substr(2, 9) } `,
      threat_id: threat.id,
      alert_type: 'email',
      recipient: 'security@company.com',
      message: Security Alert: ${threat.type}`, detected, from, $, { threat, : .source_ip }.Severity, $, { threat, : .severity }, priority, threat.severity === 'critical' ? 'urgent' : threat.severity === 'high' ? 'high' : 'medium', status, 'pending', created_at, new Date());
}
;
this.securityAlerts.push(alert);
this.metrics.alerts_sent++;
// In a real implementation, this would send actual alerts
alert.status = 'sent';
alert.sent_at = new Date();
async;
scanForVulnerabilities(targetSystem, string);
Promise < VulnerabilityAssessment['vulnerabilities'] > {
    // Mock vulnerability scan - in a real implementation this would use actual security scanners
    return: [
        {
            id: 'vuln_1',
            title: 'Outdated Dependencies',
            description: 'Some dependencies have known security vulnerabilities',
            severity: 'medium',
            cvss_score: 5.5,
            affected_components: ['express', 'lodash'],
            remediation_steps: ['Update to latest versions', 'Review dependency tree'],
            status: 'open'
        }
    ]
};
async;
performSecurityScan(targetSystem, string);
Promise < Record < string, any >> {
    // Mock security scan results
    return: {
        open_ports: [80, 443],
        ssl_certificate: 'valid',
        security_headers: 'partial',
        authentication: 'enabled',
        encryption: 'enabled'
    }
};
calculateRiskScore(vulnerabilities, VulnerabilityAssessment['vulnerabilities']);
number;
{
    return vulnerabilities.reduce((score, vuln) => {
        const severityWeights = { low: 1, medium: 3, high: 7, critical: 10 };
        return score + severityWeights[vuln.severity];
    }, 0);
}
generateRecommendations(vulnerabilities, VulnerabilityAssessment['vulnerabilities']);
string[];
{
    const recommendations = [];
    vulnerabilities.forEach(vuln => {
        `
      if (vuln.severity === 'critical' || vuln.severity === 'high') {`;
        recommendations.push(Priority, Address, $, { vuln, : .title } ` immediately`);
    });
}
;
recommendations.push('Implement regular security scanning');
recommendations.push('Keep dependencies up to date');
recommendations.push('Review and update security policies');
return recommendations;
startThreatDetection();
void {
    setInterval(async) { }
}();
{
    // Continuous threat detection logic would go here
    // This could analyze logs, network traffic, user behavior, etc.
    this.metrics.last_scan = new Date();
}
60000;
; // Every minute
startMetricsCollection();
void {
    setInterval() { }
}();
{
    this.updateMetrics();
}
30000;
; // Every 30 seconds
startAlertProcessing();
void {
    setInterval() { }
}();
{
    // Process pending alerts
    const pendingAlerts = this.securityAlerts.filter(alert => alert.status === 'pending');
    // In a real implementation, this would send actual alerts
}
10000;
; // Every 10 seconds
startVulnerabilityScanning();
void {
    setInterval(async) { }
}();
{
    // Periodic vulnerability scanning
    // In a real implementation, this would run actual security scans
}
24 * 60 * 60 * 1000;
; // Daily
updateMetrics();
void {
    this: .metrics.active_threats = Array.from(this.threats.values()).filter(t => t.status === 'detected' || t.status === 'investigating').length,
    // Calculate detection accuracy
    const: total = this.metrics.resolved_threats + this.metrics.false_positives,
    if(total) { }
} > 0;
{
    this.metrics.detection_accuracy = this.metrics.resolved_threats / total;
}
// Calculate system health score
const criticalThreats = Array.from(this.threats.values()).filter(t => t.severity === 'critical').length;
this.metrics.system_health_score = Math.max(0, 100 - (criticalThreats * 20));
//# sourceMappingURL=security-monitor.js.map