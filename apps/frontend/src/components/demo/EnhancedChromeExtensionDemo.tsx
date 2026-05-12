// @ts-nocheck
import { ArrowRightLeft, Code as CodeIcon, Extension, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../ui/design-system';

const EnhancedChromeExtensionDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const tabs = ['Interface', 'Code Integration', 'Data Flow', 'Settings'];

  return (
    <div className="max-w-[1200px] mx-auto p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-md shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Extension size={32} />
              <div>
                <p className="text-2xl font-bold">Enhanced Chrome Extension</p>
                <p className="opacity-90">Advanced UI Components & Features</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-white border-white/100 hover:bg-transparent/10 flex items-center gap-2"
              onClick={() => setShowPopup(!showPopup)}
            >
              <ExternalLink size={16} /> Launch Extension
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="bg-transparent border border-gray-200 rounded-md shadow-none">
        <div className="p-4">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(index)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeTab === 0 && (
              <div>
                <p className="text-lg font-semibold mb-3">Extension Interface</p>
                <p className="text-muted-foreground mb-4">
                  The extension provides a streamlined interface for Chrome browser integration with
                  real-time communication and feature management.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-md p-4 bg-transparent shadow-none">
                    <div className="flex items-center gap-2 mb-2">
                      <Extension size={20} className="text-blue-500" />
                      <p className="font-medium">Core Features</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Element selection, DOM manipulation, and browser state management.
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-md p-4 bg-transparent shadow-none">
                    <div className="flex items-center gap-2 mb-2">
                      <CodeIcon size={20} className="text-purple-500" />
                      <p className="font-medium">Developer Tools</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Advanced debugging and development features for power users.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div>
                <p className="text-lg font-semibold mb-3">Code Integration</p>
                <p className="text-muted-foreground mb-4">
                  Seamless integration with your development workflow and codebase.
                </p>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">API Endpoint Configuration</p>
                  <input
                    type="text"
                    placeholder="https://api.example.com/endpoint"
                    className="input w-full text-sm"
                  />
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Custom Scripts</p>
                  <textarea
                    placeholder="Enter custom JavaScript or configuration..."
                    className="input w-full text-sm h-32 font-mono"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <p className="text-lg font-semibold mb-3">Data Flow Management</p>
                <p className="text-muted-foreground mb-4">
                  Real-time data synchronization and state management across components.
                </p>
                <div className="flex items-center gap-4 p-4 bg-transparent rounded-md border border-gray-100">
                  <ArrowRightLeft size={24} className="text-blue-500" />
                  <div>
                    <p className="font-medium">Connected Services</p>
                    <p className="text-sm text-muted-foreground">4 active integrations</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div>
                <p className="text-lg font-semibold mb-3">Settings & Configuration</p>
                <p className="text-muted-foreground mb-4">
                  Customize extension behavior and preferences.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Theme</p>
                    <Button variant="outline" className="w-full text-sm">
                      {isDarkMode ? 'Dark' : 'Light'} Mode
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Notifications</p>
                    <Button className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white">
                      Enable
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Auto-update</p>
                    <Button className="w-full text-sm bg-green-600 hover:bg-green-700 text-white">
                      Active
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChromeExtensionDemo;
