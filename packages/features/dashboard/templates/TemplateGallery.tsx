import React, { FC } from 'react';

export interface TemplateGalleryProps {
  className?: string;
  children?: React.ReactNode;
}

export const TemplateGallery: FC<TemplateGalleryProps> = ({ className, children }) => (
  <div className={`tnf-templateGallery ${className || ''}`} data-testid="templateGallery">
    {children || <span>TemplateGallery</span>}
  </div>
);

export default TemplateGallery;
