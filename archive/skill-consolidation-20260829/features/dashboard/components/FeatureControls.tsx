import React, { FC } from 'react';

export interface FeatureControlsProps {
  className?: string;
  children?: React.ReactNode;
}

export const FeatureControls: FC<FeatureControlsProps> = ({ className, children }) => (
  <div className={`tnf-featureControls ${className || ''}`} data-testid="featureControls">
    {children || <span>FeatureControls</span>}
  </div>
);

export default FeatureControls;
