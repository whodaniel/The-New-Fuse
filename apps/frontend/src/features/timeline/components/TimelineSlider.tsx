import React, { useMemo } from 'react';

type TimelineSliderEvent = {
  id?: string;
  timestamp?: string;
  title?: string;
  data?: {
    title?: string;
  };
};

type TimelineSliderProps = {
  events: TimelineSliderEvent[];
  currentEventId?: string;
  onEventChange: (eventOrId: unknown) => void;
  disabled?: boolean;
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  events,
  currentEventId,
  onEventChange,
  disabled = false,
}) => {
  const orderedEvents = useMemo(() => {
    return [...(events || [])]
      .filter((event) => event && event.id)
      .sort((a, b) => {
        const aTs = a.timestamp ? Date.parse(a.timestamp) : 0;
        const bTs = b.timestamp ? Date.parse(b.timestamp) : 0;
        return aTs - bTs;
      });
  }, [events]);

  const currentIndex = useMemo(() => {
    const idx = orderedEvents.findIndex((event) => event.id === currentEventId);
    return idx >= 0 ? idx : 0;
  }, [orderedEvents, currentEventId]);

  if (orderedEvents.length === 0) {
    return <div className="timeline-slider-empty">No timeline events available.</div>;
  }

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextIndex = Number(event.target.value);
    const selectedEvent = orderedEvents[nextIndex];

    if (!selectedEvent) return;

    // TimelineModule currently passes handleEventClick, which expects an event object.
    // Keep this flexible to avoid breaking callers that still expect an id.
    onEventChange(selectedEvent);
  };

  const activeEvent = orderedEvents[currentIndex];
  const activeLabel =
    activeEvent?.title || activeEvent?.data?.title || activeEvent?.id || 'Selected event';

  return (
    <div className="timeline-slider" style={{ marginTop: 16 }}>
      <input
        type="range"
        min={0}
        max={Math.max(orderedEvents.length - 1, 0)}
        value={currentIndex}
        onChange={handleSliderChange}
        disabled={disabled}
        style={{ width: '100%' }}
        aria-label="Timeline event selector"
      />
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        {currentIndex + 1}/{orderedEvents.length}: {activeLabel}
      </div>
    </div>
  );
};
