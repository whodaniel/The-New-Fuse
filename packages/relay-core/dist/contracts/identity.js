"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TnfIdentityCategory = void 0;
exports.buildCanonicalEntityId = buildCanonicalEntityId;
exports.normalizeCanonicalEntityId = normalizeCanonicalEntityId;
exports.isCanonicalEntityId = isCanonicalEntityId;
exports.normalizeOperationalHandle = normalizeOperationalHandle;
exports.buildIdentityAliases = buildIdentityAliases;
exports.createAgentIdentityRecord = createAgentIdentityRecord;
exports.buildIdentityAliasMap = buildIdentityAliasMap;
exports.resolveIdentityAlias = resolveIdentityAlias;
const protocol_contracts_1 = require("@the-new-fuse/protocol-contracts");
const CANONICAL_ID_SEGMENT = /^[A-Z0-9_]+$/;
exports.TnfIdentityCategory = protocol_contracts_1.TnfIdentityCategorySchema;
function normalizeCanonicalSegment(value) {
    if (value == null)
        return null;
    const normalized = String(value)
        .trim()
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
    return normalized || null;
}
function normalizeCanonicalInstance(value) {
    if (value == null || value === '')
        return '001';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(Math.trunc(value)).padStart(3, '0');
    }
    const raw = String(value).trim();
    if (/^\d+$/.test(raw)) {
        return raw.padStart(3, '0');
    }
    const normalized = normalizeCanonicalSegment(raw);
    return normalized || '001';
}
function buildCanonicalEntityId(parts) {
    const category = normalizeCanonicalSegment(parts.category);
    const provider = normalizeCanonicalSegment(parts.provider);
    const name = normalizeCanonicalSegment(parts.name);
    const instance = normalizeCanonicalInstance(parts.instance);
    const scope = normalizeCanonicalSegment(parts.scope);
    if (!category || !provider || !name) {
        throw new Error('category, provider, and name are required to build a canonical TNF id');
    }
    return ['TNF', scope, category, provider, name, instance].filter(Boolean).join(':');
}
function normalizeCanonicalEntityId(input) {
    const value = String(input || '').trim();
    if (!value) {
        throw new Error('canonical entity id cannot be empty');
    }
    const segments = value
        .split(':')
        .map((segment) => segment.trim())
        .filter(Boolean);
    if (segments.length < 5 || segments.length > 6) {
        throw new Error(`invalid canonical entity id: ${input}`);
    }
    if (segments[0].toUpperCase() !== 'TNF') {
        throw new Error(`invalid TNF namespace: ${input}`);
    }
    const normalized = ['TNF'];
    for (let index = 1; index < segments.length - 1; index += 1) {
        const segment = normalizeCanonicalSegment(segments[index]);
        if (!segment || !CANONICAL_ID_SEGMENT.test(segment)) {
            throw new Error(`invalid canonical entity id segment: ${segments[index]}`);
        }
        normalized.push(segment);
    }
    normalized.push(normalizeCanonicalInstance(segments[segments.length - 1]));
    return normalized.join(':');
}
function isCanonicalEntityId(input) {
    try {
        normalizeCanonicalEntityId(String(input));
        return true;
    }
    catch {
        return false;
    }
}
function normalizeOperationalHandle(input) {
    return String(input || '').trim();
}
function normalizeAlias(input) {
    const value = String(input || '')
        .trim()
        .toLowerCase();
    return value || null;
}
function buildIdentityAliases(input) {
    const values = new Set();
    const add = (candidate) => {
        const normalized = candidate ? normalizeAlias(candidate) : null;
        if (normalized) {
            values.add(normalized);
        }
    };
    add(input.operationalHandle);
    add(input.runtimeSessionId || undefined);
    add(input.canonicalEntityId || undefined);
    for (const alias of input.aliases || []) {
        add(alias || undefined);
    }
    return [...values];
}
function createAgentIdentityRecord(input) {
    const operationalHandle = normalizeOperationalHandle(input.operationalHandle);
    if (!operationalHandle) {
        throw new Error('operationalHandle is required');
    }
    const canonicalEntityId = input.canonicalEntityId
        ? normalizeCanonicalEntityId(input.canonicalEntityId)
        : null;
    return {
        canonicalEntityId,
        operationalHandle,
        runtimeSessionId: input.runtimeSessionId
            ? normalizeOperationalHandle(input.runtimeSessionId)
            : null,
        aliases: buildIdentityAliases({
            canonicalEntityId,
            operationalHandle,
            runtimeSessionId: input.runtimeSessionId,
            aliases: input.aliases,
        }),
    };
}
function buildIdentityAliasMap(records) {
    const aliasMap = new Map();
    for (const record of records) {
        for (const alias of record.aliases) {
            aliasMap.set(alias, record);
        }
    }
    return aliasMap;
}
function resolveIdentityAlias(alias, recordsOrMap) {
    const normalized = normalizeAlias(alias);
    if (!normalized)
        return null;
    const aliasMap = recordsOrMap instanceof Map ? recordsOrMap : buildIdentityAliasMap(recordsOrMap);
    return aliasMap.get(normalized) || null;
}
//# sourceMappingURL=identity.js.map