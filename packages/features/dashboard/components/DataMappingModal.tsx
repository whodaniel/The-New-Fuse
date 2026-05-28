import React, { FC } from 'react';

export interface DataMappingModalProps {
  className?: string;
  children?: React.ReactNode;
}

export const DataMappingModal: FC<DataMappingModalProps> = ({ className, children }) => (
  <div className={`tnf-dataMappingModal ${className || ''}`} data-testid="dataMappingModal">
    {children || <span>DataMappingModal</span>}
  </div>
);

export default DataMappingModal;
