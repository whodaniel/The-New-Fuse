// @ts-nocheck
import { Extension, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../ui/design-system';

import { PopupContainer } from '../ui/popup';

export interface ChromeExtensionDemoProps {
  /** Whether to show the demo by default */
  defaultOpen?: boolean;
}

const ChromeExtensionDemo: React.FC<ChromeExtensionDemoProps> = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleThemeChange = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
  };

  if (!isOpen) {
    return (
      <div className="m-2 max-w-[400px] border border-gray-200 rounded-md shadow-none bg-transparent overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Extension className="text-blue-500" />
            <p className="text-xl font-bold">Chrome Extension UI Demo</p>
          </div>
          <p className="text-muted-foreground mb-4">
            Experience the recovered Chrome extension interface integrated into the main
            application.
          </p>
          <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
            <Extension size={16} /> Open Extension Interface
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-4 right-5 z-[9999] shadow-none rounded-md overflow-hidden bg-transparent transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Close Button */}
      <div className="absolute top-2 right-2 z-[10000]">
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded bg-black/10 hover:bg-black/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Popup Container */}
      <PopupContainer
        isMainApp={true}
        initialDarkMode={isDarkMode}
        onThemeChange={handleThemeChange}
        containerStyle={{
          width: '420px',
          height: '620px',
          maxHeight: '90vh',
        }}
      />
    </div>
  );
};

export default ChromeExtensionDemo;
