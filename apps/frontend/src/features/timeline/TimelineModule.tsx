import React, { useState } from 'react';
import { EnhancedTimelineView } from './components/EnhancedTimelineView';
import { TimelineSlider } from './components/TimelineSlider';
import { useTimelineModule } from './hooks/useTimelineModule';
import { TimelineService } from './services/timeline.service';

export const TimelineModule: React.FC = () => {
  const [timelineService] = useState(() => new TimelineService());
  const {
    events,
    branches,
    workflows,
    currentBranchId,
    currentEventId,
    loading,
    error,
    handleBranchSelect,
    handleEventClick,
    handleCreateBranch,
    handleMergeBranch,
    refresh,
  } = useTimelineModule({ timelineService });

  if (loading)
    return (
      <div
        className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-slate-700 bg-slate-950/60 py-16"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-300">Loading timeline data...</p>
      </div>
    );

  if (error)
    return (
      <div
        className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-red-500/30 bg-red-500/5 py-16 text-center"
        role="alert"
      >
        <p className="text-sm font-medium text-red-300">
          Timeline data could not be loaded: {error.message}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-sky-500/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-sky-300 transition hover:bg-sky-500/10"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="timeline-module">
      <EnhancedTimelineView
        events={events}
        branches={branches}
        workflows={workflows}
        currentBranchId={currentBranchId}
        onBranchSelect={handleBranchSelect}
        onEventClick={handleEventClick}
        onCreateBranch={handleCreateBranch}
        onMergeBranch={handleMergeBranch}
      />
      <TimelineSlider
        events={events}
        currentEventId={currentEventId}
        onEventChange={handleEventClick}
      />
    </div>
  );
};
