import { describe, expect, it } from 'vitest';
import {
  ADAPTER_ERROR_BASE,
  GoogleAgentsCliAdapter,
  createGoogleAgentsCliAdapter,
  type JsonRpcFailure,
  type JsonRpcSuccess,
  type TNFEnvelopeError,
  type TNFEnvelopeMessage,
  type TNFToolInvokePayload,
} from '../GoogleAgentsCliAdapter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInvokeEnvelope(
  overrides: Partial<TNFEnvelopeMessage<TNFToolInvokePayload>> = {}
): TNFEnvelopeMessage<TNFToolInvokePayload> {
  return {
    id: 'test-id-001',
    source: 'orchestrator',
    kind: 'tool-invoke',
    timestamp: '2026-01-01T00:00:00.000Z',
    protocol: 'tnf-envelope/v1',
    payload: { tool: 'search', input: { query: 'hello' } },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Round-trip: toJsonRpcRequest → envelopeFromJsonRpc identity
// ---------------------------------------------------------------------------

describe('GoogleAgentsCliAdapter – round-trip identity', () => {
  const adapter = new GoogleAgentsCliAdapter();

  it('preserves id across the outbound → inbound round-trip (success)', () => {
    const envelope = makeInvokeEnvelope();
    const rpcReq = adapter.toJsonRpcRequest(envelope);

    const successRes: JsonRpcSuccess<{ hits: number }> = {
      jsonrpc: '2.0',
      id: rpcReq.id,
      result: { hits: 42 },
    };
    const backEnvelope = adapter.envelopeFromJsonRpc(successRes, {
      source: 'orchestrator',
      tool: 'search',
    });

    expect(backEnvelope.id).toBe(String(envelope.id));
    expect(backEnvelope.kind).toBe('tool-result');
    expect(backEnvelope.payload).toEqual({ hits: 42 });
    expect(backEnvelope.protocol).toBe('tnf-envelope/v1');
  });

  it('preserves id across the outbound → inbound round-trip (error)', () => {
    const envelope = makeInvokeEnvelope();
    const rpcReq = adapter.toJsonRpcRequest(envelope);

    const failRes: JsonRpcFailure = {
      jsonrpc: '2.0',
      id: rpcReq.id,
      error: { code: -32602, message: 'Invalid params' },
    };
    const backEnvelope = adapter.envelopeFromJsonRpc(failRes);

    expect(backEnvelope.id).toBe(String(envelope.id));
    expect(backEnvelope.kind).toBe('tool-error');
    expect(backEnvelope.error?.code).toBe('TNF_TOOL_VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// toJsonRpcRequest
// ---------------------------------------------------------------------------

describe('toJsonRpcRequest', () => {
  const adapter = new GoogleAgentsCliAdapter({ staticMeta: { team: 'tnf' } });

  it('produces a valid JSON-RPC 2.0 structure', () => {
    const req = adapter.toJsonRpcRequest(makeInvokeEnvelope());
    expect(req.jsonrpc).toBe('2.0');
    expect(typeof req.id).toBe('string');
    expect(req.method).toBe('agents.tool.invoke');
  });

  it('maps tool name and arguments from payload', () => {
    const req = adapter.toJsonRpcRequest(
      makeInvokeEnvelope({ payload: { tool: 'compute', input: { n: 7 } } })
    );
    expect(req.params?.name).toBe('compute');
    expect(req.params?.arguments).toEqual({ n: 7 });
  });

  it('wraps scalar input in { value }', () => {
    const req = adapter.toJsonRpcRequest(
      makeInvokeEnvelope({ payload: { tool: 'ping', input: 'hello' } })
    );
    expect(req.params?.arguments).toEqual({ value: 'hello' });
  });

  it('injects staticMeta into params.meta', () => {
    const req = adapter.toJsonRpcRequest(makeInvokeEnvelope());
    expect(req.params?.meta?.team).toBe('tnf');
  });

  it('includes timeoutMs in meta when present', () => {
    const req = adapter.toJsonRpcRequest(
      makeInvokeEnvelope({ payload: { tool: 'slow', input: {}, timeoutMs: 5000 } })
    );
    expect(req.params?.meta?.timeoutMs).toBe(5000);
  });

  it('throws when envelope kind is not tool-invoke', () => {
    const badEnvelope = makeInvokeEnvelope({ kind: 'status' } as never);
    expect(() => adapter.toJsonRpcRequest(badEnvelope)).toThrow(/cannot translate kind 'status'/);
  });

  it('respects custom invokeMethod', () => {
    const custom = new GoogleAgentsCliAdapter({ invokeMethod: 'custom.method' });
    const req = custom.toJsonRpcRequest(makeInvokeEnvelope());
    expect(req.method).toBe('custom.method');
  });
});

// ---------------------------------------------------------------------------
// Error mapping bijection
// ---------------------------------------------------------------------------

describe('mapTNFErrorToJsonRpc ↔ mapJsonRpcErrorToTNF bijection', () => {
  const adapter = new GoogleAgentsCliAdapter();

  const TNF_CODES: TNFEnvelopeError['code'][] = [
    'TNF_TOOL_VALIDATION_FAILED',
    'TNF_TOOL_EXECUTION_FAILED',
    'TNF_TOOL_SANITIZATION_FAILED',
    'TNF_TOOL_TIMEOUT',
    'UNKNOWN_CODE',
  ];

  const EXPECTED_NUMERIC: Record<string, number> = {
    TNF_TOOL_VALIDATION_FAILED: ADAPTER_ERROR_BASE - 1,
    TNF_TOOL_EXECUTION_FAILED: ADAPTER_ERROR_BASE - 2,
    TNF_TOOL_SANITIZATION_FAILED: ADAPTER_ERROR_BASE - 3,
    TNF_TOOL_TIMEOUT: ADAPTER_ERROR_BASE - 4,
    UNKNOWN_CODE: ADAPTER_ERROR_BASE,
  };

  for (const tnfCode of TNF_CODES) {
    it(`maps ${tnfCode} to numeric code ${EXPECTED_NUMERIC[tnfCode]} and back`, () => {
      const tnfError: TNFEnvelopeError = {
        code: tnfCode,
        reason: 'test reason',
        remediation: 'test remediation',
        context: { extra: 1 },
      };

      const rpcError = adapter.mapTNFErrorToJsonRpc(tnfError);
      expect(rpcError.code).toBe(EXPECTED_NUMERIC[tnfCode]);
      expect(rpcError.message).toContain(tnfCode);

      const roundTrip = adapter.mapJsonRpcErrorToTNF(rpcError);
      // For known codes, the tnfCode is preserved via data.tnfCode
      if (tnfCode !== 'UNKNOWN_CODE') {
        expect(roundTrip.code).toBe(tnfCode);
      }
      expect(roundTrip.reason).toBe('test reason');
      expect(roundTrip.remediation).toBe('test remediation');
    });
  }
});

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

describe('createGoogleAgentsCliAdapter', () => {
  it('returns a GoogleAgentsCliAdapter instance', () => {
    const adapter = createGoogleAgentsCliAdapter();
    expect(adapter).toBeInstanceOf(GoogleAgentsCliAdapter);
  });

  it('forwards options to the instance', () => {
    const adapter = createGoogleAgentsCliAdapter({ adapterName: 'my-adapter' });
    const env = adapter.envelopeFromJsonRpc({
      jsonrpc: '2.0',
      id: '1',
      result: {},
    });
    expect(env.source).toBe('my-adapter');
  });
});

// ---------------------------------------------------------------------------
// ADAPTER_ERROR_BASE constant
// ---------------------------------------------------------------------------

describe('ADAPTER_ERROR_BASE', () => {
  it('is -32000', () => {
    expect(ADAPTER_ERROR_BASE).toBe(-32000);
  });
});
