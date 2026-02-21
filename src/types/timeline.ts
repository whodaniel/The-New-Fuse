export interface TimelineEventBase {
  id: string;
  timestamp: Date;
  type: 'milestone' | 'phase' | 'sprint';
}