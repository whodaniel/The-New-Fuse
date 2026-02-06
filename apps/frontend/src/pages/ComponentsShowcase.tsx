import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import React, { useState } from 'react';

// Simple placeholder components for demo
const Container = ({ children, size, className }: any) => (
  <div
    className={`container ${size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : size === 'lg' ? 'max-w-lg' : 'max-w-xl'} mx-auto ${className}`}
  >
    {children}
  </div>
);

const Split = ({ children, direction = 'horizontal', className }: any) => (
  <div className={`${direction === 'vertical' ? 'flex flex-col' : 'flex'} ${className}`}>
    {children}
  </div>
);

const Sidebar = ({ children, open, collapsed, onClose, className }: any) => (
  <div
    className={`bg-gray-100 p-4 ${open ? 'block' : 'hidden'} ${collapsed ? 'w-16' : 'w-64'} ${className}`}
  >
    {children}
    {onClose && (
      <button onClick={onClose} className="mt-2 text-sm">
        Close
      </button>
    )}
  </div>
);
// Temporarily using local components instead of ui-consolidated
// import {
//   Badge,
//   Button,
//   Card,
//   Input,
//   Select,
//   Container,
//   Split,
//   Layout,
//   Sidebar
// } from '@the-new-fuse/ui-consolidated';

/**
 * ComponentsShowcase - A page to showcase all UI components
 */
const ComponentsShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">UI Components Showcase</h1>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Badges</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>Default Badge</Badge>
            <Badge className="bg-secondary">Secondary</Badge>
            <Badge className="bg-destructive">Destructive</Badge>
            <Badge className="border border-gray-300">Outline</Badge>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Default Card">
              <p>This is a default card with a title and content.</p>
              <div className="mt-4">
                <Button>Card Action</Button>
              </div>
            </Card>

            <Card variant="outline" title="Outline Card">
              <p>This is an outline card with a title and content.</p>
              <div className="mt-4">
                <Button variant="outline">Card Action</Button>
              </div>
            </Card>

            <Card variant="elevated" title="Elevated Card">
              <p>This is an elevated card with a title and content.</p>
              <div className="mt-4">
                <Button variant="secondary">Card Action</Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-input">Default Input</Label>
              <Input
                id="default-input"
                placeholder="Enter text here"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disabled-input">Disabled Input</Label>
              <Input id="disabled-input" placeholder="This input is disabled" disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="error-input">Input with Error</Label>
              <Input id="error-input" placeholder="Enter text here" className="border-red-500" />
              <p className="text-sm text-red-500">This field is required</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="success-input">Input with Success</Label>
              <Input
                id="success-input"
                placeholder="Enter text here"
                className="border-green-500"
              />
              <p className="text-sm text-green-500">Looks good!</p>
            </div>
          </div>
        </section>

        {/* Select Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Select</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Default Select"
                placeholder="Select an option"
                value={selectValue}
                onChange={(value) => setSelectValue(value)}
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Disabled Select"
                placeholder="This select is disabled"
                disabled
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Select with Error"
                placeholder="Select an option"
                error="Please select an option"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Select with Success"
                placeholder="Select an option"
                success="Great choice!"
                value="option1"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Container Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Container</h2>
          <Container size="sm" className="bg-gray-100 p-4 mb-4">
            <p>This is a small container</p>
          </Container>

          <Container size="md" className="bg-gray-100 p-4 mb-4">
            <p>This is a medium container</p>
          </Container>

          <Container size="lg" className="bg-gray-100 p-4 mb-4">
            <p>This is a large container</p>
          </Container>

          <Container size="xl" className="bg-gray-100 p-4">
            <p>This is an extra large container</p>
          </Container>
        </section>

        {/* Split Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Split</h2>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Horizontal Split</h3>
            <Split className="h-64 border">
              <div className="bg-gray-100 p-4">Left Panel</div>
              <div className="bg-gray-200 p-4">Right Panel</div>
            </Split>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Vertical Split</h3>
            <Split direction="vertical" className="h-64 border">
              <div className="bg-gray-100 p-4">Top Panel</div>
              <div className="bg-gray-200 p-4">Bottom Panel</div>
            </Split>
          </div>
        </section>

        {/* Sidebar Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Sidebar</h2>
          <div className="mb-4">
            <Button onClick={() => setSidebarOpen(true)} className="mr-2">
              Open Mobile Sidebar
            </Button>
            <Button onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? 'Expand' : 'Collapse'} Sidebar
            </Button>
          </div>

          <div className="relative h-96 border overflow-hidden">
            {/* Mobile Sidebar */}
            <Sidebar
              mobile
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              items={[
                { label: 'Home', href: '#', active: true },
                { label: 'Dashboard', href: '#' },
                { label: 'Settings', href: '#' },
                { label: 'Profile', href: '#' },
                { label: 'Help', href: '#' },
              ]}
              className="h-full"
            />

            {/* Desktop Sidebar */}
            <Sidebar
              collapsible
              collapsed={collapsed}
              onCollapse={setCollapsed}
              items={[
                { label: 'Home', href: '#', active: true },
                { label: 'Dashboard', href: '#' },
                { label: 'Settings', href: '#' },
                { label: 'Profile', href: '#' },
                { label: 'Help', href: '#' },
              ]}
              className="h-full hidden md:block"
            />

            <div
              className={`${collapsed ? 'ml-16' : 'ml-64'} p-4 transition-all duration-300 md:block hidden`}
            >
              <p>Content next to sidebar</p>
              <p className="mt-2">The sidebar can be collapsed or expanded.</p>
            </div>

            <div className="p-4 md:hidden">
              <p>Open the mobile sidebar using the button above.</p>
            </div>
          </div>
        </section>

        {/* Layout Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Layout</h2>
          <p className="mb-4">
            The Layout component provides a complete page layout with header, sidebar, and content
            area.
          </p>
          <p className="mb-4">Click the button below to see a full page layout example:</p>
          <Button onClick={() => window.open('/layout-example', '_blank')}>
            View Layout Example
          </Button>
        </section>
      </div>
    </div>
  );
};

export default ComponentsShowcase;
