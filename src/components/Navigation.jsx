import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../constants/routes';
import { DropdownMenu } from './DropdownMenu';

export default function Navigation() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reactAppItems = [
    { label: "🤖 Multi-Agent Chat", to: ROUTE_PATHS.MULTI_AGENT_CHAT },
    { label: "📊 Dashboard", to: ROUTE_PATHS.DASHBOARD },
    { label: "🎨 UI Components", to: ROUTE_PATHS.COMPONENTS_SHOWCASE },
    { label: "⏰ Timeline Demo", to: ROUTE_PATHS.TIMELINE_DEMO },
    { label: "📈 Graph Demo", to: ROUTE_PATHS.GRAPH_DEMO },
    { label: "🏢 Workspace", to: ROUTE_PATHS.WORKSPACE_OVERVIEW },
    { label: "⚙️ Settings", to: ROUTE_PATHS.WORKSPACE_SETTINGS },
    { label: "🧪 Test Page", to: ROUTE_PATHS.TEST_PAGE },
  ];

  const htmlPageItems = [
    { label: "🏠 HTML Index", to: ROUTE_PATHS.HTML_INDEX, isExternal: true },
    { label: "🔐 Login Page", to: ROUTE_PATHS.HTML_LOGIN, isExternal: true },
    { label: "📊 Dashboard Static", to: ROUTE_PATHS.HTML_DASHBOARD_STATIC, isExternal: true },
    { label: "💬 Chat Interface", to: ROUTE_PATHS.HTML_CHAT_INTERFACE, isExternal: true },
    { label: "👨‍💼 Admin Panel", to: ROUTE_PATHS.HTML_ADMIN_PANEL, isExternal: true },
    { label: "⚙️ Settings Static", to: ROUTE_PATHS.HTML_SETTINGS_STATIC, isExternal: true },
  ];

  const devToolItems = [
    { label: "🐛 Debug Info", to: ROUTE_PATHS.DEBUG_INFO },
    { label: "🟢 Server Status", to: ROUTE_PATHS.DEV_SERVER_STATUS, isExternal: true },
    { label: "📋 Build Info", to: ROUTE_PATHS.BUILD_INFO },
  ];

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg relative" ref={navRef}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">🚀 The New Fuse</h1>
        <div className="flex items-center space-x-2">
          <Link to={ROUTE_PATHS.HOME} className="hover:text-blue-200 px-3 py-2 rounded transition-colors" onClick={closeDropdown}>Home</Link>
          <DropdownMenu
            title="🚀 React Apps"
            buttonBgClass="bg-blue-700"
            items={reactAppItems}
            isOpen={activeDropdown === 'react'}
            onToggle={() => toggleDropdown('react')}
            closeDropdown={closeDropdown}
          />
          <DropdownMenu
            title="📄 HTML Pages"
            buttonBgClass="bg-green-600"
            items={htmlPageItems}
            isOpen={activeDropdown === 'html'}
            onToggle={() => toggleDropdown('html')}
            closeDropdown={closeDropdown}
          />
          <DropdownMenu
            title="🔧 Dev Tools"
            buttonBgClass="bg-purple-600"
            items={devToolItems}
            isOpen={activeDropdown === 'dev'}
            onToggle={() => toggleDropdown('dev')}
            closeDropdown={closeDropdown}
          />
        </div>
      </div>
    </nav>
  );
}