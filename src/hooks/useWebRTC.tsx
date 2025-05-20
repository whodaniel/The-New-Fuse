import { useState, useCallback, useEffect, useRef } from "react";
import { useWebSocket } from './useWebSocket.js';

interface RTCParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  connection?: RTCPeerConnection;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isLocal: boolean;
}

interface WebRTCState {
  localStream: MediaStream | null;
  participants: RTCParticipant[];
  isConnecting: boolean;
  error: Error | null;
}

interface RTCConfig {
  iceServers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}

const DEFAULT_RTC_CONFIG: RTCConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

export const useWebRTC = (roomId?: string) => {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    participants: [],
    isConnecting: false,
    error: null,
  });

  const { socket, isConnected } = useWebSocket();
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Initialize media (camera/microphone)
  const initializeMedia = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setState((prev) => ({
        ...prev,
        localStream: stream,
        participants: [
          ...prev.participants, 
          {
            id: "local",
            name: "You",
            stream,
            isLocal: true,
            videoRef: { current: null },
          },
        ],
        isConnecting: false,
      }));

      return stream;
    } catch(error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isConnecting: false,
      }));
      throw error;
    }
  };

  // Create a peer connection for a participant
  const createPeerConnection = useCallback(
    (participantId: string, isInitiator: boolean): RTCPeerConnection => {
      const peerConnection = new RTCPeerConnection(DEFAULT_RTC_CONFIG);
      
      peerConnections.current.set(participantId, peerConnection);

      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, state.localStream!);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("webrtc_ice_candidate", {
            roomId,
            participantId,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        setState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participantId
              ? { ...p, stream: event.streams[0] }
              : p,
          ),
        }));
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        switch(peerConnection.connectionState) {
          case "disconnected":
          case "failed":
            handleParticipantDisconnect(participantId);
            break;
        }
      };

      return peerConnection;
    },
    [roomId, socket, state.localStream]
  );

  // Handle participant disconnect
  const handleParticipantDisconnect = useCallback((participantId: string) => {
    const connection = peerConnections.current.get(participantId);
    if (connection) {
      connection.close();
      peerConnections.current.delete(participantId);
    }

    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter(
        (p) => p.id !== participantId,
      ),
    }));
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.on("webrtc_offer", async ({ participantId, offer, name }) => {
      const peerConnection = createPeerConnection(participantId, false);
      
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      
      setState((prev) => ({
        ...prev,
        participants: [
          ...prev.participants,
          {
            id: participantId,
            name,
            isLocal: false,
            videoRef: { current: null },
          },
        ],
      }));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("webrtc_answer", {
        roomId,
        participantId,
        answer,
      });
    });

    socket.on("webrtc_answer", async ({ participantId, answer }) => {
      const peerConnection = peerConnections.current.get(
        participantId
      );
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on(
      "webrtc_ice_candidate",
      async ({ participantId, candidate }) => {
        const peerConnection = peerConnections.current.get(
          participantId
        );
        if (peerConnection) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      }
    );

    socket.on(
      "participant_joined",
      async ({ participantId, name }) => {
        const peerConnection = createPeerConnection(participantId, true);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("webrtc_offer", {
          roomId,
          participantId,
          offer,
        });

        setState((prev) => ({
          ...prev,
          participants: [
            ...prev.participants,
            {
              id: participantId,
              name,
              isLocal: false,
              videoRef: { current: null },
            },
          ],
        }));
      }
    );

    socket.on("participant_left", ({ participantId }) => {
      handleParticipantDisconnect(participantId);
    });

    return () => {
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
      socket.off("participant_joined");
      socket.off("participant_left");
    };
  }, [roomId, isConnected, createPeerConnection, handleParticipantDisconnect, socket]);

  // Start a call
  const startCall = useCallback(async (): Promise<MediaStream | void> => {
    if (!roomId || !isConnected) {
      throw new Error("Room ID and WebSocket connection are required");
    }

    setState((prev) => ({ ...prev, isConnecting: true }));
    
    try {
      const stream = await initializeMedia();
      socket?.emit("join_room", { roomId });
      return stream;
    } catch(error: unknown) {
      setState((prev) => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error(String(error)), 
        isConnecting: false 
      }));
      throw error;
    }
  }, [roomId, isConnected, socket]);

  // End a call
  const endCall = useCallback(async (): Promise<void> => {
    // Close all peer connections
    peerConnections.current.forEach((connection) => {
      connection.close();
    });
    peerConnections.current.clear();

    // Stop local media tracks
    state.localStream?.getTracks().forEach((track) => {
      track.stop();
    });

    // Leave the room
    socket?.emit("leave_room", { roomId });

    setState((prev) => ({
      ...prev,
      localStream: null,
      participants: [],
    }));
  }, [state.localStream, socket, roomId]);

  return {
    ...state,
    startCall,
    endCall,
  };
};
