#!/bin/bash

set -e

echo "Fixing case sensitivity issues in imports..."

# Create a TypeScript script to fix import paths
cat > src/utils/fixCaseSensitivity.ts << 'EOL'
// filepath: src/utils/fixCaseSensitivity.ts
import fs from 'fs';
import path from 'path';

// Map of problematic imports to their correct paths
const importMappings: Record<string, string> = {
  '../monitoring/metricsCollector': '../monitoring/MetricsCollector',
  './metricsCollector': './MetricsCollector',
  '../database/databaseManager': '../database/DatabaseManager',
  '../memory/MemoryCache': '../memory/memoryCache',
};

function processFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [incorrectPath, correctPath] of Object.entries(importMappings)) {
      const importRegex = new RegExp(`from ['"]${incorrectPath}['"]`, 'g');
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `from '${correctPath}'`);
        modified = true;
        console.log(`Found problematic import in ${filePath}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed case sensitivity in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function scanDirectory(directory: string): void {
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          processFile(fullPath);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

// Start from the src directory
console.log('Starting case sensitivity fixes...');
scanDirectory('src');
console.log('Case sensitivity fixes completed');
EOL

# Create winston types file for proper logging
mkdir -p src/types/modules
cat > src/types/modules/winston.d.ts << 'EOL'
// filepath: src/types/modules/winston.d.ts
declare module 'winston' {
  export interface Logger {
    log(level: string, message: string, ...meta: any[]): Logger;
    info(message: string, ...meta: any[]): Logger;
    error(message: string, ...meta: any[]): Logger;
    warn(message: string, ...meta: any[]): Logger;
    debug(message: string, ...meta: any[]): Logger;
    verbose(message: string, ...meta: any[]): Logger;
  }

  export interface LoggerOptions {
    level?: string;
    format?: any;
    defaultMeta?: any;
    transports?: any[];
    exitOnError?: boolean;
  }

  export interface Transports {
    Console: any;
    File: any;
    DailyRotateFile: any;
  }

  export const transports: Transports;
  
  export namespace format {
    function combine(...formats: any[]): any;
    function timestamp(options?: any): any;
    function json(): any;
    function printf(fn: Function): any;
    function colorize(): any;
  }
  
  export function createLogger(options: LoggerOptions): Logger;
  export function addColors(colors: Record<string, string>): void;
}
EOL

# Create a daily-rotate-file declaration file
cat > src/types/modules/winston-daily-rotate-file.d.ts << 'EOL'
// filepath: src/types/modules/winston-daily-rotate-file.d.ts
declare module 'winston-daily-rotate-file' {
  import * as winston from 'winston';
  
  interface DailyRotateFileTransportOptions {
    level?: string;
    filename?: string;
    dirname?: string;
    datePattern?: string;
    zippedArchive?: boolean;
    maxSize?: string;
    maxFiles?: string | number;
    auditFile?: string;
    frequency?: string;
    utc?: boolean;
    extension?: string;
    createSymlink?: boolean;
    symlinkName?: string;
    format?: any;
  }
  
  class DailyRotateFile {
    constructor(options: DailyRotateFileTransportOptions);
  }
  
  export = DailyRotateFile;
}
EOL

# Create a winston-elasticsearch declaration file
cat > src/types/modules/winston-elasticsearch.d.ts << 'EOL'
// filepath: src/types/modules/winston-elasticsearch.d.ts
declare module 'winston-elasticsearch' {
  import * as winston from 'winston';
  
  interface ElasticsearchTransportOptions {
    level?: string;
    index?: string;
    indexPrefix?: string;
    indexSuffixPattern?: string;
    messageType?: string;
    clientOpts?: any;
    transformer?: Function;
    ensureMappingTemplate?: boolean;
    mappingTemplate?: any;
    flushInterval?: number;
    format?: any;
  }
  
  class ElasticsearchTransport {
    constructor(options: ElasticsearchTransportOptions);
  }
  
  export = ElasticsearchTransport;
}
EOL

# Create default User entity in user folder
mkdir -p src/user/entities
cat > src/user/entities/User.ts << 'EOL'
// filepath: src/user/entities/User.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export class UserEntity implements User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  constructor(data: Partial<User>) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.name = data.name;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    
    // Copy any additional properties
    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'].includes(key)) {
        this[key] = value;
      }
    });
  }
}

export default UserEntity;
EOL

# Create a type definitions to handle @types/ws
mkdir -p src/types/modules
cat > src/types/modules/ws.d.ts << 'EOL'
// filepath: src/types/modules/ws.d.ts
declare module 'ws' {
  import { EventEmitter } from 'events';
  import * as http from 'http';
  import * as net from 'net';
  import * as stream from 'stream';
  
  class WebSocket extends EventEmitter {
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
    
    binaryType: string;
    bufferedAmount: number;
    extensions: string;
    protocol: string;
    readyState: number;
    url: string;
    
    constructor(address: string | URL, protocols?: string | string[], options?: WebSocket.ClientOptions);
    constructor(address: string | URL, options?: WebSocket.ClientOptions);
    
    close(code?: number, data?: string | Buffer): void;
    ping(data?: any, mask?: boolean, cb?: (err?: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err?: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(data: any, options: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }, cb?: (err?: Error) => void): void;
    terminate(): void;
    
    on(event: 'close', listener: (code: number, reason: string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (data: WebSocket.Data) => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'ping' | 'pong', listener: (data: Buffer) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }
  
  namespace WebSocket {
    export interface ClientOptions {
      protocol?: string;
      handshakeTimeout?: number;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      localAddress?: string;
      protocolVersion?: number;
      headers?: { [key: string]: string };
      origin?: string;
      agent?: http.Agent;
      host?: string;
      family?: number;
      checkServerIdentity?(servername: string, cert: any): boolean;
      rejectUnauthorized?: boolean;
      maxPayload?: number;
      followRedirects?: boolean;
      maxRedirects?: number;
    }
    
    export interface PerMessageDeflateOptions {
      serverNoContextTakeover?: boolean;
      clientNoContextTakeover?: boolean;
      serverMaxWindowBits?: number;
      clientMaxWindowBits?: number;
      zlibDeflateOptions?: {
        flush?: number;
        finishFlush?: number;
        chunkSize?: number;
        windowBits?: number;
        level?: number;
        memLevel?: number;
        strategy?: number;
        dictionary?: Buffer | Buffer[] | DataView;
        info?: boolean;
      };
      zlibInflateOptions?: any;
      threshold?: number;
      concurrencyLimit?: number;
    }
    
    export type Data = string | Buffer | ArrayBuffer | Buffer[];
    
    export interface ServerOptions {
      host?: string;
      port?: number;
      backlog?: number;
      server?: http.Server | https.Server;
      verifyClient?: VerifyClientCallbackAsync | VerifyClientCallbackSync;
      handleProtocols?: (protocols: string[], request: http.IncomingMessage) => string | false;
      path?: string;
      noServer?: boolean;
      clientTracking?: boolean;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      maxPayload?: number;
    }
    
    export interface VerifyClientCallbackAsync {
      (info: { origin: string; secure: boolean; req: http.IncomingMessage }, callback: (res: boolean, code?: number, message?: string, headers?: OutgoingHttpHeaders) => void): void;
    }
    
    export interface VerifyClientCallbackSync {
      (info: { origin: string; secure: boolean; req: http.IncomingMessage }): boolean | { result: boolean; code?: number; message?: string; headers?: OutgoingHttpHeaders };
    }
    
    export interface OutgoingHttpHeaders {
      [header: string]: number | string | string[] | undefined;
    }
  }
  
  export = WebSocket;
}

// Add missing https module reference
declare module 'https' {
  import * as http from 'http';
  
  export interface Server extends http.Server {}
}
EOL

# Create a package.json update to add the fix script
cat > package.json.patch << 'EOL'
{
  "scripts": {
    "fix-case-sensitivity": "ts-node src/utils/fixCaseSensitivity.ts"
  }
}
EOL

echo "Running case sensitivity fix..."
npx ts-node src/utils/fixCaseSensitivity.ts || echo "Could not run the fix script directly. You can run it later with: yarn fix-case-sensitivity"

echo "Finished fixing case sensitivity issues."
