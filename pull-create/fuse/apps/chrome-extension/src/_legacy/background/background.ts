// The New Fuse Chrome Extension - Background Script v2.0
// TypeScript source for background service worker

class HybridBackground {
  private static instance: HybridBackground;
  private tnfSocket: WebSocket | null = null;
  private mcpSocket: WebSocket | null = null;
  private tnfStatus = { connected: false, aiSessionActive: false, messageCount: 0 };
  private mcpStatus = { connected: false, messageCount: 0 };
  private portStatuses: Record<number, boolean> = {};
  private reconnectAttempts = { tnf: 0, mcp: 0 };

  private constructor() {
    this.init();
  }

  public static getInstance() {
    if (!HybridBackground.instance) HybridBackground.instance = new HybridBackground();
    return HybridBackground.instance;
  }

  private async init() {
    chrome.alarms.create('keep-alive', { periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    this.connectToTnf();
    this.connectToMcp();
    this.checkAllPorts();
  }

  private connectToTnf() {
    chrome.storage.local.get(['tnfUrl'], ({ tnfUrl }) => {
      const url = tnfUrl || 'ws://localhost:3000';
      this.tnfSocket = new WebSocket(url);
      this.tnfSocket.onopen = () => {
        this.tnfStatus.connected = true;
        this.reconnectAttempts.tnf = 0;
        this.broadcastStatus();
      };
      this.tnfSocket.onclose = () => {
        this.tnfStatus.connected = false;
        this.scheduleReconnect('tnf');
        this.broadcastStatus();
      };
      this.tnfSocket.onmessage = () => {
        this.tnfStatus.messageCount++;
        this.broadcastStatus();
      };
      this.tnfSocket.onerror = () => {
        this.tnfStatus.connected = false;
        this.scheduleReconnect('tnf');
        this.broadcastStatus();
      };
    });
  }

  private connectToMcp() {
    // Similar logic as connectToTnf, with its own URL and status
  }

  private scheduleReconnect(type: 'tnf' | 'mcp') {
    this.reconnectAttempts[type]++;
    const delay = Math.min(60000, 1000 * Math.pow(2, this.reconnectAttempts[type]));
    setTimeout(() => {
      if (type === 'tnf') this.connectToTnf();
      else this.connectToMcp();
    }, delay);
  }

  private handleAlarm(alarm: chrome.alarms.Alarm) {
    if (alarm.name === 'keep-alive') {
      if (!this.tnfSocket || this.tnfSocket.readyState === WebSocket.CLOSED) this.connectToTnf();
      if (!this.mcpSocket || this.mcpSocket.readyState === WebSocket.CLOSED) this.connectToMcp();
      this.checkAllPorts();
    }
  }

  private async checkAllPorts() {
    chrome.storage.local.get(['portsToCheck'], async ({ portsToCheck }) => {
      const ports: number[] = portsToCheck || [3000, 5173, 8080];
      const statuses: Record<number, boolean> = {};
      await Promise.all(
        ports.map(async (port) => {
          try {
            await fetch(`http://localhost:${port}`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(1000),
            });
            statuses[port] = true;
          } catch {
            statuses[port] = false;
          }
        })
      );
      this.portStatuses = statuses;
      chrome.runtime.sendMessage({ type: 'PORT_STATUS_UPDATE', payload: statuses });
    });
  }

  private async executeNativeCommand(command: string, args: object): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendNativeMessage(
        'com.your_company.thenewfuse',
        { command, ...args },
        (response) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(response);
        }
      );
    });
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    switch (message.type) {
      case 'TNF_CONNECT':
        this.connectToTnf();
        sendResponse({ success: true });
        break;
      case 'MCP_CONNECT':
        this.connectToMcp();
        sendResponse({ success: true });
        break;
      case 'PORT_ADD':
        chrome.storage.local.get(['portsToCheck'], ({ portsToCheck }) => {
          const ports = portsToCheck || [];
          ports.push(message.port);
          chrome.storage.local.set({ portsToCheck: ports }, () => this.checkAllPorts());
        });
        sendResponse({ success: true });
        break;
      case 'NATIVE_COMMAND':
        this.executeNativeCommand(message.command, message.args).then(sendResponse);
        return true; // async
      default:
        break;
    }
    return false;
  }

  private broadcastStatus() {
    chrome.runtime.sendMessage({
      type: 'STATUS_UPDATE',
      payload: {
        tnf: this.tnfStatus,
        mcp: this.mcpStatus,
        ports: this.portStatuses,
      },
    });
  }
}

HybridBackground.getInstance();
