// @ts-nocheck
import React from 'react';

interface TimelineSliderProps {
  events: Array<{ id: string; [key: string]: any }>;
  currentEventId: string;
  onEventChange: (eventId: string) => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  events,
  currentEventId,
  onEventChange,
}) => {
  const currentIndex = events.findIndex((e) => e.id === currentEventId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    if (events[index]) {
      onEventChange(events[index].id);
    }
  };

  if (!events || events.length === 0) return null;

  return (
    <div className="timeline-slider">
      <input
        type="range"
        min={0}
        max={events.length - 1}
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={handleChange}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default TimelineSlider;
