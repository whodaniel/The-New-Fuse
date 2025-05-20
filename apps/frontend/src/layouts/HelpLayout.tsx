import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Video, 
  HelpCircle, 
  MessageSquare, 
  Users, 
  ChevronLeft, 
  Search 
} from 'lucide-react';

/**
 * Layout for help and support pages
 */
const HelpLayout: React.FC = () => {
  const location = useLocation();
  
  // Help navigation items
  const helpNavItems = [
    { name: 'Documentation', icon: FileText, href: '/help/documentation', current: location.pathname === '/help/documentation' },
    { name: 'Tutorials', icon: Video, href: '/help/tutorials', current: location.pathname === '/help/tutorials' },
    { name: 'FAQ', icon: HelpCircle, href: '/help/faq', current: location.pathname === '/help/faq' },
    { name: 'Support', icon: MessageSquare, href: '/help/support', current: location.pathname === '/help/support' },
    { name: 'Community', icon: Users, href: '/help/community', current: location.pathname === '/help/community' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  <span className="font-medium">Back to Dashboard</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Help & Support</h1>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search help center..."
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Help Center</h2>
              </div>
              <div className="border-t border-gray-200">
                <nav className="px-4 py-3">
                  <div className="space-y-1">
                    {helpNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          item.current
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                      >
                        <item.icon
                          className={`${
                            item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                          } mr-3 flex-shrink-0 h-5 w-5`}
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Need help?</h3>
              <p className="mt-2 text-sm text-blue-700">
                Can't find what you're looking for? Contact our support team for personalized assistance.
              </p>
              <div className="mt-3">
                <Link
                  to="/help/support"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Contact Support <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpLayout;
