import { generateId, generateTimestamp, pickRandom } from './utils.js';
import type { GeneratedUser } from './userGenerator.js';

export interface GenerateAPIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  withAuth?: boolean;
  withPagination?: boolean;
  withFilters?: boolean;
  user?: GeneratedUser;
}

export interface GenerateAPIResponseOptions {
  status?: number;
  withPagination?: boolean;
  withMeta?: boolean;
  withError?: boolean;
}

export interface GeneratedAPIRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  timestamp: Date;
  user?: Partial<GeneratedUser>;
}

export interface GeneratedAPIResponse {
  id: string;
  status: number;
  headers: Record<string, string>;
  body: any;
  timestamp: Date;
  requestId: string;
  meta?: Record<string, any>;
}

const DEFAULT_REQUEST_OPTIONS: GenerateAPIRequestOptions = {
  method: 'GET',
  withAuth: true,
  withPagination: false,
  withFilters: false
};

const DEFAULT_RESPONSE_OPTIONS: GenerateAPIResponseOptions = {
  status: 200,
  withPagination: false,
  withMeta: true,
  withError: false
};

const API_PATHS = [
  '/api/users',
  '/api/workflows',
  '/api/agents',
  '/api/tasks',
  '/api/metrics'
];

export const generateAPIRequest = (options: GenerateAPIRequestOptions = {}): GeneratedAPIRequest => {
  const finalOptions = { ...DEFAULT_REQUEST_OPTIONS, ...options };
  const requestId = generateId();

  const request: GeneratedAPIRequest = {
    id: requestId,
    method: finalOptions.method || 'GET',
    path: pickRandom(API_PATHS),
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...(finalOptions.withAuth && {
        'Authorization': `Bearer test-token-${generateId()}`
      })
    },
    timestamp: generateTimestamp(),
    user: finalOptions.user ? {
      id: finalOptions.user.id,
      username: finalOptions.user.username,
      role: finalOptions.user.role
    } : undefined
  };

  if (finalOptions.withPagination) {
    request.query = {
      page: '1',
      limit: '10',
      sort: 'createdAt:desc'
    };
  }

  if (finalOptions.withFilters) {
    request.query = {
      ...request.query,
      status: 'active',
      type: 'user',
      from: new Date().toISOString()
    };
  }

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    request.body = generateRequestBody(request.path);
  }

  return request;
};

export const generateAPIResponse = (
  request: GeneratedAPIRequest,
  options: GenerateAPIResponseOptions = {}
): GeneratedAPIResponse => {
  const finalOptions = { ...DEFAULT_RESPONSE_OPTIONS, ...options };

  if (finalOptions.withError) {
    return generateErrorResponse(request);
  }

  const response: GeneratedAPIResponse = {
    id: generateId(),
    status: finalOptions.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': request.id
    },
    body: generateResponseBody(request, finalOptions),
    timestamp: generateTimestamp(),
    requestId: request.id
  };

  if (finalOptions.withMeta) {
    response.meta = {
      processingTime: Math.random() * 100,
      apiVersion: '1.0',
      serverRegion: 'us-east-1'
    };
  }

  return response;
};

const generateRequestBody = (path: string): any => {
  const basePath = path.split('/')[2]; // Extract resource type from path
  switch (basePath) {
    case 'users':
      return {
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
    case 'workflows':
      return {
        name: 'Test Workflow',
        description: 'Test workflow description',
        isActive: true
      };
    default:
      return {
        name: 'Test Resource',
        description: 'Test description'
      };
  }
};

const generateResponseBody = (
  request: GeneratedAPIRequest,
  options: GenerateAPIResponseOptions
): any => {
  const basePath = request.path.split('/')[2];
  const data = Array.from({ length: 5 }, (_, i) => ({
    id: generateId(),
    name: `Test ${basePath} ${i + 1}`,
    createdAt: generateTimestamp({ past: true }),
    updatedAt: generateTimestamp({ past: true })
  }));

  if (options.withPagination) {
    return {
      data,
      pagination: {
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10
      }
    };
  }

  return data;
};

const generateErrorResponse = (request: GeneratedAPIRequest): GeneratedAPIResponse => {
  const errorResponses = [
    {
      status: 400,
      error: 'Bad Request',
      message: 'Invalid request parameters'
    },
    {
      status: 401,
      error: 'Unauthorized',
      message: 'Authentication required'
    },
    {
      status: 403,
      error: 'Forbidden',
      message: 'Insufficient permissions'
    },
    {
      status: 404,
      error: 'Not Found',
      message: 'Resource not found'
    },
    {
      status: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    }
  ];

  const error = pickRandom(errorResponses);

  return {
    id: generateId(),
    status: error.status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': request.id
    },
    body: {
      error: error.error,
      message: error.message,
      requestId: request.id,
      timestamp: new Date().toISOString()
    },
    timestamp: generateTimestamp(),
    requestId: request.id
  };
};