import React from 'react';
import { TimelineEvent } from '../types/timeline';
/**
 * Props for the TimelineSlider component
 */
interface TimelineSliderProps {
    /** Array of timeline events to display */
    events: TimelineEvent[];
    /** Optional callback when an event is clicked */
    onEventClick?: (event: TimelineEvent) => void;
    /** Optional callback when a date range is selected */
    onRangeSelect?: (startDate: Date, endDate: Date) => void;
    /** Optional callback to add a note on a specific date */
    onAddNote?: (date: Date, content: string) => void;
    /** Optional timeline ranges to display */
    ranges?: Array<{
        id: string;
        startDate: Date | string;
        endDate: Date | string;
        type: string;
        color: string;
        label: string;
    }>;
}
declare const TimelineSlider: React.FC<TimelineSliderProps>;
export default TimelineSlider;
//# sourceMappingURL=TimelineSlider.d.ts.map