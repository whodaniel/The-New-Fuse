export interface FuseClientOptions {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface FuseUserRecord {
  id: string;
  [key: string]: unknown;
}

class UsersApi {
  constructor(private readonly request: <T>(path: string, init?: RequestInit) => Promise<T>) {}

  async list(): Promise<FuseUserRecord[]> {
    return this.request<FuseUserRecord[]>('/users');
  }
}

export class FuseClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly extraHeaders: Record<string, string>;

  readonly users: UsersApi;

  constructor(options: FuseClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.TNF_API_BASE_URL ?? 'http://localhost:3000';
    this.apiKey = options.apiKey;
    this.extraHeaders = options.headers ?? {};
    this.users = new UsersApi(this.request.bind(this));
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.baseUrl).toString();
    const headers = new Headers(init.headers || {});

    if (this.apiKey && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    for (const [key, value] of Object.entries(this.extraHeaders)) {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    }

    const response = await fetch(url, { ...init, headers });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`FuseClient request failed (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }
}

