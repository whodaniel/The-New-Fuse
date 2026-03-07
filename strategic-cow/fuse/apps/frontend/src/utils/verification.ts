export enum VerificationType {
  SCHEMA = 'SCHEMA',
  CONTENT = 'CONTENT',
  SECURITY = 'SECURITY',
  HARMLESSNESS = 'HARMLESSNESS',
}

export interface VerificationResult {
  success: boolean;
  type: VerificationType;
  message: string;
  details?: Record<string, any>;
}

export class OutputVerifier {
  requiredFields: Record<string, any>;
  sensitivePatterns: string[];
  harmfulPatterns: string[];

  constructor() {
    this.requiredFields = {
      type: String,
      content: Object,
      metadata: Object,
    };
    this.sensitivePatterns = ['password', 'secret', 'token', 'key', 'credential'];
    this.harmfulPatterns = ['malware', 'exploit', 'attack', 'vulnerability', 'hack'];
  }

  verifySchema(output: any): VerificationResult {
    try {
      if (typeof output !== 'object' || output === null) {
        return {
          success: false,
          type: VerificationType.SCHEMA,
          message: 'Output must be an object',
          details: { receivedType: typeof output },
        };
      }
      for (const [field, expectedType] of Object.entries(this.requiredFields)) {
        if (!(field in output)) {
          return {
            success: false,
            type: VerificationType.SCHEMA,
            message: `Missing required field: ${field}`,
            details: { missingField: field },
          };
        }
        const value = output[field];
        const valueType = value?.constructor;
        if (valueType !== expectedType) {
          return {
            success: false,
            type: VerificationType.SCHEMA,
            message: `Invalid type for field ${field}`,
            details: {
              field,
              expectedType: expectedType.name,
              receivedType: valueType?.name ?? typeof value,
            },
          };
        }
      }
      return {
        success: true,
        type: VerificationType.SCHEMA,
        message: 'Schema verification passed',
      };
    } catch (e) {
      return {
        success: false,
        type: VerificationType.SCHEMA,
        message: `Schema verification error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  verifyContent(output: any): VerificationResult {
    try {
      if (!output.content || Object.keys(output.content).length === 0) {
        return {
          success: false,
          type: VerificationType.CONTENT,
          message: 'Content is empty',
          details: { content: output.content },
        };
      }
      const requiredMetadata = new Set(['timestamp', 'source_id']);
      const missingMetadata = Array.from(requiredMetadata).filter(
        (field) => !output.metadata || !(field in output.metadata)
      );
      if (missingMetadata.length > 0) {
        return {
          success: false,
          type: VerificationType.CONTENT,
          message: 'Missing required metadata fields',
          details: { missingFields: missingMetadata },
        };
      }
      return {
        success: true,
        type: VerificationType.CONTENT,
        message: 'Content verification passed',
      };
    } catch (e) {
      return {
        success: false,
        type: VerificationType.CONTENT,
        message: `Content verification error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  verifySecurity(output: any): VerificationResult {
    try {
      const contentStr = JSON.stringify(output.content).toLowerCase();
      const foundPatterns = this.sensitivePatterns.filter((pattern) =>
        contentStr.includes(pattern.toLowerCase())
      );
      if (foundPatterns.length > 0) {
        return {
          success: false,
          type: VerificationType.SECURITY,
          message: 'Found potentially sensitive data',
          details: { patterns: foundPatterns },
        };
      }
      return {
        success: true,
        type: VerificationType.SECURITY,
        message: 'Security verification passed',
      };
    } catch (e) {
      return {
        success: false,
        type: VerificationType.SECURITY,
        message: `Security verification error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  verifyHarmlessness(output: any): VerificationResult {
    try {
      const contentStr = JSON.stringify(output.content).toLowerCase();
      const foundPatterns = this.harmfulPatterns.filter((pattern) =>
        contentStr.includes(pattern.toLowerCase())
      );
      if (foundPatterns.length > 0) {
        return {
          success: false,
          type: VerificationType.HARMLESSNESS,
          message: 'Found potentially harmful content',
          details: { patterns: foundPatterns },
        };
      }
      return {
        success: true,
        type: VerificationType.HARMLESSNESS,
        message: 'Harmlessness verification passed',
      };
    } catch (e) {
      return {
        success: false,
        type: VerificationType.HARMLESSNESS,
        message: `Harmlessness verification error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  verifyAll(output: any): VerificationResult[] {
    return [
      this.verifySchema(output),
      this.verifyContent(output),
      this.verifySecurity(output),
      this.verifyHarmlessness(output),
    ];
  }
}
