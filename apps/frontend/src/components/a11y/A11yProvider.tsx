import React from 'react';
import { useA11y } from '@/hooks/useA11y';
import { ScreenReaderSupport } from './ScreenReaderSupport.js';
import { KeyboardNavigation } from './KeyboardNavigation.js';

export const A11yProvider: React.React.FC<{
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
