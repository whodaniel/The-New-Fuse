interface Activity {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
    category?: string;
    source?: string;
    metadata?: Record<string, any>;
    read?: boolean;
}
export declare function ActivityFeed(): import("react/jsx-runtime").JSX.Element;
export declare function ActivityFeedControls({ setActivities, clearActivities }: {
    setActivities: (fn: (prev: Activity[]) => Activity[]) => void;
    clearActivities: () => void;
}): import("react/jsx-runtime").JSX.Element;
export {};
