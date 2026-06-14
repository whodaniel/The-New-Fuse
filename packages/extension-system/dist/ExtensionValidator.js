"use strict";
/**
 * Extension Validator - The New Fuse
 *
 * Validates an extension's manifest to ensure it has all the required fields.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionValidator = void 0;
class ExtensionValidator {
    validate(manifest) {
        const errors = [];
        if (!manifest.id) {
            errors.push('Manifest is missing an id.');
        }
        if (!manifest.name) {
            errors.push('Manifest is missing a name.');
        }
        if (!manifest.version) {
            errors.push('Manifest is missing a version.');
        }
        if (!manifest.type) {
            errors.push('Manifest is missing a type.');
        }
        if (!manifest.entryPoint) {
            errors.push('Manifest is missing an entryPoint.');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.ExtensionValidator = ExtensionValidator;
//# sourceMappingURL=ExtensionValidator.js.map