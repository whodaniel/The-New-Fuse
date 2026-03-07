import { useA11y } from '@/hooks/useA11y';
import React from 'react';
import { KeyboardNavigation } from './KeyboardNavigation';
import { ScreenReaderSupport } from './ScreenReaderSupport';

export const A11yProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { preferences } = useA11y();

  return (
    <div role="application">
      <ScreenReaderSupport enabled={preferences.screenReader} />
      <KeyboardNavigation enabled={preferences.keyboard} />
      {children}
    </div>
  );
};
