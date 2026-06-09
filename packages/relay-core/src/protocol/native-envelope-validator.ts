import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

type NativeValidateFn = (json: string) => boolean;

type KoffiModule = {
  load: (libraryPath: string) => {
    func: (name: string, resultType: string, argumentsTypes: string[]) => NativeValidateFn;
  };
};

export interface NativeEnvelopeValidatorStatus {
  mode: 'native' | 'typescript';
  available: boolean;
  enabled: boolean;
  required: boolean;
  libraryPath?: string;
  reason?: string;
}

export interface NativeEnvelopeValidationOptions {
  enabled?: boolean;
  required?: boolean;
}

let cachedStatus: NativeEnvelopeValidatorStatus | null = null;
let cachedValidate: NativeValidateFn | null = null;

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return !['0', 'false', 'off', 'no'].includes(raw.trim().toLowerCase());
}

function formatLoadError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function nativeLibraryFilename(): string {
  switch (process.platform) {
    case 'darwin':
      return 'libenvelope_validator.dylib';
    case 'win32':
      return 'envelope_validator.dll';
    default:
      return 'libenvelope_validator.so';
  }
}

function candidateLibraryPaths(): string[] {
  const explicit = process.env.TNF_ENVELOPE_VALIDATOR_LIB?.trim();
  if (explicit) return [explicit];

  const packageRoot = path.resolve(__dirname, '..', '..');

  return [
    path.join(
      packageRoot,
      'native',
      'envelope-validator',
      'target',
      'release',
      nativeLibraryFilename()
    ),
  ];
}

function resolveNativeLibraryPath(): string | null {
  for (const candidate of candidateLibraryPaths()) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function loadNativeValidator(
  options: NativeEnvelopeValidationOptions = {}
): NativeEnvelopeValidatorStatus {
  const enabled = options.enabled ?? envFlag('TNF_ENVELOPE_VALIDATOR_NATIVE', true);
  const required = options.required ?? envFlag('TNF_ENVELOPE_VALIDATOR_REQUIRED', false);

  if (!enabled) {
    cachedValidate = null;
    return {
      mode: 'typescript',
      available: false,
      enabled,
      required,
      reason: 'native validator disabled',
    };
  }

  if (cachedStatus && cachedStatus.enabled === enabled && cachedStatus.required === required) {
    return cachedStatus;
  }

  const libraryPath = resolveNativeLibraryPath();
  if (!libraryPath) {
    cachedValidate = null;
    cachedStatus = {
      mode: 'typescript',
      available: false,
      enabled,
      required,
      reason: 'native validator library not found',
    };
    return cachedStatus;
  }

  try {
    const require = createRequire(__filename);
    const koffi = require('koffi') as KoffiModule;
    const library = koffi.load(libraryPath);
    cachedValidate = library.func('validate_envelope_json', 'bool', ['str']);
    cachedStatus = {
      mode: 'native',
      available: true,
      enabled,
      required,
      libraryPath,
    };
    return cachedStatus;
  } catch (error) {
    cachedValidate = null;
    cachedStatus = {
      mode: 'typescript',
      available: false,
      enabled,
      required,
      libraryPath,
      reason: formatLoadError(error),
    };
    return cachedStatus;
  }
}

export function getNativeEnvelopeValidatorStatus(
  options: NativeEnvelopeValidationOptions = {}
): NativeEnvelopeValidatorStatus {
  return loadNativeValidator(options);
}

export function assertNativeEnvelopeValid(
  envelope: unknown,
  options: NativeEnvelopeValidationOptions = {}
): void {
  const status = loadNativeValidator(options);

  if (!status.available || !cachedValidate) {
    if (status.required) {
      throw new Error(
        `Native envelope validator required but unavailable: ${status.reason || 'unknown reason'}`
      );
    }
    return;
  }

  const json = typeof envelope === 'string' ? envelope : JSON.stringify(envelope);
  if (!cachedValidate(json)) {
    throw new Error('Native envelope validator rejected envelope');
  }
}

export function resetNativeEnvelopeValidatorCache(): void {
  cachedStatus = null;
  cachedValidate = null;
}
