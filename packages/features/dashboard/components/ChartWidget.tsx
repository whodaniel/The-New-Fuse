import React, { FC } from 'react';

export interface ChartWidgetProps {
  className?: string;
  children?: React.ReactNode;
}

export const ChartWidget: FC<ChartWidgetProps> = ({ className, children }) => (
  <div className={`tnf-chartWidget ${className || ''}`} data-testid="chartWidget">
    {children || <span>ChartWidget</span>}
  </div>
);

export default ChartWidget;
