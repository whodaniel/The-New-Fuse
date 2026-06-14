import React from 'react';
import './EnhancedTimelineView.css';
interface EventData {
    title: string;
    description: string;
    progress?: number;
    item: {
        id: string;
    };
}
interface Event {
    id: string;
    type: string;
    timestamp: Date | string;
    data: EventData;
    parentId?: string;
    mergedFrom?: string[];
}
interface Branch {
    id: string;
    name: string;
    startEvent: string;
    endEvent?: string;
    active: boolean;
}
interface Workflow {
    id: string;
    name: string;
    timeRange?: {
        startDate: Date | string;
        endDate: Date | string;
    };
}
interface EnhancedTimelineViewProps {
    events: Event[];
    branches: Branch[];
    workflows: Workflow[];
    onEventClick?: (event: Event) => void;
    onCreateBranch?: (eventId: string, branchName: string) => void;
    onAddNote?: (eventId: string, note: Note) => void;
    onEventMove?: (eventId: string, position: {
        x: number;
        y: number;
    }) => void;
}
interface Note {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: string;
    color: string;
}
export declare const EnhancedTimelineView: React.FC<EnhancedTimelineViewProps>;
export default EnhancedTimelineView;
//# sourceMappingURL=EnhancedTimelineView.d.ts.map