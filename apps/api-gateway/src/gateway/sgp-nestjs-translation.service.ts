import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type JsonObject = Record<string, unknown>;

const SUPPORTED_SGP_TYPES = new Set([
  'DISCOVER.REQUEST',
  'DISCOVER.RESPONSE',
  'MANIFEST.PUBLISH',
  'SCHEMA.PUBLISH',
  'QUERY.REQUEST',
  'QUERY.RESPONSE',
  'SUBSCRIBE.REQUEST',
  'CHANGE.EVENT',
  'ERROR',
]);

export interface SgpActor {
  id: string;
  roles: string[];
}

export interface SgpTrace {
  correlation_id: string;
  causation_id: string | null;
}

export interface SgpEnvelope {
  id: string;
  spec: 'sgp/0.1';
  type: string;
  tenant: string;
  resource: string;
  sent_at: string;
  actor: SgpActor;
  trace: SgpTrace;
  payload: JsonObject;
  sig?: string;
}

export interface NestjsReadPacket {
  pattern: string | JsonObject;
  data: JsonObject;
  id?: string;
  meta?: JsonObject;
}

export interface SgpEnvelopeDefaults {
  id?: string;
  tenant?: string;
  resource?: string;
  sent_at?: string;
  actor?: SgpActor;
  trace?: SgpTrace;
  sig?: string;
}

@Injectable()
export class SgpNestjsTranslationService {
  toNestPacket(envelope: SgpEnvelope): NestjsReadPacket {
    this.assertSgpEnvelope(envelope);

    return {
      pattern: this.sgpTypeToNestPattern(envelope.type),
      data: envelope.payload,
      id: envelope.id,
      meta: {
        protocol: envelope.spec,
        sgp_type: envelope.type,
        tenant: envelope.tenant,
        resource: envelope.resource,
        sent_at: envelope.sent_at,
        actor: envelope.actor,
        trace: envelope.trace,
        ...(envelope.sig ? { sig: envelope.sig } : {}),
      },
    };
  }

  fromNestPacket(packet: NestjsReadPacket, defaults?: SgpEnvelopeDefaults): SgpEnvelope {
    this.assertNestPacket(packet);
    const meta = this.asObject(packet.meta);
    const type =
      typeof meta?.sgp_type === 'string' && this.isSupportedSgpType(meta.sgp_type)
        ? meta.sgp_type
        : this.nestPatternToSgpType(packet.pattern);

    const id =
      this.asNonEmptyString(packet.id) || this.asNonEmptyString(defaults?.id) || randomUUID();
    const tenant = this.pickNonEmptyString(defaults?.tenant, meta?.tenant);
    const resource = this.pickNonEmptyString(defaults?.resource, meta?.resource);
    const sent_at =
      this.pickNonEmptyString(defaults?.sent_at, meta?.sent_at) || new Date().toISOString();
    const actor = this.pickActor(defaults?.actor, meta?.actor);
    const trace = this.pickTrace(defaults?.trace, meta?.trace, id);
    const sig = this.pickNonEmptyString(defaults?.sig, meta?.sig);

    if (!tenant) {
      throw new BadRequestException('Missing tenant for SGP envelope translation.');
    }
    if (!resource) {
      throw new BadRequestException('Missing resource for SGP envelope translation.');
    }

    const envelope: SgpEnvelope = {
      id,
      spec: 'sgp/0.1',
      type,
      tenant,
      resource,
      sent_at,
      actor,
      trace,
      payload: packet.data,
    };

    if (sig) {
      envelope.sig = sig;
    }

    return envelope;
  }

  private assertSgpEnvelope(envelope: SgpEnvelope): void {
    if (!this.isObject(envelope)) {
      throw new BadRequestException('Envelope must be an object.');
    }
    if (envelope.spec !== 'sgp/0.1') {
      throw new BadRequestException(`Unsupported SGP spec: ${String(envelope.spec)}`);
    }
    if (!this.isSupportedSgpType(envelope.type)) {
      throw new BadRequestException(`Unsupported SGP type: ${String(envelope.type)}`);
    }
    if (!this.asNonEmptyString(envelope.id)) {
      throw new BadRequestException('Envelope.id is required.');
    }
    if (!this.asNonEmptyString(envelope.tenant)) {
      throw new BadRequestException('Envelope.tenant is required.');
    }
    if (!this.asNonEmptyString(envelope.resource)) {
      throw new BadRequestException('Envelope.resource is required.');
    }
    if (!this.asNonEmptyString(envelope.sent_at)) {
      throw new BadRequestException('Envelope.sent_at is required.');
    }
    if (!this.isObject(envelope.payload)) {
      throw new BadRequestException('Envelope.payload must be an object.');
    }
    if (!this.isValidActor(envelope.actor)) {
      throw new BadRequestException('Envelope.actor must include id and roles.');
    }
    if (!this.isValidTrace(envelope.trace)) {
      throw new BadRequestException('Envelope.trace must include correlation_id and causation_id.');
    }
  }

  private assertNestPacket(packet: NestjsReadPacket): void {
    if (!this.isObject(packet)) {
      throw new BadRequestException('Packet must be an object.');
    }
    if (!(typeof packet.pattern === 'string' || this.isObject(packet.pattern))) {
      throw new BadRequestException('Packet.pattern must be a string or object.');
    }
    if (!this.isObject(packet.data)) {
      throw new BadRequestException('Packet.data must be an object.');
    }
  }

  private sgpTypeToNestPattern(type: string): string {
    return `sgp.${type.toLowerCase().replace(/\./g, '.')}`;
  }

  private nestPatternToSgpType(pattern: string | JsonObject): string {
    const patternString = this.extractPatternString(pattern);
    if (!patternString) {
      throw new BadRequestException('Unable to derive SGP type from packet.pattern.');
    }

    const normalized = patternString
      .replace(/^sgp[./]/i, '')
      .replace(/\//g, '.')
      .toUpperCase();
    if (!this.isSupportedSgpType(normalized)) {
      throw new BadRequestException(`Pattern does not map to supported SGP type: ${patternString}`);
    }
    return normalized;
  }

  private extractPatternString(pattern: string | JsonObject): string | null {
    if (typeof pattern === 'string') {
      return pattern.trim();
    }

    const candidates = ['type', 'topic', 'cmd', 'event', 'name'];
    for (const key of candidates) {
      const value = (pattern as JsonObject)[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private pickActor(primary: unknown, secondary: unknown): SgpActor {
    if (this.isValidActor(primary)) {
      return primary;
    }
    if (this.isValidActor(secondary)) {
      return secondary;
    }
    return { id: 'sgp-nestjs-bridge', roles: ['system'] };
  }

  private pickTrace(primary: unknown, secondary: unknown, fallbackId: string): SgpTrace {
    if (this.isValidTrace(primary)) {
      return primary;
    }
    if (this.isValidTrace(secondary)) {
      return secondary;
    }
    return { correlation_id: fallbackId, causation_id: null };
  }

  private pickNonEmptyString(...values: unknown[]): string | null {
    for (const value of values) {
      const normalized = this.asNonEmptyString(value);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  private asNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private asObject(value: unknown): JsonObject | null {
    return this.isObject(value) ? value : null;
  }

  private isSupportedSgpType(value: unknown): value is string {
    return typeof value === 'string' && SUPPORTED_SGP_TYPES.has(value);
  }

  private isValidActor(value: unknown): value is SgpActor {
    if (!this.isObject(value)) {
      return false;
    }
    const id = (value as JsonObject).id;
    const roles = (value as JsonObject).roles;
    return (
      typeof id === 'string' &&
      id.trim().length > 0 &&
      Array.isArray(roles) &&
      roles.length > 0 &&
      roles.every((role) => typeof role === 'string' && role.trim().length > 0)
    );
  }

  private isValidTrace(value: unknown): value is SgpTrace {
    if (!this.isObject(value)) {
      return false;
    }
    const correlationId = (value as JsonObject).correlation_id;
    const causationId = (value as JsonObject).causation_id;
    return (
      typeof correlationId === 'string' &&
      correlationId.trim().length > 0 &&
      (typeof causationId === 'string' || causationId === null)
    );
  }

  private isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
