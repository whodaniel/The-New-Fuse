/**
 * Extension Validator - The New Fuse
 *
 * Validates an extension's manifest to ensure it has all the required fields.
 */

import { ExtensionManifest } from './ExtensionTypes';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ExtensionValidator {
  public validate(manifest: ExtensionManifest): ValidationResult {
    const errors: string[] = [];

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
