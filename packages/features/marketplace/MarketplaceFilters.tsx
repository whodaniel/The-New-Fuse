import React, { FC } from 'react';

export interface MarketplaceFiltersProps {
  className?: string;
  children?: React.ReactNode;
}

export const MarketplaceFilters: FC<MarketplaceFiltersProps> = ({ className, children }) => (
  <div className={`tnf-marketplaceFilters ${className || ''}`} data-testid="marketplaceFilters">
    {children || <span>MarketplaceFilters</span>}
  </div>
);

export default MarketplaceFilters;
