class UsersApi {
    constructor(request) {
        this.request = request;
    }
    async list() {
        return this.request('/users');
    }
}
export class FuseClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl ?? process.env.TNF_API_BASE_URL ?? 'http://localhost:3000';
        this.apiKey = options.apiKey;
        this.extraHeaders = options.headers ?? {};
        this.users = new UsersApi(this.request.bind(this));
    }
    async request(path, init = {}) {
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
        return response.json();
    }
}
//# sourceMappingURL=index.js.map