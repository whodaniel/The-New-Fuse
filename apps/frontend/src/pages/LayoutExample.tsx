import React from 'react';
import { Layout, Card, Button } from '@the-new-fuse/ui-consolidated';

/**
 * LayoutExample - A page to showcase the Layout component
 */
const LayoutExample: React.FC = () => {
  return (
    <Layout
      navigation={[
        { label: 'Home', href: '#', active: true },
        { label: 'Dashboard', href: '#' },
        { label: 'Projects', href: '#' },
        { label: 'Tasks', href: '#' },
        { label: 'Calendar', href: '#' },
        { label: 'Reports', href: '#' },
        { label: 'Settings', href: '#' },
      ]}
      user={{
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://i.pravatar.cc/300',
      }}
      footerLinks={[
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Contact Us', href: '#' },
      ]}
      className="min-h-screen"
    >
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Layout Example</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card title="Dashboard Overview">
            <p className="mb-4">This is an example of the Layout component with a header, sidebar, and content area.</p>
            <Button>View Details</Button>
          </Card>
          
          <Card title="Recent Activity">
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>Project A was updated</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>New task assigned</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>Meeting scheduled</span>
              </li>
            </ul>
            <Button variant="outline">See All Activity</Button>
          </Card>
          
          <Card title="Quick Actions">
            <div className="space-y-2 mb-4">
              <Button className="w-full">Create New Project</Button>
              <Button variant="outline" className="w-full">Add Task</Button>
              <Button variant="secondary" className="w-full">Generate Report</Button>
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Project Status">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Project A</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Project B</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Project C</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div>
            <Card title="Team Members">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 mr-3 flex items-center justify-center text-white">JD</div>
                  <div>
                    <div className="font-medium">John Doe</div>
                    <div className="text-sm text-gray-500">Project Manager</div>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 mr-3 flex items-center justify-center text-white">AS</div>
                  <div>
                    <div className="font-medium">Alice Smith</div>
                    <div className="text-sm text-gray-500">Developer</div>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-500 mr-3 flex items-center justify-center text-white">RJ</div>
                  <div>
                    <div className="font-medium">Robert Johnson</div>
                    <div className="text-sm text-gray-500">Designer</div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutExample;
