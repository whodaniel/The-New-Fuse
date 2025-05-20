import { useEffect, useCallback, useState } from 'react';
import { CollaborationManager } from '../collaboration/CollaborationManager.js';
export function useCollaboration(websocketUrl, initialState, currentUser) {
    const [manager] = useState(() => new CollaborationManager(websocketUrl, initialState));
    const [state, setState] = useState(initialState);
    useEffect(() => {
        const unsubscribe = manager.subscribe(currentUser.id, setState);
        return () => unsubscribe();
    }, [manager, currentUser.id]);
    useEffect(() => {
        const handleUserActivity = () => {
            manager.updateUserPresence(currentUser.id, 'online');
        };
        const handleUserInactivity = () => {
            manager.updateUserPresence(currentUser.id, 'away');
        };
        // Update presence on mount
        handleUserActivity();
        // Set up activity listeners
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        // Set up inactivity timer
        const inactivityTimer = setInterval(handleUserInactivity, 5 * 60 * 1000);
        return () => {
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            clearInterval(inactivityTimer);
            manager.updateUserPresence(currentUser.id, 'offline');
        };
    }, [manager, currentUser.id]);
    const addComment = useCallback((content, widgetId) => {
        manager.addComment({
            content,
            author: currentUser,
            ...(widgetId && { widgetId }),
        });
    }, [manager, currentUser]);
    const resolveComment = useCallback((comment) => {
        manager.resolveComment(comment.id, currentUser);
    }, [manager, currentUser]);
    const addAnnotation = useCallback((widgetId, content, position) => {
        manager.addAnnotation({
            widgetId,
            content,
            position,
            author: currentUser,
        });
    }, [manager, currentUser]);
    const updateAnnotation = useCallback((annotationId, updates) => {
        manager.updateAnnotation(annotationId, updates);
    }, [manager]);
    const trackActivity = useCallback((type, metadata = {}) => {
        manager.trackActivity({
            type,
            user: currentUser,
            metadata,
        });
    }, [manager, currentUser]);
    const updateCursor = useCallback((position) => {
        manager.updateCursor(currentUser.id, position);
    }, [manager, currentUser.id]);
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
//# sourceMappingURL=useCollaboration.js.map