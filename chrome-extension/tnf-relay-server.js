/**
 * TNF Relay WebSocket Server
 * Embedded server that can be started directly from the Chrome extension
 */

class TNFRelayServer {
  constructor() {
    this.server = null;
    this.wss = null;
    this.port = 3001;
    this.isRunning = false;
    this.connectedClients = new Map();
    this.agentGroups = {
      'a': { name: 'Group A', agents: [], color: '#ff6b6b' },
      'b': { name: 'Group B', agents: [], color: '#4ecdc4' },
      'c': { name: 'Group C', agents: [], color: '#45b7d1' },
      'd': { name: 'Group D', agents: [], color: '#f9ca24' },
      'e': { name: 'Group E', agents: [], color: '#6c5ce7' }
    };
    this.masterAgents = new Map();
    this.messageQueue = [];
  }

  async start(port = 3001) {
    if (this.isRunning) {
      console.log('🟡 Server already running on port', this.port);
      return { success: true, message: 'Server already running', port: this.port };
    }

    try {
      this.port = port;
      
      // Import WebSocket library dynamically
      const WebSocket = await import('ws');
      
      // Clear any existing server on this port
      await this.clearPort(port);
      
      this.wss = new WebSocket.WebSocketServer({ port: this.port });
      
      this.wss.on('connection', (ws, request) => {
        this.handleConnection(ws, request);
      });
      
      this.wss.on('error', (error) => {
        console.error('❌ WebSocket server error:', error);
        this.isRunning = false;
      });
      
      this.isRunning = true;
      console.log(`✅ TNF Relay Server started on port ${this.port}`);
      
      return { 
        success: true, 
        message: `Server started on port ${this.port}`, 
        port: this.port,
        connectedClients: 0
      };
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async stop() {
    if (!this.isRunning) {
      return { success: true, message: 'Server not running' };
    }

    try {
      if (this.wss) {
        // Close all client connections
        this.connectedClients.forEach((client, id) => {
          client.ws.close();
        });
        this.connectedClients.clear();
        
        // Close the server
        this.wss.close();
        this.wss = null;
      }
      
      this.isRunning = false;
      console.log('🛑 TNF Relay Server stopped');
      
      return { success: true, message: 'Server stopped' };
      
    } catch (error) {
      console.error('❌ Failed to stop server:', error);
      return { success: false, error: error.message };
    }
  }

  async restart(port = 3001) {
    console.log('🔄 Restarting TNF Relay Server...');
    
    const stopResult = await this.stop();
    if (!stopResult.success) {
      return stopResult;
    }
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.start(port);
  }

  async clearPort(port) {
    return new Promise((resolve) => {
      const testServer = require('net').createServer();
      testServer.listen(port, () => {
        testServer.close(() => resolve());
      });
      testServer.on('error', () => resolve()); // Port already clear
    });
  }

  async clearBusyPorts(ports = [3001, 3002, 3003, 3004, 3005]) {
    const clearedPorts = [];
    
    for (const port of ports) {
      try {
        await this.clearPort(port);
        clearedPorts.push(port);
      } catch (error) {
        console.log(`Port ${port} couldn't be cleared:`, error.message);
      }
    }
    
    return { 
      success: true, 
      clearedPorts, 
      message: `Cleared ${clearedPorts.length} ports` 
    };
  }

  handleConnection(ws, request) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientInfo = {
      id: clientId,
      ws: ws,
      connectedAt: new Date().toISOString(),
      group: null,
      agentType: 'unknown',
      metadata: {}
    };
    
    this.connectedClients.set(clientId, clientInfo);
    console.log(`📲 Client connected: ${clientId} (${this.connectedClients.size} total)`);
    
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });
    
    ws.on('close', () => {
      this.connectedClients.delete(clientId);
      console.log(`📴 Client disconnected: ${clientId} (${this.connectedClients.size} total)`);
    });
    
    ws.on('error', (error) => {
      console.error(`❌ Client error ${clientId}:`, error);
    });
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'WELCOME',
      clientId: clientId,
      serverInfo: {
        version: '1.0.0',
        groups: Object.keys(this.agentGroups),
        connectedClients: this.connectedClients.size
      }
    });
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📩 Message from ${clientId}:`, message.type);
      
      const client = this.connectedClients.get(clientId);
      if (!client) return;
      
      switch (message.type) {
        case 'REGISTER':
          this.handleAgentRegistration(clientId, message);
          break;
          
        case 'JOIN_GROUP':
          this.handleGroupJoin(clientId, message);
          break;
          
        case 'AI_AUTOMATION_REQUEST':
          this.handleAIAutomation(clientId, message);
          break;
          
        case 'WEB_AI_RESPONSE':
          this.handleAIResponse(clientId, message);
          break;
          
        case 'ROUTE_TO_GROUP':
          this.routeToGroup(message.group, message.payload);
          break;
          
        default:
          this.broadcastMessage(message, clientId);
          break;
      }
      
    } catch (error) {
      console.error(`❌ Error handling message from ${clientId}:`, error);
    }
  }

  handleAgentRegistration(clientId, message) {
    const client = this.connectedClients.get(clientId);
    if (!client) return;
    
    client.agentType = message.payload?.type || 'WEB_BRIDGE';
    client.metadata = {
      ...client.metadata,
      ...message.payload?.metadata,
      name: message.payload?.name || `Agent ${clientId}`,
      capabilities: message.payload?.capabilities || []
    };
    
    console.log(`🤖 Agent registered: ${client.metadata.name} (${client.agentType})`);
    
    // If this is a master agent, register it
    if (client.agentType === 'MASTER_AGENT') {
      this.masterAgents.set(clientId, {
        id: clientId,
        name: client.metadata.name,
        group: client.group,
        capabilities: client.metadata.capabilities
      });
    }
    
    this.sendToClient(clientId, {
      type: 'REGISTRATION_CONFIRMED',
      agentId: clientId,
      assignedGroup: client.group,
      availableGroups: Object.keys(this.agentGroups)
    });
  }

  handleGroupJoin(clientId, message) {
    const client = this.connectedClients.get(clientId);
    const groupId = message.group;
    
    if (!client || !this.agentGroups[groupId]) {
      this.sendToClient(clientId, {
        type: 'GROUP_JOIN_FAILED',
        error: 'Invalid group'
      });
      return;
    }
    
    // Remove from previous group
    if (client.group) {
      const prevGroup = this.agentGroups[client.group];
      prevGroup.agents = prevGroup.agents.filter(a => a.id !== clientId);
    }
    
    // Add to new group
    client.group = groupId;
    this.agentGroups[groupId].agents.push({
      id: clientId,
      name: client.metadata.name || clientId,
      type: client.agentType,
      connectedAt: client.connectedAt
    });
    
    console.log(`🏷️ Agent ${clientId} joined group ${groupId}`);
    
    this.sendToClient(clientId, {
      type: 'GROUP_JOINED',
      group: groupId,
      groupInfo: this.agentGroups[groupId]
    });
    
    // Notify other group members
    this.routeToGroup(groupId, {
      type: 'AGENT_JOINED_GROUP',
      agent: {
        id: clientId,
        name: client.metadata.name,
        type: client.agentType
      }
    }, clientId);
  }

  handleAIAutomation(clientId, message) {
    console.log(`🤖 AI Automation request from ${clientId}`);
    
    // Route to specific group if specified
    if (message.targetGroup) {
      this.routeToGroup(message.targetGroup, message, clientId);
    } else {
      // Broadcast to all web bridges
      this.broadcastToAgentType('WEB_BRIDGE', message, clientId);
    }
  }

  handleAIResponse(clientId, message) {
    console.log(`💬 AI Response from ${clientId}`);
    
    const client = this.connectedClients.get(clientId);
    
    // Send to group if agent is in one
    if (client?.group) {
      this.routeToGroup(client.group, message, clientId);
    } else {
      // Broadcast to all
      this.broadcastMessage(message, clientId);
    }
  }

  routeToGroup(groupId, message, excludeClientId = null) {
    const group = this.agentGroups[groupId];
    if (!group) return;
    
    group.agents.forEach(agent => {
      if (agent.id !== excludeClientId) {
        this.sendToClient(agent.id, {
          ...message,
          routedBy: 'group',
          sourceGroup: groupId
        });
      }
    });
  }

  broadcastToAgentType(agentType, message, excludeClientId = null) {
    this.connectedClients.forEach((client, clientId) => {
      if (client.agentType === agentType && clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  broadcastMessage(message, excludeClientId = null) {
    this.connectedClients.forEach((client, clientId) => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  sendToClient(clientId, message) {
    const client = this.connectedClients.get(clientId);
    if (!client || client.ws.readyState !== 1) return; // 1 = OPEN
    
    try {
      client.ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        serverId: 'tnf-relay'
      }));
    } catch (error) {
      console.error(`❌ Failed to send to ${clientId}:`, error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      connectedClients: this.connectedClients.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      groups: Object.fromEntries(
        Object.entries(this.agentGroups).map(([id, group]) => [
          id, 
          { ...group, agentCount: group.agents.length }
        ])
      ),
      masterAgents: Array.from(this.masterAgents.values())
    };
  }
}

// Global server instance
window.tnfRelayServer = new TNFRelayServer();

// Export for CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TNFRelayServer;
}