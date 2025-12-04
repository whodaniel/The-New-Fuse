var OutputVerifier = /** @class */ (function () {
    function OutputVerifier() {
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
    OutputVerifier.prototype.verifySchema = function (output) {
        try {
            if (typeof output !== 'object' || output === null) {
                return {
                    success: false,
                    type: VerificationType.SCHEMA,
                    message: "Output must be an object",
                    details: { receivedType: typeof output }
                };
            }
            for (var _i = 0, _b = Object.entries(this.requiredFields); _i < _b.length; _i++) {
                var _c = _b[_i], field = _c[0], expectedType = _c[1];
                if (!(field in output)) {
                    return {
                        success: false,
                        type: VerificationType.SCHEMA,
                        message: "Missing required field: ".concat(field),
                        details: { missingField: field }
                    };
                }
                var value = output[field];
                var valueType = value === null || value === void 0 ? void 0 : value.constructor;
                if (valueType !== expectedType) {
                    return {
                        success: false,
                        type: VerificationType.SCHEMA,
                        message: "Invalid type for field ".concat(field),
                        details: {
                            field: field,
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
                message: "Schema verification error: ".concat(e instanceof Error ? e.message : String(e))
            };
        }
    };
    OutputVerifier.prototype.verifyContent = function (output) {
        try {
            if (Object.keys(output.content).length === 0) {
                return {
                    success: false,
                    type: VerificationType.CONTENT,
                    message: "Content is empty",
                    details: { content: output.content }
                };
            }
            var requiredMetadata = new Set(['timestamp', 'source_id']);
            var missingMetadata = Array.from(requiredMetadata).filter(function (field) { return !(field in output.metadata); });
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
                message: "Content verification error: ".concat(e instanceof Error ? e.message : String(e))
            };
        }
    };
    OutputVerifier.prototype.verifySecurity = function (output) {
        try {
            var contentStr_1 = JSON.stringify(output.content).toLowerCase();
            var foundPatterns = this.sensitivePatterns.filter(function (pattern) { return contentStr_1.includes(pattern.toLowerCase()); });
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
                message: "Security verification error: ".concat(e instanceof Error ? e.message : String(e))
            };
        }
    };
    OutputVerifier.prototype.verifyHarmlessness = function (output) {
        try {
            var contentStr_2 = JSON.stringify(output.content).toLowerCase();
            var foundPatterns = this.harmfulPatterns.filter(function (pattern) { return contentStr_2.includes(pattern.toLowerCase()); });
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
                message: "Harmlessness verification error: ".concat(e instanceof Error ? e.message : String(e))
            };
        }
    };
    OutputVerifier.prototype.verifyAll = function (output) {
        return [
            this.verifySchema(output),
            this.verifyContent(output),
            this.verifySecurity(output),
            this.verifyHarmlessness(output)
        ];
    };
    return OutputVerifier;
}());
export { OutputVerifier };
