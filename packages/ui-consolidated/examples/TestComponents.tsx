import React from 'react';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Container,
  Split,
  Layout,
  Sidebar
} from '../src.js';

/**
 * Test component to demonstrate all consolidated components
 */
export const TestComponents: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <h1 className="text-2xl font-bold mb-4 p-4">UI Consolidated Components Test</h1>

      <Container size="lg" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Container Component</h2>
        <p className="mb-4">This is a container component with size="lg"</p>

        <Container size="sm" className="bg-accent p-4 rounded-md mb-4">
          <p>This is a nested container with size="sm"</p>
        </Container>
      </Container>

      <Container size="lg" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Split Component</h2>
        <Split className="h-64 mb-4 border rounded-md">
          <div className="bg-primary/10 p-4">Left Panel</div>
          <div className="bg-secondary/10 p-4">Right Panel</div>
        </Split>

        <Split direction="vertical" className="h-64 mb-4 border rounded-md">
          <div className="bg-primary/10 p-4">Top Panel</div>
          <div className="bg-secondary/10 p-4">Bottom Panel</div>
        </Split>
      </Container>

      <Container size="lg" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sidebar Component</h2>
        <div className="flex mb-4">
          <Button onClick={() => setSidebarOpen(true)} className="mr-2">
            Open Sidebar
          </Button>
          <Button onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? 'Expand' : 'Collapse'} Sidebar
          </Button>
        </div>

        <div className="relative h-64 border rounded-md overflow-hidden">
          <Sidebar
            mobile
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            items={[
              { label: 'Home', href: '#', active: true },
              { label: 'Dashboard', href: '#' },
              { label: 'Settings', href: '#' },
            ]}
            className="h-full"
          />

          <Sidebar
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            items={[
              { label: 'Home', href: '#', active: true },
              { label: 'Dashboard', href: '#' },
              { label: 'Settings', href: '#' },
            ]}
            className="h-full hidden md:block"
          />

          <div className="ml-16 md:ml-64 p-4">
            <p>Content next to sidebar</p>
          </div>
        </div>
      </Container>

      <Container size="lg" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Layout Component</h2>
        <div className="border rounded-md overflow-hidden h-[500px]">
          <Layout
            navigation={[
              { label: 'Home', href: '#', active: true },
              { label: 'Dashboard', href: '#' },
              { label: 'Settings', href: '#' },
            ]}
            user={{
              name: 'John Doe',
              email: 'john@example.com',
            }}
            footerLinks={[
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
            ]}
            className="h-full"
          >
            <Card title="Welcome to The New Fuse">
              <p>This is a demo of the Layout component</p>
            </Card>
          </Layout>
        </div>
      </Container>

      <Container size="lg" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">UI Components</h2>

        <Card title="Badge Component" className="mb-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge size="sm">Small</Badge>
            <Badge size="lg">Large</Badge>
            <Badge dismissible onDismiss={() => alert('Dismissed')}>Dismissible</Badge>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card title="Button Component">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button isLoading>Loading</Button>
            </div>
          </Card>

          <Card title="Input Component">
            <div className="space-y-4">
              <Input placeholder="Default input" />
              <Input label="With Label" placeholder="Labeled input" />
              <Input
                label="With Error"
                placeholder="Error input"
                error="This field is required"
              />
              <Input
                label="With Success"
                placeholder="Success input"
                success="Looks good!"
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Select Component">
            <div className="space-y-4">
              <Select
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
              <Select
                label="With Label"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
              <Select
                label="With Error"
                error="Please select an option"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>
          </Card>

          <Card title="Card Component">
            <div className="space-y-4">
              <Card variant="default" size="sm" className="p-4">
                Default Card
              </Card>
              <Card variant="outline" size="sm" className="p-4">
                Outline Card
              </Card>
              <Card variant="elevated" size="sm" className="p-4">
                Elevated Card
              </Card>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
};
