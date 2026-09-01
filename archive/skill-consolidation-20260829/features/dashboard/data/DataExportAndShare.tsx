import React, { FC } from 'react';

export interface DataExportAndShareProps {
  className?: string;
  children?: React.ReactNode;
}

export const DataExportAndShare: FC<DataExportAndShareProps> = ({ className, children }) => (
  <div className={`tnf-dataExportAndShare ${className || ''}`} data-testid="dataExportAndShare">
    {children || <span>DataExportAndShare</span>}
  </div>
);

export default DataExportAndShare;
