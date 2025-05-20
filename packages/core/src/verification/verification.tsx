/**
 * Verification module for MCP communication.
 */

export enum VerificationType {
  SCHEMA = "schema",
  CONTENT = "content",
  SECURITY = "security",
  HARMLESSNESS = "harmlessness"
}

export interface VerificationResult {
  success: boolean;
  type: VerificationType;
  message: string;
  details?: Record<string, unknown>;
}

type RequiredFields = {
  [key: string]: StringConstructor | ObjectConstructor;
};

export class OutputVerifier {
  private readonly requiredFields: RequiredFields;
  private readonly sensitivePatterns: readonly string[];
  private readonly harmfulPatterns: readonly string[];

  constructor() {
    this.requiredFields = {
      type: String,
      content: Object,
      metadata: Object
    };

    this.sensitivePatterns = [
      'password',
      'secret',
      'token',
      'key',
      'credential'
    ] as const;

    this.harmfulPatterns = [
      'malware',
      'exploit',
      'attack',
      'vulnerability',
      'hack'
    ] as const;
  }

  /**
   * Verify output schema.
   */
  public verifySchema(output: Record<string, unknown>): VerificationResult {
    try {
      // Check basic structure
      if (typeof output !== 'object' || output === null) {
        return {
          success: false,
          type: VerificationType.SCHEMA,
          message: "Output must be an object",
          details: { receivedType: typeof output }
        };
      }

      // Check required fields
      for (const [field, expectedType] of Object.entries(this.requiredFields)) {
        if (!(field in output)) {
          return {
            success: false,
            type: VerificationType.SCHEMA,
            message: `Missing required field: ${field}`,
            details: { missingField: field }
          };
        }

        const valueType = output[field]?.constructor;
        if (valueType !== expectedType) {
          return {
            success: false,
            type: VerificationType.SCHEMA,
            message: `Invalid type for field ${field}`,
            details: {
              field,
              expectedType: expectedType.name,
              receivedType: valueType?.name ?? typeof output[field]
            }
          };
        }
      }

      return {
        success: true,
        type: VerificationType.SCHEMA,
        message: "Schema verification passed"
      };

    } catch (e: unknown) {
      return {
        success: false,
        type: VerificationType.SCHEMA,
        message: `Schema verification error: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }

  public verifyContent(output: Record<string, unknown>): VerificationResult {
    try {
      const content = output.content ?? {};

      // Check content is not empty
      if (Object.keys(content).length === 0) {
        return {
          success: false,
          type: VerificationType.CONTENT,
          message: "Content is empty",
          details: { content }
        };
      }

      // Check metadata
      const metadata = output.metadata as Record<string, unknown> ?? {};
      const requiredMetadata = new Set(['timestamp', 'source_id']);
      const missingMetadata = Array.from(requiredMetadata)
        .filter(field => !(field in metadata));

      if (missingMetadata.length > 0) {
        return {
          success: false,
          type: VerificationType.CONTENT,
          message: "Missing required metadata fields",
          details: { missingFields: missingMetadata }
        };
      }

      return {
        success: true,
        type: VerificationType.CONTENT,
        message: "Content verification passed"
      };

    } catch (e: unknown) {
      return {
        success: false,
        type: VerificationType.CONTENT,
        message: `Content verification error: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }

  public verifySecurity(output: Record<string, unknown>): VerificationResult {
    try {
      const contentStr = String(output.content ?? '');

      // Check for sensitive patterns
      const foundPatterns = this.sensitivePatterns
        .filter(pattern => contentStr.toLowerCase().includes(pattern));

      if (foundPatterns.length > 0) {
        return {
          success: false,
          type: VerificationType.SECURITY,
          message: "Found potentially sensitive data",
          details: { patterns: foundPatterns }
        };
      }

      return {
        success: true,
        type: VerificationType.SECURITY,
        message: "Security verification passed"
      };

    } catch (e: unknown) {
      return {
        success: false,
        type: VerificationType.SECURITY,
        message: `Security verification error: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }

  public verifyHarmlessness(output: Record<string, unknown>): VerificationResult {
    try {
      const contentStr = String(output.content ?? '');

      // Check for harmful patterns
      const foundPatterns = this.harmfulPatterns
        .filter(pattern => contentStr.toLowerCase().includes(pattern));

      if (foundPatterns.length > 0) {
        return {
          success: false,
          type: VerificationType.HARMLESSNESS,
          message: "Found potentially harmful content",
          details: { patterns: foundPatterns }
        };
      }

      return {
        success: true,
        type: VerificationType.HARMLESSNESS,
        message: "Harmlessness verification passed"
      };

    } catch (e: unknown) {
      return {
        success: false,
        type: VerificationType.HARMLESSNESS,
        message: `Harmlessness verification error: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }

  public verifyAll(output: Record<string, unknown>): Record<VerificationType, VerificationResult> {
    return {
      [VerificationType.SCHEMA]: this.verifySchema(output),
      [VerificationType.CONTENT]: this.verifyContent(output),
      [VerificationType.SECURITY]: this.verifySecurity(output),
      [VerificationType.HARMLESSNESS]: this.verifyHarmlessness(output)
    };
  }
}
