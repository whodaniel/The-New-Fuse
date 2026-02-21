export interface RTCPeerConnectionConfig {
  iceServers?: unknown[]; // Changed from RTCIceServer[] to any[]
  iceTransportPolicy?: string; // Changed from RTCIceTransportPolicy to string
  bundlePolicy?: string; // Changed from RTCBundlePolicy to string
  rtcpMuxPolicy?: string; // Changed from RTCRtcpMuxPolicy to string
  certificates?: unknown[]; // Changed from RTCCertificate[] to any[]
  iceCandidatePoolSize?: number;
}

export interface RTCSessionDescription {
  type: string; // Changed from RTCSdpType to string
  sdp: string;
}

export interface RTCIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment: string | null;
}

export interface WebRTCConnection {
  peerConnection: unknown; // Changed from RTCPeerConnection to any
  dataChannel?: unknown; // Changed from RTCDataChannel to any
  createOffer(): Promise<RTCSessionDescription>;
  createAnswer(): Promise<RTCSessionDescription>;
  setLocalDescription(description: RTCSessionDescription): Promise<void>;
  setRemoteDescription(description: RTCSessionDescription): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
  close(): void;
}
