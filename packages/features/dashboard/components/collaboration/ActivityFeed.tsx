import React, { FC } from 'react';

export interface ActivityFeedProps {
  className?: string;
  children?: React.ReactNode;
}

export const ActivityFeed: FC<ActivityFeedProps> = ({ className, children }) => (
  <div className={`tnf-activityFeed ${className || ''}`} data-testid="activityFeed">
    {children || <span>ActivityFeed</span>}
  </div>
);

export default ActivityFeed;
