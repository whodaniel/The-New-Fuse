"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceSearchProtocolService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
let ResourceSearchProtocolService = class ResourceSearchProtocolService {
    constructor() {
        this.defaultSpec = 'sgp/0.1';
        this.defaultTenant = 'default';
        this.defaultResource = 'sgp://default/resources/search';
    }
    decodeRequest(body) {
        if (this.isProtocolRequestEnvelope(body)) {
            this.assertValidRequestEnvelope(body);
            return {
                filter: this.normalizeFilter(body.payload),
                requestEnvelope: body,
            };
        }
        if (this.looksLikeProtocolEnvelope(body)) {
            throw new common_1.BadRequestException({
                message: 'Invalid SGP envelope',
                errors: [
                    "Expected envelope type 'DISCOVER.REQUEST' or 'QUERY.REQUEST' with required fields: id, spec, tenant, resource, sent_at, trace, payload.",
                ],
            });
        }
        const filter = this.normalizeFilter(body);
        const now = new Date().toISOString();
        const messageId = (0, node_crypto_1.randomUUID)();
        return {
            filter,
            requestEnvelope: {
                id: messageId,
                spec: this.defaultSpec,
                type: 'DISCOVER.REQUEST',
                tenant: this.defaultTenant,
                resource: this.defaultResource,
                sent_at: now,
                actor: {
                    id: 'anonymous',
                    roles: ['guest'],
                },
                trace: {
                    correlation_id: messageId,
                    causation_id: null,
                },
                payload: filter,
            },
        };
    }
    encodeResponse(requestEnvelope, payload) {
        const responseId = (0, node_crypto_1.randomUUID)();
        // Map REQUEST types to RESPONSE types
        const requestType = requestEnvelope.type;
        let type = 'DISCOVER.RESPONSE';
        if (requestType === 'QUERY.REQUEST') {
            type = 'QUERY.RESPONSE';
        }
        else if (requestType === 'RESOURCE.SEARCH.REQUEST') {
            type = 'RESOURCE.SEARCH.RESPONSE';
        }
        return {
            id: responseId,
            spec: requestEnvelope.spec || this.defaultSpec,
            type,
            tenant: requestEnvelope.tenant || this.defaultTenant,
            resource: requestEnvelope.resource || this.defaultResource,
            sent_at: new Date().toISOString(),
            actor: requestEnvelope.actor,
            trace: {
                correlation_id: requestEnvelope.trace?.correlation_id || responseId,
                causation_id: requestEnvelope.id || null,
            },
            payload,
        };
    }
    normalizeFilter(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return {};
        }
        const candidate = value;
        return {
            search: candidate.search,
            type: candidate.type,
            category: candidate.category,
            tags: Array.isArray(candidate.tags) ? candidate.tags : undefined,
            featured: typeof candidate.featured === 'boolean' ? candidate.featured : undefined,
            sortBy: candidate.sortBy,
            traitScreen: typeof candidate.traitScreen === 'boolean' ? candidate.traitScreen : undefined,
            traitLimit: typeof candidate.traitLimit === 'number' ? candidate.traitLimit : undefined,
            traitThreshold: typeof candidate.traitThreshold === 'number' ? candidate.traitThreshold : undefined,
            includeTraitMeta: typeof candidate.includeTraitMeta === 'boolean' ? candidate.includeTraitMeta : undefined,
        };
    }
    isProtocolRequestEnvelope(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value))
            return false;
        const message = value;
        return ((message.type === 'DISCOVER.REQUEST' ||
            message.type === 'QUERY.REQUEST' ||
            message.type === 'RESOURCE.SEARCH.REQUEST') &&
            typeof message.payload === 'object' &&
            message.payload !== null &&
            !Array.isArray(message.payload));
    }
    looksLikeProtocolEnvelope(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value))
            return false;
        const candidate = value;
        const type = candidate.type;
        return ('id' in candidate ||
            'spec' in candidate ||
            'resource' in candidate ||
            'sent_at' in candidate ||
            'trace' in candidate ||
            (typeof type === 'string' &&
                (type.startsWith('DISCOVER.') || type.startsWith('QUERY.') || type.startsWith('RESOURCE.'))));
    }
    assertValidRequestEnvelope(envelope) {
        const errors = [];
        if (!this.isNonEmptyString(envelope.id)) {
            errors.push('id must be a non-empty string.');
        }
        if (!this.isNonEmptyString(envelope.spec)) {
            errors.push('spec must be a non-empty string.');
        }
        const type = envelope.type;
        if (type !== 'DISCOVER.REQUEST' &&
            type !== 'QUERY.REQUEST' &&
            type !== 'RESOURCE.SEARCH.REQUEST') {
            errors.push("type must be 'DISCOVER.REQUEST', 'QUERY.REQUEST', or 'RESOURCE.SEARCH.REQUEST'.");
        }
        if (!this.isNonEmptyString(envelope.tenant)) {
            errors.push('tenant must be a non-empty string.');
        }
        if (!this.isNonEmptyString(envelope.resource)) {
            errors.push('resource must be a non-empty string.');
        }
        if (!this.isValidDateTime(envelope.sent_at)) {
            errors.push('sent_at must be an ISO-8601 datetime string.');
        }
        const traceValue = envelope.trace;
        if (!traceValue || typeof traceValue !== 'object' || Array.isArray(traceValue)) {
            errors.push('trace must be an object.');
        }
        else {
            const trace = traceValue;
            if (!this.isNonEmptyString(trace.correlation_id)) {
                errors.push('trace.correlation_id must be a non-empty string.');
            }
            const causationId = trace.causation_id;
            if (!(causationId === null || typeof causationId === 'string')) {
                errors.push('trace.causation_id must be a string or null.');
            }
        }
        if (typeof envelope.payload !== 'object' ||
            envelope.payload === null ||
            Array.isArray(envelope.payload)) {
            errors.push('payload must be an object.');
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Invalid SGP envelope',
                errors,
            });
        }
    }
    isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }
    isValidDateTime(value) {
        if (typeof value !== 'string' || value.trim().length === 0)
            return false;
        return !Number.isNaN(Date.parse(value));
    }
};
exports.ResourceSearchProtocolService = ResourceSearchProtocolService;
exports.ResourceSearchProtocolService = ResourceSearchProtocolService = __decorate([
    (0, common_1.Injectable)()
], ResourceSearchProtocolService);
//# sourceMappingURL=resource-search-protocol.service.js.map