import { CorsOptions } from 'cors';

export interface SocketIoConfig {
  cors: CorsOptions;
  transports: string[];
  allowEIO3: boolean;
  path: string;
  serveClient: boolean;
  adapter?: any;
  parser?: any;
  connectTimeout: number;
  pingTimeout: number;
  pingInterval: number;
  maxHttpBufferSize: number;
  allowRequest?: (req: any, callback: (err: string | null | undefined, success: boolean) => void) => void;
  perMessageDeflate?: boolean;
  httpCompression?: boolean;
  wsEngine?: string;
  initialPacket?: any;
  cookie?: boolean | object;
  allowUpgrades?: boolean;
  upgradeTimeout?: number;
  maxPayload?: number;
  closeOnBeforeunload?: boolean;
}

export const socketConfig: SocketIoConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://newfuse.app'] 
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io/',
  serveClient: false,
  connectTimeout: 45000,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  perMessageDeflate: false,
  httpCompression: false,
  wsEngine: 'ws',
  cookie: {
    name: 'io',
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  },
  allowUpgrades: true,
  upgradeTimeout: 10000,
  maxPayload: 1000000,
  closeOnBeforeunload: false
};

export interface SocketNamespaceConfig {
  name: string;
  auth?: (socket: any, next: (err?: any) => void) => void;
  adapter?: any;
  parser?: any;
  connectTimeout?: number;
  middleware?: Array<(socket: any, next: (err?: any) => void) => void>;
}

export const defaultNamespaces: SocketNamespaceConfig[] = [
  {
    name: '/',
    connectTimeout: 30000
  },
  {
    name: '/chat',
    connectTimeout: 45000,
    auth: (socket, next) => {
      // Add authentication logic here
      const token = socket.handshake.auth.token;
      if (token) {
        // Verify token
        next();
      } else {
        next(new Error('Authentication required'));
      }
    }
  },
  {
    name: '/agents',
    connectTimeout: 45000,
    auth: (socket, next) => {
      // Add authentication logic here
      const token = socket.handshake.auth.token;
      if (token) {
        // Verify token
        next();
      } else {
        next(new Error('Authentication required'));
      }
    }
  },
  {
    name: '/admin',
    connectTimeout: 30000,
    auth: (socket, next) => {
      // Add admin authentication logic here
      const token = socket.handshake.auth.token;
      const role = socket.handshake.auth.role;
      if (token && role === 'admin') {
        // Verify admin token
        next();
      } else {
        next(new Error('Admin authentication required'));
      }
    }
  }
];

export interface SocketRoomConfig {
  name: string;
  maxUsers?: number;
  requireAuth?: boolean;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export const defaultRooms: SocketRoomConfig[] = [
  {
    name: 'general',
    maxUsers: 100,
    requireAuth: false,
    permissions: ['read', 'write']
  },
  {
    name: 'agents',
    maxUsers: 50,
    requireAuth: true,
    permissions: ['read', 'write', 'execute']
  },
  {
    name: 'admin',
    maxUsers: 10,
    requireAuth: true,
    permissions: ['read', 'write', 'execute', 'admin']
  }
];

export const createSocketConfig = (overrides?: Partial<SocketIoConfig>): SocketIoConfig => {
  return {
    ...socketConfig,
    ...overrides
  };
};