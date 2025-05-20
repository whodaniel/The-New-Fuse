export class OutputVerifier {
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
        ];
        this.harmfulPatterns = [
            'malware',
            'exploit',
            'attack',
            'vulnerability',
            'hack'
        ];
    }
    verifySchema(output) {
        var _a;
        try {
            if (typeof output !== 'object' || output === null) {
                return {
                    success: false,
                    type: VerificationType.SCHEMA,
                    message: "Output must be an object",
                    details: { receivedType: typeof output }
                };
            }
            for (const [field, expectedType] of Object.entries(this.requiredFields)) {
                if (!(field in output)) {
                    return {
                        success: false,
                        type: VerificationType.SCHEMA,
                        message: `Missing required field: ${field}`,
                        details: { missingField: field }
                    };
                }
                const value = output[field];
                const valueType = value === null || value === void 0 ? void 0 : value.constructor;
                if (valueType !== expectedType) {
                    return {
                        success: false,
                        type: VerificationType.SCHEMA,
                        message: `Invalid type for field ${field}`,
                        details: {
                            field,
                            expectedType: expectedType.name,
                            receivedType: (_a = valueType === null || valueType === void 0 ? void 0 : valueType.name) !== null && _a !== void 0 ? _a : typeof value
                        }
                    };
                }
            }
            return {
                success: true,
                type: VerificationType.SCHEMA,
                message: "Schema verification passed"
            };
        }
        catch (e) {
            return {
                success: false,
                type: VerificationType.SCHEMA,
                message: `Schema verification error: ${e instanceof Error ? e.message : String(e)}`
            };
        }
    }
    verifyContent(output) {
        try {
            if (Object.keys(output.content).length === 0) {
                return {
                    success: false,
                    type: VerificationType.CONTENT,
                    message: "Content is empty",
                    details: { content: output.content }
                };
            }
            const requiredMetadata = new Set(['timestamp', 'source_id']);
            const missingMetadata = Array.from(requiredMetadata).filter(field => !(field in output.metadata));
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
        }
        catch (e) {
            return {
                success: false,
                type: VerificationType.CONTENT,
                message: `Content verification error: ${e instanceof Error ? e.message : String(e)}`
            };
        }
    }
    verifySecurity(output) {
        try {
            const contentStr = JSON.stringify(output.content).toLowerCase();
            const foundPatterns = this.sensitivePatterns.filter((pattern) => contentStr.includes(pattern.toLowerCase()));
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
        }
        catch (e) {
            return {
                success: false,
                type: VerificationType.SECURITY,
                message: `Security verification error: ${e instanceof Error ? e.message : String(e)}`
            };
        }
    }
    verifyHarmlessness(output) {
        try {
            const contentStr = JSON.stringify(output.content).toLowerCase();
            const foundPatterns = this.harmfulPatterns.filter((pattern) => contentStr.includes(pattern.toLowerCase()));
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
        }
        catch (e) {
            return {
                success: false,
                type: VerificationType.HARMLESSNESS,
                message: `Harmlessness verification error: ${e instanceof Error ? e.message : String(e)}`
            };
        }
    }
    verifyAll(output) {
        return [
            this.verifySchema(output),
            this.verifyContent(output),
            this.verifySecurity(output),
            this.verifyHarmlessness(output)
        ];
    }
}
//# sourceMappingURL=verification.js.map