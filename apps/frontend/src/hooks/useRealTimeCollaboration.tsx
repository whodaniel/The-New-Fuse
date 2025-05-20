import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import type { WorkflowState, Collaborator } from '../types/workflow.js';

export const useRealTimeCollaboration = (): any => {
  const workflowId = useSelector((state: WorkflowState) => state.workflow.id);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL, {
      query: { workflowId },
    });

    newSocket.on('collaborator_joined', (collaborator: Collaborator) => {
      setCollaborators((prev: any) => [...prev, collaborator]);
    });

    newSocket.on('collaborator_left', (collaboratorId: string) => {
      setCollaborators((prev: any) => prev.filter(c => c.id !== collaboratorId));
    });

    newSocket.on('collaborator_moved', (data: { id: string; position: { x: number; y: number } }) => {
      setCollaborators((prev: any) =>
        prev.map(c =>
          c.id === data.id ? { ...c, position: data.position } : c
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [workflowId]);

  const onUserAction = useCallback(
    (action: string, data: any) => {
      if (socket) {
        socket.emit('user_action', { action, data });
      }
    },
    [socket]
  );

  return {
    collaborators,
    onUserAction,
  };
};