import React from 'react';

export interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return <div className="layout">{children}</div>;
}
