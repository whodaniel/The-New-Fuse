import React from 'react';
interface TimelineEvent {
    id: string;
    parentId?: string;
    type: string;
    timestamp: string;
    mergedFrom?: string[];
    data: {
        title: string;
    };
}
interface TimelineBranch {
    id: string;
    name: string;
    events: string[];
}
interface TimelineWorkflow {
    id: string;
    name: string;
    steps: Array<{
        id: string;
        name: string;
        status: string;
    }>;
}
interface TimelineViewProps {
    events: TimelineEvent[];
    branches: TimelineBranch[];
    workflows: TimelineWorkflow[];
    onEventClick: (event: TimelineEvent) => void;
    onCreateBranch: (fromEventId: string, name: string) => void;
    onMergeBranch: (fromEventId: string, toEventId: string) => void;
}
declare const TimelineView: React.FC<TimelineViewProps>;
export default TimelineView;
//# sourceMappingURL=TimelineView.d.ts.map