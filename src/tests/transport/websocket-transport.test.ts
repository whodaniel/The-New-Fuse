import { WebSocketTransport } from '../../transport/websocket-transport.js';
import { TransportMessage } from '../../transport/transport-interface.js';
import * as WebSocket from 'ws';

jest.mock('ws');

describe('WebSocketTransport', () => {
    let transport: WebSocketTransport;
    const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
        readyState: WebSocket.OPEN
    };

    beforeEach(() => {
        (WebSocket as jest.Mock).mockImplementation(() => mockWs);
        transport = new WebSocketTransport('ws://test');
    });

    test('reconnects on connection failure', async () => {
        mockWs.on.mockImplementation((event, cb) => {
            if (event === 'error') cb(new Error('Connection failed'));
        });
        
        await expect(transport.initialize()).rejects.toThrow('Max reconnection attempts reached');
        expect(WebSocket).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });
});
