import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Interface for a single security rule
export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  condition: string; // e.g., "context.user.role === 'admin'"
  metadata?: Record<string, any>;
}

// Interface for a security policy, which contains multiple rules
export interface SecurityPolicy {
  id: string;
  name: string;
  version: string;
  rules: SecurityRule[];
  metadata?: Record<string, any>;
}

// Data structure for a detected violation
export interface SecurityViolation {
  rule: SecurityRule;
  context: any;
  timestamp: Date;
  status: 'open' | 'resolved';
}

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);
  private policies: Map<string, SecurityPolicy> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Creates a new security policy.
   */
  async createPolicy(policyData: Omit<SecurityPolicy, 'id' | 'version'>): Promise<SecurityPolicy> {
    const policy: SecurityPolicy = {
      ...policyData,
      id: this.generateId(),
      version: '1.0.0',
    };
    this.policies.set(policy.id, policy);
    this.logger.log(`Policy created: ${policy.name} (ID: ${policy.id})`);
    this.eventEmitter.emit('policy.created', policy);
    return policy;
  }

  /**
   * Updates an existing security policy.
   */
  async updatePolicy(policyId: string, updates: Partial<Omit<SecurityPolicy, 'id'>>): Promise<SecurityPolicy | null> {
    const existingPolicy = this.policies.get(policyId);
    if (!existingPolicy) {
      this.logger.warn(`Policy with ID ${policyId} not found.`);
      return null;
    }

    const updatedPolicy = { ...existingPolicy, ...updates, version: this.incrementVersion(existingPolicy.version) };
    this.policies.set(policyId, updatedPolicy);

    this.logger.log(`Policy updated: ${updatedPolicy.name} (ID: ${policyId})`);
    this.eventEmitter.emit('policy.updated', updatedPolicy);
    return updatedPolicy;
  }

  /**
   * Evaluates a context against a set of security policies.
   */
  async evaluate(context: any): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    for (const policy of this.policies.values()) {
      for (const rule of policy.rules) {
        try {
          if (!this.evaluateRule(rule, context)) {
            const violation: SecurityViolation = {
              rule,
              context,
              timestamp: new Date(),
              status: 'open',
            };
            violations.push(violation);
            this.eventEmitter.emit('policy.violation', violation);
          }
        } catch (error) {
          this.logger.error(`Error evaluating rule "${rule.name}": ${error.message}`, error.stack);
        }
      }
    }
    return violations;
  }

  /**
   * A simple, safe rule evaluator.
   */
  private evaluateRule(rule: SecurityRule, context: any): boolean {
    // This is a placeholder for a safe rule evaluation engine.
    // For now, we'll just support a very simple condition.
    if (rule.condition === "context.user.role === 'admin'") {
      return context.user && context.user.role === 'admin';
    }
    return true;
  }

  /**
   * Increments a semantic version string (e.g., "1.0.0" -> "1.0.1").
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      this.logger.warn(`Invalid version format "${version}". Resetting to "1.0.1".`);
      return '1.0.1';
    }
    parts[2]++;
    return parts.join('.');
  }

  /**
   * Generates a unique ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
