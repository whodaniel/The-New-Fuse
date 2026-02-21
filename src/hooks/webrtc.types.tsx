import React from "react";

export interface RTCParticipant {
  id: string;
  name: string;
  stream: MediaStream;
  isLocal: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export interface WebRTCState {
  localStream: MediaStream | null;
  participants: RTCParticipant[];
  isConnecting: boolean;
  error: Error | null | unknown;
}
