/**
 * Validation Utilities for Schema Migrations
 *
 * Provides validation functions for data integrity during migrations
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * JSON Schema Definitions
 */
export const JsonSchemas = {
  AgentConfig: {
    type: 'object',
    properties: {
      model: { type: 'string' },
      temperature: { type: 'number', minimum: 0, maximum: 2 },
      maxTokens: { type: 'integer', minimum: 1 },
      topP: { type: 'number', minimum: 0, maximum: 1 },
      frequencyPenalty: { type: 'number', minimum: -2, maximum: 2 },
      presencePenalty: { type: 'number', minimum: -2, maximum: 2 },
      stop: { type: 'array', items: { type: 'string' } },
      customParameters: { type: 'object' },
    },
    additionalProperties: false,
  },

  WorkflowDefinition: {
    type: 'object',
    required: ['version', 'steps'],
    properties: {
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'type', 'name'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            name: { type: 'string' },
            config: { type: 'object' },
            order: { type: 'integer' },
          },
        },
      },
      triggers: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'config'],
          properties: {
            type: {
              type: 'string',
              enum: ['schedule', 'webhook', 'manual', 'event'],
            },
            config: { type: 'object' },
          },
        },
      },
    },
    additionalProperties: false,
  },

  WorkflowStatistics: {
    type: 'object',
    properties: {
      totalExecutions: { type: 'integer', minimum: 0 },
      successfulExecutions: { type: 'integer', minimum: 0 },
      failedExecutions: { type: 'integer', minimum: 0 },
      avgExecutionTime: { type: 'number', minimum: 0 },
      lastExecutionStatus: {
        type: 'string',
        enum: ['success', 'failed', 'cancelled'],
      },
      lastExecutionTime: { type: 'string', format: 'date-time' },
    },
    additionalProperties: false,
  },

  RevenueDistribution: {
    type: 'object',
    required: ['recipients', 'amounts', 'total'],
    properties: {
      recipients: {
        type: 'array',
        items: {
          type: 'object',
          required: ['address', 'share'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
            },
            share: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      amounts: {
        type: 'object',
        patternProperties: {
          '^0x[a-fA-F0-9]{40}$': { type: 'string' },
        },
      },
      total: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
    },
    additionalProperties: false,
  },

  VerifiableCredential: {
    type: 'object',
    required: ['@context', 'type', 'issuer', 'issuanceDate', 'credentialSubject'],
    properties: {
      '@context': {
        type: 'array',
        items: { type: 'string' },
        contains: {
          const: 'https://www.w3.org/2018/credentials/v1',
        },
      },
      type: {
        type: 'array',
        items: { type: 'string' },
        contains: {
          const: 'VerifiableCredential',
        },
      },
      issuer: { type: 'string' },
      issuanceDate: { type: 'string', format: 'date-time' },
      expirationDate: { type: 'string', format: 'date-time' },
      credentialSubject: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
    additionalProperties: true,
  },
};

/**
 * Validate JSON data against schema
 */
export function validateJson<T = any>(
  data: any,
  schemaName: keyof typeof JsonSchemas
): { valid: boolean; errors?: string[]; data?: T } {
  const schema = JsonSchemas[schemaName];
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors?.map((err) => `${err.instancePath} ${err.message}`),
    };
  }

  return {
    valid: true,
    data: data as T,
  };
}

/**
 * Validate Message context (Chat XOR ChatRoom)
 */
export function validateMessageContext(message: {
  chatId?: string | null;
  roomId?: string | null;
}): { valid: boolean; error?: string } {
  const contexts = [message.chatId, message.roomId].filter(Boolean);

  if (contexts.length === 0) {
    return {
      valid: false,
      error: 'Message must belong to either a Chat or ChatRoom',
    };
  }

  if (contexts.length > 1) {
    return {
      valid: false,
      error: 'Message cannot belong to both Chat and ChatRoom',
    };
  }

  return { valid: true };
}

/**
 * Validate Message sender (User XOR Agent)
 */
export function validateMessageSender(message: {
  senderId?: string | null;
  senderAgentId?: string | null;
}): { valid: boolean; error?: string } {
  const senders = [message.senderId, message.senderAgentId].filter(Boolean);

  if (senders.length === 0) {
    return {
      valid: false,
      error: 'Message must have a sender (User or Agent)',
    };
  }

  if (senders.length > 1) {
    return {
      valid: false,
      error: 'Message cannot have multiple senders',
    };
  }

  return { valid: true };
}

/**
 * Validate Ethereum address format
 */
export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate workflow graph for cycles
 */
export async function detectWorkflowCycles(
  db: any,
  workflowId: string
): Promise<{ hasCycle: boolean; cyclePath?: string[] }> {
  const steps = await db.workflowStep.findMany({
    where: { workflowId },
    include: { nextStepEdges: true },
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let cyclePath: string[] = [];

  const hasCycle = (stepId: string, path: string[]): boolean => {
    if (recursionStack.has(stepId)) {
      cyclePath = [...path, stepId];
      return true;
    }

    if (visited.has(stepId)) return false;

    visited.add(stepId);
    recursionStack.add(stepId);

    const step = steps.find((s) => s.id === stepId);
    if (step) {
      for (const edge of step.nextStepEdges) {
        if (hasCycle(edge.toStepId, [...path, stepId])) {
          return true;
        }
      }
    }

    recursionStack.delete(stepId);
    return false;
  };

  for (const step of steps) {
    if (hasCycle(step.id, [])) {
      return { hasCycle: true, cyclePath };
    }
  }

  return { hasCycle: false };
}

/**
 * Validate data integrity for migration
 */
export async function validateMigration(
  db: any,
  checks: {
    name: string;
    query: () => Promise<any>;
    validate: (result: any) => boolean;
    errorMessage: string;
  }[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const check of checks) {
    try {
      const result = await check.query();
      if (!check.validate(result)) {
        errors.push(`${check.name}: ${check.errorMessage}`);
      }
    } catch (error) {
      errors.push(`${check.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
