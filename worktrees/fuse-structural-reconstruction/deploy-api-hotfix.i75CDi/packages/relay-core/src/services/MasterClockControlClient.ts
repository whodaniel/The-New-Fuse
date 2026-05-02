import type {
  MasterClockHealthResponse,
  MasterClockSignalEnvelope,
  RegisterClockNodeRequest,
  RegisteredClockNode,
  SignalAckRecord,
  SignalAckRequest,
} from '@the-new-fuse/control-plane-contracts';

export interface MasterClockControlClientOptions {
  apiBase: string;
  controlAuthToken?: string;
}

export class MasterClockControlClient {
  private readonly apiBase: string;
  private readonly controlAuthToken: string;

  constructor(options: MasterClockControlClientOptions) {
    this.apiBase = options.apiBase.replace(/\/+$/, '');
    this.controlAuthToken = options.controlAuthToken || '';
  }

  private buildUrl(path: string): string {
    return `${this.apiBase}${path}`;
  }

  private buildHeaders(json: boolean = false): HeadersInit {
    return {
      ...(json ? { 'content-type': 'application/json' } : {}),
      ...(this.controlAuthToken ? { authorization: `Bearer ${this.controlAuthToken}` } : {}),
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.apiBase) {
      throw new Error('MASTER_CLOCK_API_BASE_REQUIRED');
    }

    const response = await fetch(this.buildUrl(path), init);
    const body = (await response.json().catch(() => null)) as T | { error?: string } | null;

    if (!response.ok) {
      const errorCode =
        body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : `MASTER_CLOCK_API_ERROR:${response.status}`;
      throw new Error(errorCode);
    }

    if (body === null) {
      throw new Error('MASTER_CLOCK_API_EMPTY_RESPONSE');
    }

    return body as T;
  }

  async getHealth(): Promise<MasterClockHealthResponse> {
    return this.request<MasterClockHealthResponse>('/master-clock/health');
  }

  async registerNode(input: RegisterClockNodeRequest): Promise<RegisteredClockNode> {
    return this.request<RegisteredClockNode>('/master-clock/nodes/register', {
      method: 'POST',
      headers: this.buildHeaders(true),
      body: JSON.stringify(input),
    });
  }

  async getLatestSignal(nodeId: string): Promise<MasterClockSignalEnvelope | null> {
    try {
      return await this.request<MasterClockSignalEnvelope>(
        `/master-clock/signals/latest/${encodeURIComponent(nodeId)}`
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'SIGNAL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  async acknowledgeSignal(request: SignalAckRequest): Promise<SignalAckRecord> {
    return this.request<SignalAckRecord>('/master-clock/signals/ack', {
      method: 'POST',
      headers: this.buildHeaders(true),
      body: JSON.stringify(request),
    });
  }
}
