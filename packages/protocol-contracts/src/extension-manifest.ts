import * as fs from 'node:fs';
import * as path from 'node:path';
import * as semver from 'semver';

export const TNF_EXTENSION_MANIFEST_API_VERSION = 'tnf.extension/v1' as const;
export const TNF_EXTENSION_MANIFEST_FILENAME = 'tnf-extension.json' as const;

export type ExtensionDistributionKind =
  | 'loadable-extension'
  | 'external-service'
  | 'form-factor'
  | 'standalone-product';

export interface TnfExtensionManifestV1 {
  apiVersion: typeof TNF_EXTENSION_MANIFEST_API_VERSION;
  kind: ExtensionDistributionKind;
  id: string;
  name: string;
  author?: string;
  version: string;
  description: string;
  compatibility: {
    tnf: string;
    node?: string;
    platforms?: string[];
  };
  capabilities: string[];
  entrypoints: {
    main?: string;
    activate?: string;
    deactivate?: string;
    health?: string;
    service?: string;
  };
  permissions: string[];
  configuration?: {
    schema?: Record<string, unknown>;
    defaults?: Record<string, unknown>;
  };
  lifecycle?: {
    activation?: 'manual';
    timeoutMs?: number;
  };
  repository?: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

const KINDS = new Set<ExtensionDistributionKind>([
  'loadable-extension',
  'external-service',
  'form-factor',
  'standalone-product',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSafeRelativePath(value: string): boolean {
  if (!value || path.isAbsolute(value)) return false;
  const normalized = path.normalize(value);
  return normalized !== '..' && !normalized.startsWith(`..${path.sep}`);
}

function isContainedFile(root: string, relativePath: string): boolean {
  try {
    const resolvedRoot = fs.realpathSync(root);
    const resolvedFile = fs.realpathSync(path.join(root, relativePath));
    return (
      fs.statSync(resolvedFile).isFile() &&
      (resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${path.sep}`))
    );
  } catch {
    return false;
  }
}

function validateStringArray(value: unknown, field: string, errors: string[]): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${field} must be an array of non-empty strings`);
    return;
  }
  if (new Set(value).size !== value.length) errors.push(`${field} must not contain duplicates`);
}

export function validateTnfExtensionManifest(
  input: unknown,
  options: { extensionPath?: string; tnfVersion?: string; nodeVersion?: string } = {}
): ManifestValidationResult {
  const errors: string[] = [];
  if (!isRecord(input)) return { valid: false, errors: ['manifest must be a JSON object'] };

  if (input.apiVersion !== TNF_EXTENSION_MANIFEST_API_VERSION) {
    errors.push(`apiVersion must be ${TNF_EXTENSION_MANIFEST_API_VERSION}`);
  }
  if (typeof input.kind !== 'string' || !KINDS.has(input.kind as ExtensionDistributionKind)) {
    errors.push(`kind must be one of: ${[...KINDS].join(', ')}`);
  }
  if (typeof input.id !== 'string' || !/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(input.id)) {
    errors.push('id must use lowercase letters, numbers, dots, underscores, or hyphens');
  }
  for (const field of ['name', 'description'] as const) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (input.author !== undefined && (typeof input.author !== 'string' || !input.author.trim())) {
    errors.push('author must be a non-empty string');
  }
  if (
    input.repository !== undefined &&
    (typeof input.repository !== 'string' || !input.repository.trim())
  ) {
    errors.push('repository must be a non-empty string');
  }
  if (typeof input.version !== 'string' || !semver.valid(input.version)) {
    errors.push('version must be valid semver');
  }

  if (!isRecord(input.compatibility)) {
    errors.push('compatibility must be an object');
  } else {
    if (
      typeof input.compatibility.tnf !== 'string' ||
      !semver.validRange(input.compatibility.tnf)
    ) {
      errors.push('compatibility.tnf must be a valid semver range');
    } else if (
      options.tnfVersion &&
      !semver.satisfies(options.tnfVersion, input.compatibility.tnf)
    ) {
      errors.push(
        `extension requires TNF ${input.compatibility.tnf}; current version is ${options.tnfVersion}`
      );
    }
    if (
      input.compatibility.node !== undefined &&
      (typeof input.compatibility.node !== 'string' || !semver.validRange(input.compatibility.node))
    ) {
      errors.push('compatibility.node must be a valid semver range');
    } else if (
      options.nodeVersion &&
      typeof input.compatibility.node === 'string' &&
      !semver.satisfies(options.nodeVersion, input.compatibility.node)
    ) {
      errors.push(
        `extension requires Node ${input.compatibility.node}; current version is ${options.nodeVersion}`
      );
    }
    if (input.compatibility.platforms !== undefined) {
      validateStringArray(input.compatibility.platforms, 'compatibility.platforms', errors);
    }
  }

  validateStringArray(input.capabilities, 'capabilities', errors);
  validateStringArray(input.permissions, 'permissions', errors);

  if (!isRecord(input.entrypoints)) {
    errors.push('entrypoints must be an object');
  } else {
    const fileEntrypoints = ['main', 'activate', 'deactivate', 'health'] as const;
    for (const field of fileEntrypoints) {
      const value = input.entrypoints[field];
      if (value !== undefined && (typeof value !== 'string' || !isSafeRelativePath(value))) {
        errors.push(`entrypoints.${field} must be a safe relative path`);
      }
    }
    if (input.kind === 'loadable-extension' && typeof input.entrypoints.main !== 'string') {
      errors.push('loadable-extension requires entrypoints.main');
    }
    if (input.entrypoints.service !== undefined) {
      if (typeof input.entrypoints.service !== 'string') {
        errors.push('entrypoints.service must be an absolute HTTP or WebSocket URL');
      } else {
        try {
          const serviceUrl = new URL(input.entrypoints.service);
          if (!['http:', 'https:', 'ws:', 'wss:'].includes(serviceUrl.protocol)) {
            errors.push('entrypoints.service must use HTTP or WebSocket transport');
          }
        } catch {
          errors.push('entrypoints.service must be an absolute HTTP or WebSocket URL');
        }
      }
    }
    if (input.kind === 'external-service' && typeof input.entrypoints.service !== 'string') {
      errors.push('external-service requires entrypoints.service');
    }
    if (options.extensionPath) {
      for (const field of fileEntrypoints) {
        const value = input.entrypoints[field];
        if (typeof value === 'string' && !isContainedFile(options.extensionPath, value)) {
          errors.push(`entrypoints.${field} must resolve to a file inside the extension: ${value}`);
        }
      }
    }
  }

  if (input.configuration !== undefined && !isRecord(input.configuration)) {
    errors.push('configuration must be an object');
  }

  if (input.lifecycle !== undefined) {
    if (!isRecord(input.lifecycle)) {
      errors.push('lifecycle must be an object');
    } else {
      if (input.lifecycle.activation !== undefined && input.lifecycle.activation !== 'manual') {
        errors.push('lifecycle.activation must be manual');
      }
      if (
        input.lifecycle.timeoutMs !== undefined &&
        (!Number.isInteger(input.lifecycle.timeoutMs) || Number(input.lifecycle.timeoutMs) < 1)
      ) {
        errors.push('lifecycle.timeoutMs must be a positive integer');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function readTnfExtensionManifest(
  extensionPath: string,
  options: { tnfVersion?: string; nodeVersion?: string } = {}
): TnfExtensionManifestV1 {
  const manifestPath = path.join(extensionPath, TNF_EXTENSION_MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing ${TNF_EXTENSION_MANIFEST_FILENAME} in ${extensionPath}`);
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Invalid ${TNF_EXTENSION_MANIFEST_FILENAME}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const result = validateTnfExtensionManifest(manifest, {
    extensionPath,
    tnfVersion: options.tnfVersion,
    nodeVersion: options.nodeVersion,
  });
  if (!result.valid) throw new Error(`Invalid extension manifest: ${result.errors.join('; ')}`);
  return manifest as TnfExtensionManifestV1;
}

export function assertLoadableExtension(manifest: TnfExtensionManifestV1): void {
  if (manifest.kind !== 'loadable-extension') {
    throw new Error(
      `${manifest.id} is a ${manifest.kind}; manage it through its satellite deployment lifecycle, not plugins install`
    );
  }
}
