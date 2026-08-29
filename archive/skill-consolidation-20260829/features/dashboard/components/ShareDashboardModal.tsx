import React, { FC } from 'react';

export interface ShareDashboardModalProps {
  className?: string;
  children?: React.ReactNode;
}

export const ShareDashboardModal: FC<ShareDashboardModalProps> = ({ className, children }) => (
  <div className={`tnf-shareDashboardModal ${className || ''}`} data-testid="shareDashboardModal">
    {children || <span>ShareDashboardModal</span>}
  </div>
);

export default ShareDashboardModal;
