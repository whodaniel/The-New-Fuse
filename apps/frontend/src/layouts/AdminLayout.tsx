import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Settings, 
  FileText, 
  BarChart2, 
  CreditCard, 
  ChevronLeft 
} from 'lucide-react';

/**
 * Layout for administration pages
 */
const AdminLayout: React.FC = () => {
  const location = useLocation();
  
  // Admin navigation items
  const adminNavItems = [
    { name: 'Users', icon: Users, href: '/admin/users', current: location.pathname === '/admin/users' },
    { name: 'Teams', icon: UserPlus, href: '/admin/teams', current: location.pathname === '/admin/teams' },
    { name: 'Settings', icon: Settings, href: '/admin/settings', current: location.pathname === '/admin/settings' },
    { name: 'Audit Logs', icon: FileText, href: '/admin/audit-logs', current: location.pathname === '/admin/audit-logs' },
    { name: 'Usage Statistics', icon: BarChart2, href: '/admin/usage', current: location.pathname === '/admin/usage' },
    { name: 'Billing', icon: CreditCard, href: '/admin/billing', current: location.pathname === '/admin/billing' },
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
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Administration</h2>
              </div>
              <div className="border-t border-gray-200">
                <nav className="px-4 py-3">
                  <div className="space-y-1">
                    {adminNavItems.map((item) => (
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

export default AdminLayout;
