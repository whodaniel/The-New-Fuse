"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCService = void 0;
const events_1 = require("events");
class WebRTCService extends events_1.EventEmitter {
    config;
    ws = null;
    peerConnection = null;
    localStream = null;
    isConnected = false;
    isStreaming = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    constructor(config) {
        super();
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            ...config
        };
    }
    async connect() {
        try {
            await this.connectWebSocket();
            await this.setupPeerConnection();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        }
        catch (error) {
            console.error('WebRTC connection failed:', error);
            this.scheduleReconnect();
            throw error;
        }
    }
    async disconnect() {
        this.cleanup();
        this.isConnected = false;
        this.emit('disconnected');
    }
    async startDesktopStreaming(options) {
        if (!this.isConnected) {
            throw new Error('WebRTC service not connected');
        }
        try {
            // Get appropriate media stream based on platform
            this.localStream = await this.getMediaStream(options);
            if (!this.localStream) {
                throw new Error('Failed to get media stream');
            }
            // Add stream to peer connection
            if (this.peerConnection) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            // Create and send offer
            await this.createAndSendOffer();
            this.isStreaming = true;
            this.emit('streaming-started', this.getStreamingSource(options));
        }
        catch (error) {
            console.error('Failed to start desktop streaming:', error);
            throw error;
        }
    }
    async stopStreaming() {
        if (!this.isStreaming)
            return;
        try {
            // Stop all tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                this.localStream = null;
            }
            // Remove tracks from peer connection
            if (this.peerConnection) {
                this.peerConnection.getSenders().forEach(sender => {
                    if (sender.track) {
                        this.peerConnection.removeTrack(sender);
                    }
                });
            }
            this.isStreaming = false;
            this.emit('streaming-stopped');
        }
        catch (error) {
            console.error('Failed to stop streaming:', error);
            throw error;
        }
    }
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.config.signalingServer);
                this.ws.onopen = () => {
                    console.log('WebSocket connected to signaling server');
                    // Identify platform and capabilities
                    this.sendSignalingMessage({
                        type: 'identify',
                        platform: this.config.platform,
                        capabilities: this.getPlatformCapabilities()
                    });
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    this.handleSignalingMessage(JSON.parse(event.data));
                };
                this.ws.onclose = () => {
                    console.log('WebSocket connection closed');
                    this.isConnected = false;
                    this.emit('disconnected');
                    this.scheduleReconnect();
                };
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
                // Connection timeout
                setTimeout(() => {
                    if (this.ws?.readyState !== WebSocket.OPEN) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async setupPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.config.iceServers
        });
        // Set up event handlers
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            console.log('Peer connection state:', state);
            if (state === 'connected') {
                this.emit('peer-connected');
            }
            else if (state === 'disconnected' || state === 'failed') {
                this.emit('peer-disconnected');
                this.scheduleReconnect();
            }
        };
        this.peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            channel.onopen = () => console.log('Data channel opened');
            channel.onmessage = (event) => {
                this.emit('data-received', event.data);
            };
        };
    }
    async getMediaStream(options) {
        try {
            switch (this.config.platform) {
                case 'web':
                    return await this.getWebMediaStream(options);
                case 'electron':
                    return await this.getElectronMediaStream(options);
                case 'vscode':
                    return await this.getVSCodeMediaStream(options);
                case 'chrome':
                    return await this.getChromeMediaStream(options);
                default:
                    throw new Error(`Unsupported platform: ${this.config.platform});
      }
    } catch (error) {
      console.error('Failed to get media stream:', error);
      return null;
    }
  }

  private async getWebMediaStream(options: StreamingOptions): Promise<MediaStream> {
    const constraints: any = {
      video: options.video ? {
        frameRate: options.frameRate || 30,
        width: this.getResolutionConstraints(options.resolution).width,
        height: this.getResolutionConstraints(options.resolution).height
      } : false,
      audio: options.audio
    };

    // Try to get desktop stream first
    try {
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    } catch {
      // Fallback to camera if display media fails
      return await navigator.mediaDevices.getUserMedia(constraints);
    }
  }

  private async getElectronMediaStream(options: StreamingOptions): Promise<MediaStream> {
    // Electron's desktopCapturer API would be used here
    // For now, simulate with regular display media
    return await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: options.frameRate || 30,
        ...this.getResolutionConstraints(options.resolution)
      },
      audio: options.audio
    });
  }

  private async getVSCodeMediaStream(options: StreamingOptions): Promise<MediaStream> {
    // VSCode would use workspace/file streaming
    // For now, simulate with desktop capture
    return await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: options.frameRate || 30,
        ...this.getResolutionConstraints(options.resolution)
      },
      audio: false // VSCode typically doesn't need audio
    });
  }

  private async getChromeMediaStream(options: StreamingOptions): Promise<MediaStream> {
    // Chrome extension would use tabCapture or desktopCapture APIs
    // For now, simulate with display media
    return await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: options.frameRate || 30,
        ...this.getResolutionConstraints(options.resolution)
      },
      audio: options.audio
    });
  }

  private getResolutionConstraints(resolution?: string) {
    switch (resolution) {
      case 'low':
        return { width: 640, height: 480 };
      case 'medium':
        return { width: 1280, height: 720 };
      case 'high':
        return { width: 1920, height: 1080 };
      default:
        return { width: 1280, height: 720 };
    }
  }

  private getPlatformCapabilities(): string[] {
    const base = ['webrtc', 'streaming'];
    
    switch (this.config.platform) {
      case 'web':
        return [...base, 'desktop-capture', 'camera-capture'];
      case 'electron':
        return [...base, 'desktop-capture', 'application-capture', 'native-integration'];
      case 'vscode':
        return [...base, 'workspace-capture', 'file-capture', 'editor-integration'];
      case 'chrome':
        return [...base, 'tab-capture', 'page-capture', 'cross-origin'];
      default:
        return base;
    }
  }

  private getStreamingSource(options: StreamingOptions): string {
    switch (this.config.platform) {
      case 'chrome':
        return 'tab';
      case 'vscode':
        return 'workspace';
      case 'electron':
        return 'desktop';
      default:
        return 'screen';
    }
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    try {
      switch (message.type) {
        case 'offer':
          await this.handleOffer(message.offer);
          break;
        case 'answer':
          await this.handleAnswer(message.answer);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message.candidate);
          break;
        case 'streaming-request':
          await this.handleStreamingRequest(message);
          break;
        case 'analysis-request':
          this.emit('analysis-request', message);
          break;
        default:
          console.log('Unknown signaling message:', message.type);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    this.sendSignalingMessage({
      type: 'answer',
      answer: answer
    });
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(answer);
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(candidate);
  }

  private async handleStreamingRequest(message: any): Promise<void> {
    try {
      await this.startDesktopStreaming({
        video: true,
        audio: message.options?.audio || false,
        frameRate: message.options?.frameRate || 30,
        resolution: message.options?.resolution || 'medium'
      });
      
      this.sendSignalingMessage({
        type: 'streaming-response',
        requestId: message.requestId,
        success: true
      });
    } catch (error) {
      this.sendSignalingMessage({
        type: 'streaming-response',
        requestId: message.requestId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private sendSignalingMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        platform: this.config.platform,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection-failed');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    this.reconnectAttempts++;

    setTimeout(async () => {`, console.log(`Attempting to reconnect (${this.reconnectAttempts}` / $, { this: .maxReconnectAttempts }) `);
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  private cleanup(): void {
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.isStreaming = false;
  }

  // Public getters
  get connected(): boolean {
    return this.isConnected;
  }

  get streaming(): boolean {
    return this.isStreaming;
  }

  get connectionState(): string {
    return this.peerConnection?.connectionState || 'closed';
  }
});
            }
        }
        finally { }
    }
}
exports.WebRTCService = WebRTCService;
//# sourceMappingURL=WebRTCService.js.map