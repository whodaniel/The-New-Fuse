import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Icon, Input, Dropdown } from '../../shared/ui/index.js';
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary.js';

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const closeDropdown = () => setIsDropdownOpen(false);

  const dropdownOptions = [
    { value: 'profile', label: 'Profile' },
    { value: 'settings', label: 'Settings' },
    { value: 'billing', label: 'Billing' },
    { value: 'logout', label: 'Logout' }
  ];

  const handleMenuItemSelect = (value: string) => {
    console.log(`Selected: ${value}`);
    closeDropdown();
  };

  return (
    <ErrorBoundary>
      <header className="sticky top-0 z-50 w-full bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/75 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden mr-2"
                icon={<Icon name="menu" className="h-5 w-5" />}
                aria-label="Menu"
              />
              
              <Link to="/" className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                  InfiniteAgentSpace
                </h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <Link to="/workspace" className="text-gray-300 hover:text-white transition-colors">
                  Workspace
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center relative">
                <Input 
                  className="pl-9 bg-gray-900/75 border-gray-700 focus:border-purple-500 text-gray-300 placeholder:text-gray-500" 
                  placeholder="Search anything..."
                  icon={<Icon name="search" className="w-4 h-4 text-gray-400" />}
                  iconPosition="left"
                />
              </div>

              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  icon={<Icon name="bell" className="h-5 w-5" />}
                  aria-label="Notifications"
                >
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              </div>

              <div className="relative">
                <Dropdown
                  options={dropdownOptions}
                  onChange={handleMenuItemSelect}
                  placeholder="My Account"
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </ErrorBoundary>
  );
}