/**
 * Extension Validator - The New Fuse
 *
 * Validates an extension's manifest to ensure it has all the required fields.
 */
import { ExtensionManifest } from './ExtensionTypes.js';
interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class ExtensionValidator {
    validate(manifest: ExtensionManifest): ValidationResult;
}
export {};
//# sourceMappingURL=ExtensionValidator.d.ts.map