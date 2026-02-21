export interface VerificationResult {
    success: boolean;
    message?: string;
    details?: Record<string, unknown>;
}

export enum VerificationType {
    SCHEMA = 'schema',
    CONTENT = 'content',
    SECURITY = 'security',
    HARMLESSNESS = 'harmlessness'
}

interface VerifiableOutput {
    content: string | Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export class Verification {
    static async validateSchema(output: unknown): Promise<VerificationResult> {
        try {
            if (typeof output !== 'object' || output === null) {
                return {
                    success: false,
                    message: 'Output must be an object',
                    details: {
                        receivedType: typeof output
                    }
                };
            }

            const typedOutput = output as Partial<VerifiableOutput>;
            const requiredFields = ['content'];
            const missingFields = requiredFields.filter(field => !(field in typedOutput));

            if (missingFields.length > 0) {
                return {
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    details: { missingFields }
                };
            }

            // Type checking
            const expectedTypes: Record<string, Function | Function[]> = {
                content: [String, Object],
                metadata: Object
            };

            for (const [field, expectedType] of Object.entries(expectedTypes)) {
                if (field in typedOutput) {
                    const value = typedOutput[field as keyof VerifiableOutput];
                    const valueType = value?.constructor;
                    const isValidType = Array.isArray(expectedType) 
                        ? expectedType.some(type => valueType === type)
                        : valueType === expectedType;

                    if (!isValidType) {
                        return {
                            success: false,
                            message: `Invalid type for field: ${field}`,
                            details: {
                                field,
                                expectedType: Array.isArray(expectedType) 
                                    ? expectedType.map(t => t.name).join(' or ')
                                    : expectedType.name,
                                receivedType: valueType?.name ?? typeof value
                            }
                        };
                    }
                }
            }

            return {
                success: true,
                message: 'Schema validation passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Schema verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifyContent(output: unknown): Promise<VerificationResult> {
        try {
            const typedOutput = output as Partial<VerifiableOutput>;
            const content = typedOutput.content;
            
            if (!content) {
                return {
                    success: false,
                    message: 'Content is empty or missing',
                    details: { receivedContent: content }
                };
            }

            if (typeof content === 'string' && content.trim().length === 0) {
                return {
                    success: false,
                    message: 'Content is empty string',
                    details: { contentLength: 0 }
                };
            }

            return {
                success: true,
                message: 'Content verification passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Content verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifySecurity(output: unknown): Promise<VerificationResult> {
        try {
            const typedOutput = output as Partial<VerifiableOutput>;
            const metadata = typedOutput.metadata ?? {};
            
            // Required metadata fields
            const requiredMetadata = new Set(['timestamp', 'source_id']);
            const missingMetadata = Array.from(requiredMetadata)
                .filter(field => !(field in metadata));

            if (missingMetadata.length > 0) {
                return {
                    success: false,
                    message: `Missing required metadata fields: ${missingMetadata.join(', ')}`,
                    details: { missingFields: missingMetadata }
                };
            }

            return {
                success: true,
                message: 'Security verification passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Security verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifyHarmlessness(output: unknown): Promise<VerificationResult> {
        try {
            const typedOutput = output as Partial<VerifiableOutput>;
            const content = String(typedOutput.content ?? '');

            // Example check - replace with actual harmful content detection
            const harmfulPatterns = [
                /malicious/i,
                /harmful/i,
                /dangerous/i
            ];

            const detectedPatterns = harmfulPatterns
                .filter(pattern => pattern.test(content))
                .map(pattern => pattern.source);

            if (detectedPatterns.length > 0) {
                return {
                    success: false,
                    message: 'Potentially harmful content detected',
                    details: {
                        detectedPatterns,
                        contentLength: content.length
                    }
                };
            }

            return {
                success: true,
                message: 'Harmlessness verification passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Harmlessness verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifyAll(output: unknown): Promise<Record<VerificationType, VerificationResult>> {
        return {
            [VerificationType.SCHEMA]: await this.validateSchema(output),
            [VerificationType.CONTENT]: await this.verifyContent(output),
            [VerificationType.SECURITY]: await this.verifySecurity(output),
            [VerificationType.HARMLESSNESS]: await this.verifyHarmlessness(output)
        };
    }
}
