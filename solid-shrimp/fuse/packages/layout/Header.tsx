"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
var react_1 = require("react");
var LayoutContext_1 = require("./LayoutContext");
var Header = function (_a) {
    var user = _a.user, onLogout = _a.onLogout, onProfile = _a.onProfile, onSettings = _a.onSettings;
    var _b = (0, LayoutContext_1.useLayout)(), sidebarOpen = _b.sidebarOpen, setSidebarOpen = _b.setSidebarOpen, notifications = _b.notifications, markNotificationAsRead = _b.markNotificationAsRead;
    var unreadNotifications = notifications.filter(function (n) { return !n.read; });
    return (<header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <button type="button" className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={function () { return setSidebarOpen(!sidebarOpen); }}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7"/>)}
              </svg>
            </button>

            <div className="ml-4">
              <img className="h-8" src="/logo.svg" alt="The New Fuse"/>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button type="button" className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {unreadNotifications.length > 0 && (<span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"/>)}
              </button>
            </div>

            {/* User menu */}
            {user && (<div className="relative">
                <button type="button" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {user.avatar ? (<img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name}/>) : (<div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name.charAt(0)}
                      </span>
                    </div>)}
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {onProfile && (<button onClick={onProfile} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </button>)}
                    {onSettings && (<button onClick={onSettings} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Settings
                      </button>)}
                    {onLogout && (<button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        Logout
                      </button>)}
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </header>);
};
exports.Header = Header;
export {};
