import { EventEmitter } from 'events';
export interface WebRTCConfig {
    signalingServer: string;
    platform: 'web' | 'electron' | 'vscode' | 'chrome';
    iceServers?: RTCIceServer[];
}
export interface StreamingOptions {
    video: boolean;
    audio: boolean;
    frameRate?: number;
    resolution?: 'low' | 'medium' | 'high';
    quality?: number;
}
export declare class WebRTCService extends EventEmitter {
    private config;
    private ws;
    private peerConnection;
    private localStream;
    private isConnected;
    private isStreaming;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(config: WebRTCConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    startDesktopStreaming(options: StreamingOptions): Promise<void>;
    stopStreaming(): Promise<void>;
    private connectWebSocket;
    private setupPeerConnection;
    private getMediaStream;
}
//# sourceMappingURL=WebRTCService.d.ts.map