import React, { FC } from 'react';

export interface ListWidgetProps {
  className?: string;
  children?: React.ReactNode;
}

export const ListWidget: FC<ListWidgetProps> = ({ className, children }) => (
  <div className={`tnf-listWidget ${className || ''}`} data-testid="listWidget">
    {children || <span>ListWidget</span>}
  </div>
);

export default ListWidget;
