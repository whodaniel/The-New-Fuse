/**
 * Return a JSON string suitable for Redis publish. TNF envelopes are signed;
 * already-signed packets and non-envelope telemetry pass through.
 */
export declare function stringifySignedBusMessage(agentId: string, channel: string, message: unknown, typeHint?: string): string;
//# sourceMappingURL=sign-bus-message.d.ts.map