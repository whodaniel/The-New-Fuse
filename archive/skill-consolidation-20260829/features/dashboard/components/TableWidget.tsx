import React, { FC } from 'react';

export interface TableWidgetProps {
  className?: string;
  children?: React.ReactNode;
}

export const TableWidget: FC<TableWidgetProps> = ({ className, children }) => (
  <div className={`tnf-tableWidget ${className || ''}`} data-testid="tableWidget">
    {children || <span>TableWidget</span>}
  </div>
);

export default TableWidget;
