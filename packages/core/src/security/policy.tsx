import { Injectable } from '@nestjs/common';
import {
  SecurityPolicy,
  SecurityRule,
  SecurityLevel,
  SecurityViolation,
} from './types.js';
import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SecurityPolicyManager {
  private readonly policies: Map<string, SecurityPolicy>;
  private readonly rules: Map<string, (context: unknown) => boolean>;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.policies = new Map();
    this.rules = new Map();
  }

  async createPolicy(policy: Omit<SecurityPolicy, 'id' | 'metadata'>): Promise<SecurityPolicy> {
    const fullPolicy: SecurityPolicy = {
      ...policy,
      id: uuidv4(),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0', // Initialize version correctly
        enabled: true,
      },
    };

    await this.storePolicy(fullPolicy);
    this.compilePolicyRules(fullPolicy);

    this.eventEmitter.emit('policy.created', {
      policyId: fullPolicy.id,
      name: fullPolicy.name,
    });

    return fullPolicy;
  }

  async updatePolicy(
    id: string,
    update: Partial<Omit<SecurityPolicy, 'id' | 'metadata'>>,
  ): Promise<SecurityPolicy> {
    const policy = await this.getPolicy(id);
    if (!policy) {
      throw new Error(`Policy ${id} not found`);
    }

    const updatedPolicy: SecurityPolicy = {
      ...policy,
      ...update,
      metadata: {
        ...policy.metadata,
        updatedAt: new Date(),
        version: this.incrementVersion(policy.metadata.version), // Cast removed
      },
    };

    await this.storePolicy(updatedPolicy);
    this.compilePolicyRules(updatedPolicy);

    this.eventEmitter.emit('policy.updated', {
      policyId: updatedPolicy.id,
      name: updatedPolicy.name,
      version: (updatedPolicy as any).metadata.version,
    });

    return updatedPolicy;
  }

  async deletePolicy(id: string): Promise<void> {
    const policy = this.policies.get(id);
    if (!policy) {
       console.warn(`Policy ${id} not found in memory cache during deletion.`);
       // Optionally try fetching from Redis before giving up
       // const redisPolicy = await this.getPolicyFromRedis(id);
       // if (!redisPolicy) return; // If not in Redis either, nothing to delete
    }

    this.policies.delete(id);

    // Delete policy from Redis
    await this.redisService.del(`policy:${id}`);

    // Delete associated rules if policy existed
    if (policy) {
        policy.rules.forEach(rule => {
            this.rules.delete(rule.id);
        });
    }

    this.eventEmitter.emit('policy.deleted', {
      policyId: id,
      name: policy.name,
    });
  }

  async getPolicy(id: string): Promise<SecurityPolicy | null> {
    // Check memory cache first
    if (this.policies.has(id)) {
      return this.policies.get(id)!; // Non-null assertion as we checked with has()
    }

    // If not in cache, try Redis
    const data = await this.redisService.get(`policy:${id}`);
    if (!data) {
      return null; // Not found in Redis either
    }

    try {
        const policy = JSON.parse(data) as SecurityPolicy;
        // Cache the policy in memory for faster access next time
        this.policies.set(policy.id, policy);
        // Ensure rules are compiled if fetched from Redis
        this.compilePolicyRules(policy);
        return policy;
    } catch (error) {
        console.error(`Error parsing policy data from Redis for ID ${id}:`, error);
        // Optionally delete corrupted data from Redis
        // await this.redisService.del(`policy:${id}`);
        return null;
    }
  }

  async listPolicies(options?: {
    level?: SecurityLevel;
    enabled?: boolean;
  }): Promise<SecurityPolicy[]> {
    const keys = await this.redisService.keys('policy:*');
    const policiesData = await this.redisService.mget(keys);
    const policies: SecurityPolicy[] = [];

    for (const data of policiesData) {
        if (data) {
            try {
                const policy = JSON.parse(data) as SecurityPolicy;
                if (this.matchesFilter(policy, options)) {
                    policies.push(policy);
                    // Ensure policy is cached and rules compiled
                    if (!this.policies.has(policy.id)) {
                        this.policies.set(policy.id, policy);
                        this.compilePolicyRules(policy);
                    }
                }
            } catch (error) {
                console.error('Error parsing policy data during list operation:', error);
            }
        }
    }
    return policies;
  }


  async evaluatePolicy(
    policyId: string,
    context: unknown,
  ): Promise<SecurityViolation[]> {
    const policy = await this.getPolicy(policyId);
    if (!policy || !policy.metadata.enabled) {
      return []; // Policy not found or disabled
    }

    const violations: SecurityViolation[] = [];

    for (const rule of policy.rules) {
      if (!rule.enabled) {
        continue; // Skip disabled rules
      }

      const ruleFunc = this.rules.get(rule.id);
      if (!ruleFunc) {
        console.warn(`Compiled rule function not found for rule ${rule.id} in policy ${policy.id}. Recompiling.`);
        try {
            this.compileRule(rule); // Attempt recompilation
            const recompiledFunc = this.rules.get(rule.id);
            if (recompiledFunc && !recompiledFunc(context)) { // Check violation with recompiled func
                 violations.push(this.createViolation(policy, rule, context));
            } else if (!recompiledFunc) {
                 console.error(`Failed to recompile rule ${rule.id}.`);
            }
        } catch (error: any) {
             this.eventEmitter.emit('rule.compilation.error', {
                policyId: policy.id,
                ruleId: rule.id,
                error: error.message,
             });
        }
        continue; // Move to next rule after handling missing/recompilation
      }


      try {
        const result = ruleFunc(context);
        if (!result) { // Rule condition not met, violation detected
          violations.push(this.createViolation(policy, rule, context));
        }
      } catch (error: any) {
        this.eventEmitter.emit('rule.evaluation.error', {
          policyId: policy.id,
          ruleId: rule.id,
          context: context, // Include context for debugging
          error: error.message,
        });
        // Decide if evaluation error itself constitutes a violation or just log it
        // violations.push(this.createViolation(policy, rule, context, `Evaluation error: ${error.message}`));
      }
    }

    if (violations.length > 0) {
      this.eventEmitter.emit('policy.violations', {
        policyId: policy.id,
        violations,
        context, // Include context in the event
      });
    }

    return violations;
  }


  async loadPoliciesFromRedis(): Promise<void> {
    const keys = await this.redisService.keys('policy:*');
    const policiesData = await this.redisService.mget(keys);

    for (const data of policiesData) {
      if (data) {
        try {
          const policy = JSON.parse(data) as SecurityPolicy;
          this.policies.set(policy.id, policy);
          this.compilePolicyRules(policy);
        } catch (error) {
          console.error('Error loading policy from Redis:', error);
        }
      }
    }
    console.log(`Loaded ${this.policies.size} policies from Redis.`);
  }


  private async storePolicy(policy: SecurityPolicy): Promise<void> {
    // Store in memory
    this.policies.set(policy.id, policy);
    // Store in Redis
    await this.redisService.set(`policy:${policy.id}`, JSON.stringify(policy));
  }


  private compilePolicyRules(policy: SecurityPolicy): void {
    policy.rules.forEach(rule => {
      try {
        this.compileRule(rule); // Compile and store the function
      } catch (error: any) {
        this.eventEmitter.emit('rule.compilation.error', {
          policyId: policy.id,
          ruleId: rule.id,
          error: error.message,
        });
      }
    });
  }


  private compileRule(rule: SecurityRule): void {
     // Simple condition parser for demonstration
     // In production, you'd want a more robust parser/evaluator like `expr-eval` or build an AST
    const condition = rule.condition.trim();
    const matches = condition.match(/^(\w+)\s*([<>=!]+)\s*(.+)$/); // Allow various value types

    if (!matches) {
      throw new Error(`Invalid rule condition format: "${rule.condition}"`);
    }

    const [, field, operator, valueStr] = matches;
    let value: any;
     // Attempt to parse value - handle strings, numbers, booleans
    if (valueStr === 'true') {
        value = true;
    } else if (valueStr === 'false') {
        value = false;
    } else if (!isNaN(Number(valueStr))) {
        value = Number(valueStr);
    } else if ((valueStr.startsWith("'") && valueStr.endsWith("'")) || (valueStr.startsWith('"') && valueStr.endsWith('"'))) {
         value = valueStr.slice(1, -1); // Remove quotes for string comparison
    } else {
         // Assume it's a literal string if not parsed otherwise
         value = valueStr;
    }


    const compiledFunc = (context: any): boolean => { // Use 'any' for context flexibility or a more specific type
      if (typeof context !== 'object' || context === null || !(field in context)) {
        // console.warn(`Field "${field}" not found in context for rule ${rule.id}`);
        return false; // Or throw error, depending on desired strictness
      }
      const contextValue = context[field];

      // Perform comparison based on operator
      switch (operator) {
        case '>':
          return contextValue > value;
        case '>=':
          return contextValue >= value;
        case '<':
          return contextValue < value;
        case '<=':
          return contextValue <= value;
        case '==':
        case '===': // Treat == and === similarly for simplicity here
          return contextValue === value;
        case '!=':
        case '!==': // Treat != and !== similarly
          return contextValue !== value;
        default:
          console.error(`Unsupported operator "${operator}" in rule ${rule.id}`);
          return false; // Unsupported operator
      }
    };

    this.rules.set(rule.id, compiledFunc); // Store the compiled function
  }


  private createViolation(
    policy: SecurityPolicy,
    rule: SecurityRule,
    context: unknown,
    message?: string // Optional custom message
  ): SecurityViolation {
    return {
      id: uuidv4(),
      type: rule.type,
      description: message || `Violation of rule: ${rule.metadata?.description || rule.condition}`,
      severity: rule.severity || policy.level, // Use rule severity if defined, else policy level
      timestamp: new Date(),
      context: { // Include relevant context
        policyId: policy.id,
        ruleId: rule.id,
        ...(typeof context === 'object' ? context : { value: context }), // Spread context if object
      },
      status: 'open', // Default status
      metadata: {
        detectedBy: 'policy-manager',
        tags: ['policy_violation', rule.type, `severity:${rule.severity || policy.level}`],
        ...(rule.metadata || {}) // Include rule metadata if available
      },
    };
  }


  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length !== 3) return '1.0.1'; // Default if format is wrong
    const patch = parseInt(parts[2], 10);
    if (isNaN(patch)) return `${parts[0]}.${parts[1]}.1`; // Default if patch is not number
    return `${parts[0]}.${parts[1]}.${patch + 1}`;
  }


  private matchesFilter(
    policy: SecurityPolicy,
    filter?: {
      level?: SecurityLevel;
      enabled?: boolean;
    },
  ): boolean {
    if (!filter) {
      return true; // No filter means match
    }

    if (filter.level !== undefined && policy.level !== filter.level) {
      return false;
    }

    // Check metadata.enabled, provide default if missing
    const isEnabled = policy.metadata?.enabled ?? true; // Default to true if undefined
    if (filter.enabled !== undefined && isEnabled !== filter.enabled) {
      return false;
    }

    return true;
  }
}
