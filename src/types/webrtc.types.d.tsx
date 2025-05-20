export interface RTCPeerConnectionConfig {
  iceServers?: unknown[];
  iceTransportPolicy?: string;
  bundlePolicy?: string;
  rtcpMuxPolicy?: string;
  certificates?: unknown[];
  iceCandidatePoolSize?: number;
}
export interface RTCSessionDescription {
  type: string;
  sdp: string;
}
export interface RTCIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment: string | null;
}
export interface WebRTCConnection {
  peerConnection: unknown;
  dataChannel?: unknown;
  createOffer(): Promise<RTCSessionDescription>;
  createAnswer(): Promise<RTCSessionDescription>;
  setLocalDescription(description: RTCSessionDescription): Promise<void>;
  setRemoteDescription(description: RTCSessionDescription): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
  close(): void;
}
