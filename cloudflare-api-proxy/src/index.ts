export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    
    // Construct the target URL on GCP Cloud Run
    const targetUrl = new URL(env.GCP_API_URL);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;

    // Handle CORS preflight for the proxy itself
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Create a new request based on the original, but with the target URL
    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });

    try {
      // Fetch from GCP
      const response = await fetch(newRequest);

      // Create a new response to allow modifying headers
      const newResponse = new Response(response.body, response);

      // FORCE CORS injection to override backend limits
      if (origin) {
        newResponse.headers.set('Access-Control-Allow-Origin', origin);
      } else {
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', '*');
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

      return newResponse;
    } catch (error) {
      console.error('Proxy fetch failed:', error);
      return new Response(JSON.stringify({ 
        error: 'Proxy Fetch Failed', 
        message: error instanceof Error ? error.message : String(error) 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
