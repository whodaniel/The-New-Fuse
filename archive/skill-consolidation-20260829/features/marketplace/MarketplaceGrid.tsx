import React, { FC } from 'react';

export interface MarketplaceGridProps {
  className?: string;
  children?: React.ReactNode;
}

export const MarketplaceGrid: FC<MarketplaceGridProps> = ({ className, children }) => (
  <div className={`tnf-marketplaceGrid ${className || ''}`} data-testid="marketplaceGrid">
    {children || <span>MarketplaceGrid</span>}
  </div>
);

export default MarketplaceGrid;
