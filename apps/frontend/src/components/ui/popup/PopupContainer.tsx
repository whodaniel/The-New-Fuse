import { Button } from '@/components/ui/design-system';
import { Code, LayoutDashboard, Monitor, Moon, Settings, Sun } from 'lucide-react';
import React from 'react';

interface PopupContainerProps {
  isMainApp?: boolean;
  initialDarkMode?: boolean;
  onThemeChange?: (dark: boolean) => void;
  containerStyle?: React.CSSProperties;
}

export const PopupContainer: React.FC<PopupContainerProps> = ({
  isMainApp = false,
  initialDarkMode = false,
  onThemeChange,
  containerStyle = {},
}) => {
  const [darkMode, setDarkMode] = React.useState(initialDarkMode);

  const handleThemeChange = (newDarkMode: boolean) => {
    setDarkMode(newDarkMode);
    onThemeChange?.(newDarkMode);
  };

  return (
    <div
      className={`w-full h-full p-4 ${
        darkMode ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-800'
      }`}
      style={containerStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          {isMainApp ? 'Main App Integration' : 'Chrome Extension'}
        </h2>
        <Button size="sm" variant="outline" onClick={() => handleThemeChange(!darkMode)}>
          {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Button size="sm" variant="outline">
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        <Button size="sm" variant="outline">
          <Code className="h-4 w-4 mr-2" />
          Code
        </Button>
        <Button size="sm" variant="outline">
          <Monitor className="h-4 w-4 mr-2" />
          Debug
        </Button>
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Status */}
      <div className={`p-3 rounded-md ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
        <p className="text-sm font-medium mb-2">System Status</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success-500 rounded-full" />
          <p className="text-xs">Extension active</p>
        </div>
      </div>
    </div>
  );
};
