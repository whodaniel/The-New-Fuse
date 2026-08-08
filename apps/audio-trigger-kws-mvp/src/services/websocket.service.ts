import WebSocket from 'ws';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelayMs = 5000;
  private readonly maxReconnectDelayMs = 60000;

  constructor(url: string = 'ws://127.0.0.1:3000/ws') {
    this.url = url;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.ws = new WebSocket(this.url);
    
    this.ws.on('open', () => {
      console.log('[KWS-WS] Connected to TNF Relay');
      this.reconnectDelayMs = 5000;
      this.register();
    });

    this.ws.on('error', (err) => {
      console.error('[KWS-WS] WebSocket error:', err.message);
    });

    this.ws.on('close', () => {
      const delay = this.reconnectDelayMs;
      console.log(`[KWS-WS] Disconnected from TNF Relay. Retrying in ${Math.round(delay / 1000)}s...`);
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, this.maxReconnectDelayMs);
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    });
  }

  private register() {
    if (!this.ws) return;
    this.ws.send(JSON.stringify({
      type: 'REGISTER',
      payload: {
        type: 'audio_trigger_kws',
        capabilities: ['speech_processing', 'keyword_spotting']
      }
    }));
  }

  broadcast(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'BROADCAST',
      payload: payload
    }));
  }
}
