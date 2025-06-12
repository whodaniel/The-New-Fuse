import { CollaborationState } from './types.tsx';
export declare class CollaborationManager {
    private ws;
    private state;
    private listeners;
    private cursorUpdateThrottle;
    private lastCursorUpdate;
    constructor(websocketUrl: string, initialState: CollaborationState, cursorUpdateThrottle?: number);
    private handleActivityRecorded;
}
