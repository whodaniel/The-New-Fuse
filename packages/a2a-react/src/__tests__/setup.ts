// Mock WebSocket for testing
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening asynchronously
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
      
      // Send initial agents list
      setTimeout(() => {
        if (this.onmessage && this.readyState === 1) {
          this.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'agents',
              agents: []
            })
          }));
        }
      }, 5);
    }, 1);
  }

  send(data: string) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'send_message') {
        // Echo the message back for testing
        setTimeout(() => {
          if (this.onmessage && this.readyState === 1) {
            this.onmessage(new MessageEvent('message', {
              data: JSON.stringify({
                type: 'message',
                message: parsed.message
              })
            }));
          }
        }, 10);
      }
    } catch (error) {
      // Ignore parsing errors in tests
    }
  }

  close() {
    this.readyState = 3;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Set up global WebSocket mock
(global as any).WebSocket = MockWebSocket;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};