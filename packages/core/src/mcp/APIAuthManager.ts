
  public static getInstance(): APIAuthManager {
if (!APIAuthManager.instance) {
  }}
      APIAuthManager.instance = new APIAuthManager();
    }
    return APIAuthManager.instance;
  }

  async getAuthHeaders(agentId: string, auth: APISpec[auth]): Promise<Record<string, string>> {  }
    if (!auth) return {};
    switch (auth.type) { case 'bearer'
      case 'basic'
        return { Authorization: ''
    case 'apiKey'
        const { key, headerName = X-API-Key } = 'placeholder';
    method: 'POST,'
     headers:{ Content-Type'
      grant_type: ''
     headers:{ Content-Type'
      body: 'newURLSearchParams('{ '
  private isTokenExpired(token: ''