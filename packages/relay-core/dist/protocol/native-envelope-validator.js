"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNativeEnvelopeValidatorStatus = getNativeEnvelopeValidatorStatus;
exports.assertNativeEnvelopeValid = assertNativeEnvelopeValid;
exports.resetNativeEnvelopeValidatorCache = resetNativeEnvelopeValidatorCache;
const fs_1 = __importDefault(require("fs"));
const module_1 = require("module");
const path_1 = __importDefault(require("path"));
let cachedStatus = null;
let cachedValidate = null;
function envFlag(name, defaultValue) {
    const raw = process.env[name];
    if (raw === undefined)
        return defaultValue;
    return !['0', 'false', 'off', 'no'].includes(raw.trim().toLowerCase());
}
function formatLoadError(error) {
    return error instanceof Error ? error.message : String(error);
}
function nativeLibraryFilename() {
    switch (process.platform) {
        case 'darwin':
            return 'libenvelope_validator.dylib';
        case 'win32':
            return 'envelope_validator.dll';
        default:
            return 'libenvelope_validator.so';
    }
}
function candidateLibraryPaths() {
    const explicit = process.env.TNF_ENVELOPE_VALIDATOR_LIB?.trim();
    if (explicit)
        return [explicit];
    const packageRoot = path_1.default.resolve(__dirname, '..', '..');
    return [
        path_1.default.join(packageRoot, 'native', 'envelope-validator', 'target', 'release', nativeLibraryFilename()),
    ];
}
function resolveNativeLibraryPath() {
    for (const candidate of candidateLibraryPaths()) {
        if (fs_1.default.existsSync(candidate))
            return candidate;
    }
    return null;
}
function loadNativeValidator(options = {}) {
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
        const require = (0, module_1.createRequire)(__filename);
        const koffi = require('koffi');
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
    }
    catch (error) {
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
function getNativeEnvelopeValidatorStatus(options = {}) {
    return loadNativeValidator(options);
}
function assertNativeEnvelopeValid(envelope, options = {}) {
    const status = loadNativeValidator(options);
    if (!status.available || !cachedValidate) {
        if (status.required) {
            throw new Error(`Native envelope validator required but unavailable: ${status.reason || 'unknown reason'}`);
        }
        return;
    }
    const json = typeof envelope === 'string' ? envelope : JSON.stringify(envelope);
    if (!cachedValidate(json)) {
        throw new Error('Native envelope validator rejected envelope');
    }
}
function resetNativeEnvelopeValidatorCache() {
    cachedStatus = null;
    cachedValidate = null;
}
//# sourceMappingURL=native-envelope-validator.js.map