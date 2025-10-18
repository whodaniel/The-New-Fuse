/**
 * TNF WebSocket Monitor
 * Real-time WebSocket connection monitoring
 */

class WebSocketMonitor {
  constructor(url = 'ws://localhost:3001/ws') {
    this.url = url;
    this.ws = null;
    this.messageLog = [];
    this.stats = {
      sent: 0,
      received: 0,
      errors: 0,
      reconnects: 0
    };
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;
  }

  connect() {
    console.log(`🔌 Connecting to ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('%c✓ WebSocket Connected', 'color: green; font-weight: bold;');
      this.displayStatus();
    };

    this.ws.onmessage = (event) => {
      this.stats.received++;
      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }

      this.messageLog.push({
        type: 'received',
        timestamp: new Date().toISOString(),
        data
      });

      console.group(`📨 Message Received (#${this.stats.received})`);
      console.log('Timestamp:', new Date().toLocaleTimeString());
      console.log('Data:', data);
      console.groupEnd();

      // Keep log size manageable
      if (this.messageLog.length > 100) {
        this.messageLog.shift();
      }
    };

    this.ws.onerror = (error) => {
      this.stats.errors++;
      console.error('✗ WebSocket Error:', error);
      this.displayStatus();
    };

    this.ws.onclose = (event) => {
      console.warn(`✗ WebSocket Closed: ${event.code} - ${event.reason}`);
      this.displayStatus();

      if (this.shouldReconnect) {
        console.log(`🔄 Reconnecting in ${this.reconnectInterval / 1000}s...`);
        setTimeout(() => {
          this.stats.reconnects++;
          this.connect();
        }, this.reconnectInterval);
      }
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.stats.sent++;
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(payload);

      this.messageLog.push({
        type: 'sent',
        timestamp: new Date().toISOString(),
        data
      });

      console.group(`📤 Message Sent (#${this.stats.sent})`);
      console.log('Timestamp:', new Date().toLocaleTimeString());
      console.log('Data:', data);
      console.groupEnd();
    } else {
      console.error('✗ WebSocket not connected. State:', ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][this.ws?.readyState || 3]);
    }
  }

  displayStatus() {
    const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    console.group('📊 WebSocket Status');
    console.table({
      'Connection State': stateNames[this.ws?.readyState || 3],
      'Messages Sent': this.stats.sent,
      'Messages Received': this.stats.received,
      'Errors': this.stats.errors,
      'Reconnects': this.stats.reconnects
    });
    console.groupEnd();
  }

  getLog(filter) {
    if (!filter) return this.messageLog;

    return this.messageLog.filter(msg => {
      if (filter.type && msg.type !== filter.type) return false;
      if (filter.after && new Date(msg.timestamp) < new Date(filter.after)) return false;
      return true;
    });
  }

  clearLog() {
    this.messageLog = [];
    console.log('✓ Message log cleared');
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
    console.log('✓ WebSocket disconnected');
  }

  resetStats() {
    this.stats = {
      sent: 0,
      received: 0,
      errors: 0,
      reconnects: 0
    };
    console.log('✓ Stats reset');
  }
}

// Auto-initialize
const wsMonitor = new WebSocketMonitor();
wsMonitor.connect();

// Display help
console.log('%cWebSocket Monitor Ready', 'color: blue; font-size: 14px; font-weight: bold;');
console.log('Available commands:');
console.log('  wsMonitor.send({ type: "TEST", data: "Hello" })  - Send message');
console.log('  wsMonitor.displayStatus()                        - Show status');
console.log('  wsMonitor.getLog()                               - Get message log');
console.log('  wsMonitor.getLog({ type: "received" })           - Filter by type');
console.log('  wsMonitor.clearLog()                             - Clear log');
console.log('  wsMonitor.resetStats()                           - Reset statistics');
console.log('  wsMonitor.disconnect()                           - Disconnect');
console.log('  wsMonitor.connect()                              - Reconnect');

// Return for access
window.wsMonitor = wsMonitor;
