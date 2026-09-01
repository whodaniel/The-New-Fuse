import React, { FC } from 'react';

export interface MarketplaceItemProps {
  className?: string;
  children?: React.ReactNode;
}

export const MarketplaceItem: FC<MarketplaceItemProps> = ({ className, children }) => (
  <div className={`tnf-marketplaceItem ${className || ''}`} data-testid="marketplaceItem">
    {children || <span>MarketplaceItem</span>}
  </div>
);

export default MarketplaceItem;
