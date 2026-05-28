import React, { FC } from 'react';

export interface WidgetConfigModalProps {
  className?: string;
  children?: React.ReactNode;
}

export const WidgetConfigModal: FC<WidgetConfigModalProps> = ({ className, children }) => (
  <div className={`tnf-widgetConfigModal ${className || ''}`} data-testid="widgetConfigModal">
    {children || <span>WidgetConfigModal</span>}
  </div>
);

export default WidgetConfigModal;
