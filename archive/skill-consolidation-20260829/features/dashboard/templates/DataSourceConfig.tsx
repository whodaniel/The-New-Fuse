import React, { FC } from 'react';

export interface DataSourceConfigProps {
  className?: string;
  children?: React.ReactNode;
}

export const DataSourceConfig: FC<DataSourceConfigProps> = ({ className, children }) => (
  <div className={`tnf-dataSourceConfig ${className || ''}`} data-testid="dataSourceConfig">
    {children || <span>DataSourceConfig</span>}
  </div>
);

export default DataSourceConfig;
