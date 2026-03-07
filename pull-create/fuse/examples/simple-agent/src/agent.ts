import WebSocket from 'ws';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  MCPMessage,
  MCPRequest,
  MCPResponse,
  MCPError,
  AgentStatus,
  Agent,
  parseMCPMessage,
  createMCPRequest,
} from '@the-new-fuse/types';

// Load environment variables from .env file
dotenv.config();

const MCP_REGISTRY_URL = process.env.MCP_REGISTRY_URL || 'ws://localhost:3002';
const AGENT_NAME = process.env.AGENT_NAME || `SimpleAgent-${uuidv4()}`;
const AGENT_TYPE = process.env.AGENT_TYPE || 'Example';
const AGENT_METADATA_JSON = process.env.AGENT_METADATA;

let agentMetadata: Record<string, any> | undefined;
if (AGENT_METADATA_JSON) {
  try {
    agentMetadata = JSON.parse(AGENT_METADATA_JSON);
  } catch (e) {
    console.error('Failed to parse AGENT_METADATA JSON:', e);
  }
}

console.log(`Starting Simple Agent: ${AGENT_NAME} (Type: ${AGENT_TYPE})`);
console.log(`Connecting to MCP Registry: ${MCP_REGISTRY_URL}`);

let ws: WebSocket | null = null;
let agentId: string | null = null; // Will store the ID received from registration
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Store pending requests to match responses
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('Already connected or connecting.');
    return;
  }

  connectionAttempts++;
  console.log(`Attempting connection ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);
  ws = new WebSocket(MCP_REGISTRY_URL);

  ws.on('open', async () => {
    console.log('Connected to MCP Registry.');
    connectionAttempts = 0; // Reset attempts on successful connection
    try {
      await registerAndActivate();
    } catch (error) {
      console.error('Failed during registration/activation:', error);
      // Consider closing connection or retrying registration
    }
  });

  ws.on('message', (data: Buffer) => {
    const messageString = data.toString();
    console.debug('Received message:', messageString);
    const message = parseMCPMessage(messageString);

    if (!message) {
      console.warn('Received invalid MCP message format.');
      return;
    }

    const pending = pendingRequests.get(message.id);
    if (pending) {
      if (message.type === 'response') {
        pending.resolve(message.result);
      } else if (message.type === 'error') {
        pending.reject(new Error(message.error || 'Unknown MCP error'));
      }
      pendingRequests.delete(message.id);
    } else {
      console.warn(`Received message with unknown ID: ${message.id}`);
      // Handle unsolicited messages if necessary
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`Disconnected from MCP Registry. Code: ${code}, Reason: ${reason?.toString()}`);
    ws = null;
    agentId = null; // Reset agent ID on disconnect
    pendingRequests.clear(); // Clear pending requests

    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
      setTimeout(connect, RETRY_DELAY);
    } else {
      console.error('Max connection attempts reached. Exiting.');
      process.exit(1); // Or handle differently
    }
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error.message);
    // The 'close' event will usually follow, triggering reconnection logic
    if (ws && ws.readyState !== WebSocket.OPEN) {
       // If error occurred before 'open', trigger retry logic if not already handled by 'close'
       if (connectionAttempts < MAX_CONNECTION_ATTEMPTS && !ws.listeners('close').length) {
         console.log(`Retrying connection due to error in ${RETRY_DELAY / 1000} seconds...`);
         setTimeout(connect, RETRY_DELAY);
       } else if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
         console.error('Max connection attempts reached after error. Exiting.');
         process.exit(1);
       }
    }
  });
}

// Function to send an MCP request and return a promise
function sendRequest<T = any>(toolName: string, params: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket is not connected.'));
    }

    const requestId = uuidv4();
    const request = createMCPRequest(requestId, toolName, params);

    pendingRequests.set(requestId, { resolve, reject });
    console.debug(`Sending request (ID: ${requestId}): ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));

    // Optional: Timeout for requests
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Request ${requestId} (${toolName}) timed out.`));
      }
    }, 30000); // 30 second timeout
  });
}

// Startup sequence
async function registerAndActivate() {
  console.log('Registering agent...');
  try {
    const registrationParams = {
      name: AGENT_NAME,
      type: AGENT_TYPE,
      ...(agentMetadata && { metadata: agentMetadata }),
    };
    const registeredAgent = await sendRequest<Agent>('registerAgent', registrationParams);
    agentId = registeredAgent.id;
    console.log(`Agent registered successfully with ID: ${agentId}`);

    console.log('Activating agent...');
    await sendRequest('updateAgentStatus', { agentId: agentId, status: AgentStatus.ACTIVE });
    console.log('Agent activated.');

    // Agent is now registered and active. Add any further agent logic here.
    // For this example, we just keep it running.

  } catch (error) {
    console.error('Registration or activation failed:', error);
    // Handle specific errors, e.g., maybe agent already exists?
    // If error suggests agent exists, try findAgents to get ID? (More complex logic)
    throw error; // Re-throw to be caught by the caller in 'open' handler
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down agent...');
  if (ws && ws.readyState === WebSocket.OPEN && agentId) {
    try {
      console.log('Setting status to INACTIVE...');
      // Send update status but don't wait indefinitely for response during shutdown
      sendRequest('updateAgentStatus', { agentId: agentId, status: AgentStatus.INACTIVE })
        .catch(err => console.warn('Failed to send INACTIVE status on shutdown:', err.message)); // Log error but don't block shutdown

      // Allow a brief moment for the message to be sent
      await new Promise(resolve => setTimeout(resolve, 200));

    } finally {
      ws.close(1000, 'Agent shutting down gracefully'); // 1000 is normal closure
      ws = null;
    }
  } else if (ws) {
    ws.close(1000, 'Agent shutting down');
    ws = null;
  }
  console.log('Agent shutdown complete.');
  process.exit(0);
}

// Handle SIGINT (Ctrl+C) and SIGTERM for graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the connection process
connect();

// Keep the process running (e.g., for a server agent)
// For a simple script, this might exit if there's nothing else keeping it alive.
// We rely on the WebSocket connection and setTimeout for retries to keep it running.
console.log('Agent process running. Press Ctrl+C to exit.');
