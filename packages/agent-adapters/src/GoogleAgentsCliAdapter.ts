/**
 * Google Agents CLI Interoperability Adapter
 *
 * Translates between the TNF Envelope Protocol and Google Agents CLI
 * JSON-RPC 2.0 envelopes, preserving the TNF Envelope Error Spec
 * (`code`, `reason`, `remediation`) across the boundary.
 *
 * The adapter is stateless and side-effect free: each translation is a pure
 * function of its input. Use {@link GoogleAgentsCliAdapter.envelopeFromJsonRpc}
 * for inbound (Google → TNF) traffic and
 * {@link GoogleAgentsCliAdapter.toJsonRpcRequest} for outbound (TNF → Google).
 */

/** TNF Envelope Error Spec payload. */
export interface TNFEnvelopeError {
  /** Stable machine-readable error code */
  code: string;
  /** Human-readable explanation */
  reason: string;
  /** Suggested remediation for the caller */
  remediation: string;
  /** Optional structured diagnostic detail */
  context?: Record<string, unknown>;
}

/** TNF envelope message for tool-level operations. */
export interface TNFEnvelopeMessage<TPayload = unknown> {
  /** Unique message ID (echoed as the correlation ID across adapters) */
  id: string;
  /** Originating agent/runtime identifier */
  source: string;
  /** Optional target agent/tool identifier */
  target?: string;
  /** Semantic message kind */
  kind: 'tool-invoke' | 'tool-result' | 'tool-error' | 'status' | 'unknown';
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Protocol version marker */
  protocol: 'tnf-envelope/v1';
  /** Payload body */
  payload: TPayload;
  /** Error payload when kind === 'tool-error' */
  error?: TNFEnvelopeError;
  /** Free-form metadata */
  metadata?: Record<string, unknown>;
}

/** Payload of a TNF 'tool-invoke' envelope. */
export interface TNFToolInvokePayload {
  tool: string;
  input: unknown;
  timeoutMs?: number;
}

export interface JsonRpcRequest<P = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: P;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcSuccess<R = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result: R;
}

export interface JsonRpcFailure {
  jsonrpc: '2.0';
  id: string | number;
  error: JsonRpcError;
}

export type JsonRpcResponse<R = unknown> = JsonRpcSuccess<R> | JsonRpcFailure;

/** Params shape used by Google Agents CLI tool invocation methods. */
export interface GoogleCliInvokeParams {
  name: string;
  arguments: unknown;
  /** TNF round-tripping metadata (executionId, source agent, timeout) */
  meta?: Record<string, unknown>;
}

/** Application-level JSON-RPC error code anchor for adapter failures. */
export const ADAPTER_ERROR_BASE = -32000;

/** Adapter configuration. */
export interface GoogleAgentsCliAdapterOptions {
  /** JSON-RPC method name used for outbound tool invocation (default: 'agents.tool.invoke') */
  invokeMethod?: string;
  /** Arbitrary metadata injected into every outbound request */
  staticMeta?: Record<string, unknown>;
  /** Name emitted as the adapter identity in translated sources */
  adapterName?: string;
}

/* -------------------------------------------------------------------------- */
/* Adapter                                                                     */
/* -------------------------------------------------------------------------- */

export class GoogleAgentsCliAdapter {
  private readonly invokeMethod: string;
  private readonly staticMeta?: Record<string, unknown>;
  private readonly adapterName: string;

  constructor(options: GoogleAgentsCliAdapterOptions = {}) {
    this.invokeMethod = options.invokeMethod ?? 'agents.tool.invoke';
    this.staticMeta = options.staticMeta;
    this.adapterName = options.adapterName ?? 'google-agents-cli';
  }

  /**
   * TNF → Google: translate a 'tool-invoke' envelope into a JSON-RPC request.
   * Throws if the envelope is not a tool-invoke message.
   */
  toJsonRpcRequest(
    envelope: TNFEnvelopeMessage<TNFToolInvokePayload>
  ): JsonRpcRequest<GoogleCliInvokeParams> {
    if (envelope.kind !== 'tool-invoke') {
      throw new Error(
        `GoogleAgentsCliAdapter: cannot translate kind '${envelope.kind}' to a request`
      );
    }

    const params: GoogleCliInvokeParams = {
      name: envelope.payload.tool,
      arguments:
        envelope.payload.input && typeof envelope.payload.input === 'object'
          ? envelope.payload.input
          : { value: envelope.payload.input },
    };

    const meta: Record<string, unknown> = {
      tnfSource: envelope.source,
      tnfTimestamp: envelope.timestamp,
      ...this.staticMeta,
      ...(envelope.metadata ?? {}),
    };

    if (envelope.payload.timeoutMs !== undefined) {
      meta.timeoutMs = envelope.payload.timeoutMs;
    }

    params.meta = meta;

    return {
      jsonrpc: '2.0',
      id: envelope.id,
      method: this.invokeMethod,
      params,
    };
  }

  /**
   * Google → TNF: translate a JSON-RPC response into a TNF envelope.
   */
  envelopeFromJsonRpc<R = unknown>(
    response: JsonRpcResponse<R>,
    context?: { source?: string; tool?: string }
  ): TNFEnvelopeMessage<R> {
    const base = {
      id: String(response.id),
      source: this.adapterName,
      target: context?.source,
      timestamp: new Date().toISOString(),
      protocol: 'tnf-envelope/v1' as const,
      metadata: context?.tool ? { tool: context.tool } : undefined,
    };

    if ('error' in response) {
      return {
        ...base,
        kind: 'tool-error',
        payload: null as unknown as R,
        error: this.mapJsonRpcErrorToTNF(response.error),
      };
    }

    return { ...base, kind: 'tool-result', payload: response.result };
  }

  /**
   * TNF → Google: build a JSON-RPC failure response from a TNF Envelope Error.
   */
  toJsonRpcFailure(id: string | number, error: TNFEnvelopeError): JsonRpcFailure {
    return {
      jsonrpc: '2.0',
      id,
      error: this.mapTNFErrorToJsonRpc(error),
    };
  }

  /**
   * Map a TNF Envelope Error to a JSON-RPC error object.
   * The numeric code is deterministic per TNF error code family:
   *   -32001 validation, -32002 execution, -32003 sanitization, -32004 timeout,
   *   -32000 everything else.
   */
  mapTNFErrorToJsonRpc(error: TNFEnvelopeError): JsonRpcError {
    const codeMap: Record<string, number> = {
      TNF_TOOL_VALIDATION_FAILED: ADAPTER_ERROR_BASE - 1,
      TNF_TOOL_EXECUTION_FAILED: ADAPTER_ERROR_BASE - 2,
      TNF_TOOL_SANITIZATION_FAILED: ADAPTER_ERROR_BASE - 3,
      TNF_TOOL_TIMEOUT: ADAPTER_ERROR_BASE - 4,
    };

    return {
      code: codeMap[error.code] ?? ADAPTER_ERROR_BASE,
      message: `[${error.code}] ${error.reason}`,
      data: {
        tnfCode: error.code,
        reason: error.reason,
        remediation: error.remediation,
        context: error.context ?? {},
      },
    };
  }

  /**
   * Map a JSON-RPC error object back to a TNF Envelope Error. If the error
   * carries a `data.remediation` hint it is preserved verbatim.
   */
  mapJsonRpcErrorToTNF(error: JsonRpcError): TNFEnvelopeError {
    const data =
      error.data && typeof error.data === 'object'
        ? (error.data as Record<string, unknown>)
        : undefined;

    const code =
      typeof data?.tnfCode === 'string'
        ? data.tnfCode
        : error.code === -32602
          ? 'TNF_TOOL_VALIDATION_FAILED'
          : 'TNF_TOOL_EXECUTION_FAILED';

    return {
      code,
      reason:
        typeof data?.reason === 'string' ? data.reason : error.message || 'Remote call failed',
      remediation:
        typeof data?.remediation === 'string'
          ? data.remediation
          : 'Inspect the remote agent error and retry with corrected input.',
      context: {
        jsonRpcCode: error.code,
        ...(data?.context && typeof data.context === 'object'
          ? (data.context as Record<string, unknown>)
          : {}),
      },
    };
  }
}

/** Factory helper. */
export function createGoogleAgentsCliAdapter(
  options?: GoogleAgentsCliAdapterOptions
): GoogleAgentsCliAdapter {
  return new GoogleAgentsCliAdapter(options);
}
