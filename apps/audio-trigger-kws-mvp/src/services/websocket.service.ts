import WebSocket from 'ws';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(url: string = 'ws://localhost:3000') {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.on('open', () => {
      console.log('[KWS-WS] Connected to TNF Relay');
      this.register();
    });

    this.ws.on('error', (err) => {
      console.error('[KWS-WS] WebSocket error:', err.message);
    });

    this.ws.on('close', () => {
      console.log('[KWS-WS] Disconnected from TNF Relay. Retrying in 5s...');
      setTimeout(() => this.connect(), 5000);
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
