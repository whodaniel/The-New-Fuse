import { resolveAccountBinding } from './AccountBindingService.js';
import { AuthService } from './AuthService.js';

export interface LedgerClientOptions {
  /** Explicit API boundary for integrations/tests; includes /api/unified-ledger. */
  baseUrl?: string;
  token?: string;
  workspaceId?: string;
}

/** Authenticated transport only. No second local ledger or silent offline fallback. */
export class UnifiedLedgerClient {
  private connection?: { base: string; token: string; workspaceId?: string };
  constructor(private readonly options: LedgerClientOptions = {}) {}
  async request<T>(method: string, route: string, body?: unknown): Promise<T> {
    if (!this.connection) {
      let base = this.options.baseUrl || process.env.TNF_LEDGER_API_URL;
      if (!base) {
        const api = process.env.TNF_API_URL || process.env.VITE_API_URL;
        if (api) {
          const normalized = api.replace(/\/$/, '');
          base = `${/\/api(?:\/v[0-9]+)?$/.test(normalized) ? normalized : normalized + '/api'}/unified-ledger`;
        } else
          base = `${resolveAccountBinding().cloudEndpoint.replace(/\/$/, '')}/api/unified-ledger`;
      }
      const token =
        this.options.token ||
        process.env.TNF_LEDGER_TOKEN ||
        process.env.TNF_API_TOKEN ||
        process.env.TNF_AUTH_TOKEN ||
        new AuthService().getCredential('tnf')?.accessToken;
      if (!token)
        throw new Error(
          'Ledger authentication required: configure TNF credentials or TNF_LEDGER_TOKEN'
        );
      this.connection = {
        base,
        token,
        workspaceId: this.options.workspaceId || process.env.TNF_WORKSPACE_ID,
      };
    }
    // Pin one connection for the lifetime of this service operation/session.
    const { base, token, workspaceId } = this.connection;
    const url = new URL(`${base.replace(/\/$/, '')}/${route.replace(/^\//, '')}`);
    if (
      url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    )
      throw new Error('Ledger API requires HTTPS (or local loopback HTTP)');
    if (workspaceId) url.searchParams.set('workspaceId', workspaceId);
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Ledger API ${method} failed (${response.status})`);
    const content = await response.text();
    return (content ? JSON.parse(content) : null) as T;
  }
}
