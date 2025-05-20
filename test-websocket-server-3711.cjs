const WebSocket = require('ws');
const readline = require('readline');
const redis = require('redis');

// Get port from environment variable or use default
const PORT = parseInt(process.env.WS_PORT || '3712', 10);

// Redis client configuration
let redisClient = null;
const redisConfig = {
  development: {
    host: 'localhost',
    port: 6379,
    username: '',
    password: '',
  },
  production: {
    host: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 11337,
    username: 'default',
    password: 'CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d',
    tls: true
  }
};

// Function to initiate Redis connection
async function connectToRedis(env = 'development') {
  try {
    // Check for custom config via environment variable
    let config;
    if (env === 'custom' && process.env.REDIS_CONFIG) {
      try {
        config = JSON.parse(process.env.REDIS_CONFIG);
        console.log('Using custom Redis configuration');
      } catch (error) {
        console.error('Failed to parse custom Redis config:', error);
        // Fall back to development config
        config = redisConfig.development;
      }
    } else {
      config = redisConfig[env] || redisConfig.development;
    }
    
    // Create Redis URL based on configuration
    let redisUrl = 'redis://';
    if (config.username && config.password) {
      redisUrl += `${config.username}:${config.password}@`;
    }
    redisUrl += `${config.host}:${config.port}`;
    
    // Connection options
    const options = {};
    if (config.tls) {
      options.socket = { tls: true };
    }

    console.log(`Connecting to Redis at ${config.host}:${config.port}...`);
    
    // Create client
    redisClient = redis.createClient({
      url: redisUrl,
      ...options
    });
    
    // Set up event handlers
    redisClient.on('error', (err) => console.error('Redis error:', err));
    redisClient.on('connect', () => console.log('Connected to Redis server'));
    redisClient.on('ready', () => console.log('Redis client ready'));
    redisClient.on('end', () => console.log('Redis connection ended'));
    
    // Connect
    await redisClient.connect();
    
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}

// Function to disconnect Redis
async function disconnectRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Disconnected from Redis server');
  }
}

// Function to execute Redis commands
async function executeRedisCommand(command, args) {
  if (!redisClient || !redisClient.isOpen) {
    console.error('Redis client is not connected');
    return { error: 'Redis client is not connected' };
  }
  
  try {
    const result = await redisClient[command](...args);
    return { success: true, result };
  } catch (error) {
    console.error(`Redis command error (${command}):`, error);
    return { error: error.message };
  }
}

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Server > '
});

// Track connected clients
const clients = new Set();

// Initialize pub/sub clients
let pubClient = null;
let subClient = null;

// Setup Redis pub/sub
async function setupRedisPubSub(env = 'development') {
  // Don't setup if we already have clients
  if (pubClient && subClient) {
    if (pubClient.isOpen && subClient.isOpen) {
      return;
    }
    // Clean up existing clients if not open
    try {
      if (pubClient && pubClient.isOpen) await pubClient.quit();
      if (subClient && subClient.isOpen) await subClient.quit();
    } catch (err) {
      console.error('Error cleaning up pub/sub clients:', err);
    }
  }
  
  try {
    // Check for custom config via environment variable
    let config;
    if (env === 'custom' && process.env.REDIS_CONFIG) {
      try {
        config = JSON.parse(process.env.REDIS_CONFIG);
        console.log('Using custom Redis configuration for pub/sub');
      } catch (error) {
        console.error('Failed to parse custom Redis config for pub/sub:', error);
        // Fall back to development config
        config = redisConfig.development;
      }
    } else {
      config = redisConfig[env] || redisConfig.development;
    }
    
    // Create Redis URL based on configuration
    let redisUrl = 'redis://';
    if (config.username && config.password) {
      redisUrl += `${config.username}:${config.password}@`;
    }
    redisUrl += `${config.host}:${config.port}`;
    
    // Connection options
    const options = {};
    if (config.tls) {
      options.socket = { tls: true };
    }
    
    console.log('Setting up Redis pub/sub clients...');
    
    // Create publish client
    pubClient = redis.createClient({
      url: redisUrl,
      ...options
    });
    
    pubClient.on('error', (err) => console.error('Redis publish client error:', err));
    pubClient.on('connect', () => console.log('Redis publish client connected'));
    pubClient.on('ready', () => console.log('Redis publish client ready'));
    
    // Create subscribe client
    subClient = redis.createClient({
      url: redisUrl,
      ...options
    });
    
    subClient.on('error', (err) => console.error('Redis subscribe client error:', err));
    subClient.on('connect', () => console.log('Redis subscribe client connected'));
    subClient.on('ready', () => console.log('Redis subscribe client ready'));
    
    // Connect both clients
    await pubClient.connect();
    await subClient.connect();
    
    // Subscribe to channels
    await subClient.subscribe('websocket-broadcast', (message) => {
      try {
        const data = JSON.parse(message);
        broadcastToClients(data);
      } catch (err) {
        console.error('Error handling pub/sub message:', err);
      }
    });
    
    console.log('Redis pub/sub setup complete');
    return true;
  } catch (error) {
    console.error('Redis pub/sub setup error:', error);
    return false;
  }
}

// Broadcast to all connected clients
function broadcastToClients(data) {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  let count = 0;
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      count++;
    }
  });
  
  console.log(`Message broadcasted to ${count} client(s)`);
}

// Publish message to Redis channel
async function publishToRedis(channel, data) {
  if (!pubClient || !pubClient.isOpen) {
    console.error('Redis publish client is not connected');
    return false;
  }
  
  try {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    await pubClient.publish(channel, message);
    console.log(`Published message to channel ${channel}`);
    return true;
  } catch (error) {
    console.error(`Redis publish error (${channel}):`, error);
    return false;
  }
}

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  console.log('\nNew client connected');
  clients.add(ws);
  rl.prompt();

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('\nReceived:', data);
      
      // Auto-respond to pings
      if (data.type === 'PING') {
        ws.send(JSON.stringify({
          type: 'PONG',
          timestamp: Date.now()
        }));
      }
      
      // Handle database commands
      if (data.type === 'DB_COMMAND' && data.database === 'redis') {
        handleRedisClientCommand(ws, data);
      }
      
      // Handle broadcast requests
      if (data.type === 'BROADCAST') {
        // Add timestamp if not present
        if (!data.timestamp) {
          data.timestamp = Date.now();
        }
        
        // Broadcast to connected clients
        broadcastToClients(data);
        
        // Publish to Redis if enabled
        if (pubClient && pubClient.isOpen && data.useRedis !== false) {
          publishToRedis('websocket-broadcast', data);
        }
      }
      
      rl.prompt();
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('\nClient disconnected');
    clients.delete(ws);
    rl.prompt();
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('\nWebSocket error:', error);
    clients.delete(ws);
    rl.prompt();
  });
});

// Handle Redis commands from clients
async function handleRedisClientCommand(ws, data) {
  const { command, args = [] } = data;
  
  if (!command) {
    sendResponse(ws, { error: 'No command specified' });
    return;
  }
  
  if (!redisClient || !redisClient.isOpen) {
    sendResponse(ws, { error: 'Redis is not connected' });
    return;
  }
  
  try {
    const result = await executeRedisCommand(command, args);
    sendResponse(ws, result);
  } catch (error) {
    sendResponse(ws, { error: error.message });
  }
}

// Send response to client
function sendResponse(ws, data) {
  ws.send(JSON.stringify({
    type: 'DB_RESPONSE',
    database: 'redis',
    ...data,
    timestamp: Date.now()
  }));
}

// Handle server startup
wss.on('listening', () => {
  console.log(`WebSocket test server running on ws://localhost:${PORT}`);
  console.log('Type /help for available commands');
  
  // Auto-connect to Redis if specified in environment
  const redisEnv = process.env.REDIS_ENV || 'development';
  if (redisEnv) {
    console.log(`Auto-connecting to Redis using ${redisEnv} environment`);
    connectToRedis(redisEnv)
      .then(success => {
        if (success) {
          console.log(`Redis connection established (${redisEnv})`);
          setupRedisPubSub(redisEnv);
        }
      })
      .catch(err => console.error('Redis auto-connect failed:', err));
  }
  
  rl.prompt();
});

// Handle server errors
wss.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Handle readline input
rl.on('line', (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  switch (input) {
    case '/help':
      console.log('Available commands:');
      console.log('/help                - Show this help message');
      console.log('/clients             - List connected clients');
      console.log('/broadcast <message> - Send message to all clients');
      console.log('/redis:connect       - Connect to Redis (development)');
      console.log('/redis:connect:prod  - Connect to Redis (production)');
      console.log('/redis:connect:custom - Connect to Redis (custom config)');
      console.log('/redis:disconnect    - Disconnect from Redis');
      console.log('/redis:status        - Check Redis connection status');
      console.log('/redis:pubsub:setup  - Set up Redis pub/sub');
      console.log('/redis:publish <channel> <message> - Publish message to channel');
      console.log('/redis:get <key>     - Get value for key');
      console.log('/redis:set <key> <value> - Set value for key');
      console.log('/redis:del <key>     - Delete key');
      console.log('/redis:keys <pattern> - List keys matching pattern');
      console.log('/quit                - Stop the server');
      break;
    
    case '/clients':
      console.log(`Connected clients: ${clients.size}`);
      break;
    
    case '/redis:connect':
      connectToRedis('development')
        .then(() => console.log('Redis connection established'))
        .catch(err => console.error('Redis connection failed:', err));
      break;
    
    case '/redis:connect:prod':
      connectToRedis('production')
        .then(() => console.log('Redis connection established'))
        .catch(err => console.error('Redis connection failed:', err));
      break;
      
    case '/redis:connect:custom':
      connectToRedis('custom')
        .then(() => console.log('Redis connection established with custom config'))
        .catch(err => console.error('Redis connection failed:', err));
      break;
    
    case '/redis:disconnect':
      disconnectRedis()
        .then(() => console.log('Redis disconnected'))
        .catch(err => console.error('Redis disconnection failed:', err));
      break;
    
    case '/redis:status':
      if (redisClient) {
        console.log(`Redis connection status: ${redisClient.isOpen ? 'Connected' : 'Disconnected'}`);
      } else {
        console.log('Redis client not initialized');
      }
      
      if (pubClient && subClient) {
        console.log(`Redis pub/sub status: Pub ${pubClient.isOpen ? 'Connected' : 'Disconnected'}, Sub ${subClient.isOpen ? 'Connected' : 'Disconnected'}`);
      } else {
        console.log('Redis pub/sub not initialized');
      }
      break;
      
    case '/redis:pubsub:setup':
      setupRedisPubSub(process.env.REDIS_ENV || 'development')
        .then(() => console.log('Redis pub/sub setup complete'))
        .catch(err => console.error('Redis pub/sub setup failed:', err));
      break;
    
    case '/quit':
      console.log('Stopping server...');
      disconnectRedis()
        .then(() => {
          // Clean up pub/sub clients
          if (pubClient && pubClient.isOpen) pubClient.quit();
          if (subClient && subClient.isOpen) subClient.quit();
          
          wss.close();
          rl.close();
          process.exit(0);
        })
        .catch(() => {
          wss.close();
          rl.close();
          process.exit(1);
        });
      break;
    
    default:
      // Handle Redis commands
      if (input.startsWith('/redis:get ')) {
        const key = input.substring(11);
        if (redisClient && redisClient.isOpen) {
          redisClient.get(key)
            .then(value => console.log(`${key} => ${value || '(nil)'}`))
            .catch(err => console.error(`Error getting ${key}:`, err));
        } else {
          console.log('Redis is not connected');
        }
      } else if (input.startsWith('/redis:set ')) {
        const parts = input.substring(11).split(' ');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join(' ');
          if (redisClient && redisClient.isOpen) {
            redisClient.set(key, value)
              .then(() => console.log(`Set ${key} => ${value}`))
              .catch(err => console.error(`Error setting ${key}:`, err));
          } else {
            console.log('Redis is not connected');
          }
        } else {
          console.log('Usage: /redis:set <key> <value>');
        }
      } else if (input.startsWith('/redis:del ')) {
        const key = input.substring(11);
        if (redisClient && redisClient.isOpen) {
          redisClient.del(key)
            .then(count => console.log(`Deleted ${count} key(s)`))
            .catch(err => console.error(`Error deleting ${key}:`, err));
        } else {
          console.log('Redis is not connected');
        }
      } else if (input.startsWith('/redis:keys ')) {
        const pattern = input.substring(12);
        if (redisClient && redisClient.isOpen) {
          redisClient.keys(pattern)
            .then(keys => {
              console.log(`Keys matching ${pattern}:`);
              keys.forEach(key => console.log(` - ${key}`));
              if (keys.length === 0) {
                console.log(' (no keys found)');
              }
            })
            .catch(err => console.error(`Error getting keys with pattern ${pattern}:`, err));
        } else {
          console.log('Redis is not connected');
        }
      } else if (input.startsWith('/redis:publish ')) {
        const parts = input.substring(15).split(' ');
        if (parts.length >= 2) {
          const channel = parts[0];
          const message = parts.slice(1).join(' ');
          
          if (pubClient && pubClient.isOpen) {
            publishToRedis(channel, message)
              .then(() => console.log(`Published message to channel ${channel}`))
              .catch(err => console.error(`Error publishing to ${channel}:`, err));
          } else {
            console.log('Redis publish client is not connected');
          }
        } else {
          console.log('Usage: /redis:publish <channel> <message>');
        }
      } else if (input.startsWith('/broadcast ')) {
        const message = input.substring(11);
        const broadcastMessage = {
          type: 'BROADCAST',
          message,
          timestamp: Date.now()
        };
        
        broadcastToClients(broadcastMessage);
        
        // Also publish to Redis if pub/sub is set up
        if (pubClient && pubClient.isOpen) {
          publishToRedis('websocket-broadcast', broadcastMessage);
        }
      } else {
        console.log('Unknown command. Type /help for available commands.');
      }
  }
  
  rl.prompt();
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  disconnectRedis().finally(() => {
    // Clean up pub/sub clients
    if (pubClient && pubClient.isOpen) pubClient.quit();
    if (subClient && subClient.isOpen) subClient.quit();
    
    wss.close(() => process.exit(0));
  });
});
