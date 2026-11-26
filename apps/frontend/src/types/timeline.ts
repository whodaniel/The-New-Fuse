// Shared timeline model types.
//
// Several timeline modules (features/timeline/services/timeline.service,
// features/timeline/components/EnhancedTimelineView, types/components) have
// always imported these names from here, but the module itself was missing —
// one of the drifts that left the Timeline Lab view unable to load. The
// shapes below are the ones those consumers already construct and read.

export type TimelineEventType = 'FEATURE' | 'MERGE' | 'BRANCH' | 'WORKFLOW';

export type TimelineEvent = {
  id: string;
  branchId: string;
  title: string;
  description?: string;
  /** ISO timestamp string. */
  timestamp: string;
  type: TimelineEventType;
};

export type TimelineBranch = {
  id: string;
  name: string;
  parentBranchId?: string;
  startEventId: string;
  /** Ids of the events that belong to this branch, in order. */
  events: string[];
  status: 'ACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
};

export type TimelineWorkflow = {
  id: string;
  eventId: string;
  name: string;
  description: string;
  status: 'PENDING' | string;
  steps: unknown[];
  createdAt?: string;
  updatedAt?: string;
};
