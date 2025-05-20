import { useEffect, useCallback, useState } from 'react';
import { CollaborationManager } from '../collaboration/CollaborationManager.js';
import {
  User,
  Comment,
  Annotation,
  ActivityEvent,
  CollaborationState,
} from '../collaboration/types.js';

export function useCollaboration(
  websocketUrl: string,
  initialState: CollaborationState,
  currentUser: User
): unknown {
  const [manager] = useState(
    () => new CollaborationManager(websocketUrl, initialState)
  );
  const [state, setState] = useState<CollaborationState>(initialState);

  useEffect(() => {
    const unsubscribe = (manager as any).subscribe((currentUser as any).id, setState);
    return () => unsubscribe();
  }, [manager, (currentUser as any).id]);

  useEffect(() => {
    const handleUserActivity = (): unknown => {
      (manager as any).updateUserPresence((currentUser as any).id, 'online');
    };

    const handleUserInactivity = (): unknown => {
      (manager as any).updateUserPresence((currentUser as any).id, 'away');
    };

    // Update presence on mount
    handleUserActivity();

    // Set up activity listeners
    (window as any).addEventListener('mousemove', handleUserActivity);
    (window as any).addEventListener('keydown', handleUserActivity);

    // Set up inactivity timer
    const inactivityTimer = setInterval(handleUserInactivity, 5 * 60 * 1000);

    return () => {
      (window as any).removeEventListener('mousemove', handleUserActivity);
      (window as any).removeEventListener('keydown', handleUserActivity);
      clearInterval(inactivityTimer);
      (manager as any).updateUserPresence((currentUser as any).id, 'offline');
    };
  }, [manager, (currentUser as any).id]);

  const addComment = useCallback(
    (content: string, widgetId?: string) => {
      (manager as any).addComment({
        content,
        author: currentUser,
        ...(widgetId && { widgetId }),
      });
    },
    [manager, currentUser]
  );

  const resolveComment = useCallback(
    (comment: Comment) => {
      (manager as any).resolveComment((comment as any).id, currentUser);
    },
    [manager, currentUser]
  );

  const addAnnotation = useCallback(
    (
      widgetId: string,
      content: string,
      position: { x: number; y: number }
    ) => {
      (manager as any).addAnnotation({
        widgetId,
        content,
        position,
        author: currentUser,
      });
    },
    [manager, currentUser]
  );

  const updateAnnotation = useCallback(
    (annotationId: string, updates: Partial<Annotation>) => {
      (manager as any).updateAnnotation(annotationId, updates);
    },
    [manager]
  );

  const trackActivity = useCallback(
    (
      type: ActivityEvent['type'],
      metadata: Record<string, unknown> = {}
    ) => {
      (manager as any).trackActivity({
        type,
        user: currentUser,
        metadata,
      });
    },
    [manager, currentUser]
  );

  const updateCursor = useCallback(
    (position: { x: number; y: number }) => {
      (manager as any).updateCursor((currentUser as any).id, position);
    },
    [manager, (currentUser as any).id]
  );

  return {
    state,
    addComment,
    resolveComment,
    addAnnotation,
    updateAnnotation,
    trackActivity,
    updateCursor,
  };
}
