import React, { FC } from 'react';

export interface DataGridProps {
  className?: string;
  children?: React.ReactNode;
}

export const DataGrid: FC<DataGridProps> = ({ className, children }) => (
  <div className={`tnf-dataGrid ${className || ''}`} data-testid="dataGrid">
    {children || <span>DataGrid</span>}
  </div>
);

export default DataGrid;
