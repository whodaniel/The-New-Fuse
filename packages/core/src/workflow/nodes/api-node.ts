
export interface APIConfig { url: string;
  method: GET | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
        throw new Error('API URL and method are required'