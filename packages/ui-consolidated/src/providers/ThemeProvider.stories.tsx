import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeProvider.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';
import { Input } from '../components/Input.js';
import { Select } from '../components/Select';
import { Checkbox } from '../components/Checkbox';
import { Switch } from '../components/Switch';

const meta: Meta<typeof ThemeProvider> = {
  title: 'Providers/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultTheme: {
      control: { type: 'select' },
      options: ['light', 'dark', 'system'],
    },
    storageKey: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

const ThemeInfo = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="mb-4 p-4 bg-muted rounded-md">
      <p className="mb-2">Current theme: <strong>{theme}</strong></p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setTheme('light')}>Light</Button>
        <Button size="sm" onClick={() => setTheme('dark')}>Dark</Button>
        <Button size="sm" onClick={() => setTheme('system')}>System</Button>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    defaultTheme: 'light',
    storageKey: 'ui-theme-demo',
  },
  render: (args) => (
    <ThemeProvider {...args}>
      <div className="w-[600px] p-6 bg-background text-foreground rounded-lg border border-border">
        <h2 className="text-2xl font-bold mb-4">Theme Demo</h2>
        <ThemeInfo />
        
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <Card className="mb-4">
          <Card.Header>
            <Card.Title>Theme Demonstration</Card.Title>
            <Card.Description>This card demonstrates the current theme.</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input label="Name" placeholder="Enter your name" />
                </div>
                <div>
                  <Select 
                    label="Country"
                    options={[
                      { value: 'us', label: 'United States' },
                      { value: 'ca', label: 'Canada' },
                      { value: 'uk', label: 'United Kingdom' },
                    ]}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Checkbox label="Subscribe to newsletter" />
                <Switch label="Enable notifications" />
              </div>
            </div>
          </Card.Content>
          <Card.Footer>
            <div className="flex gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Submit</Button>
            </div>
          </Card.Footer>
        </Card>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary text-primary-foreground rounded-md">Primary</div>
          <div className="p-4 bg-secondary text-secondary-foreground rounded-md">Secondary</div>
          <div className="p-4 bg-accent text-accent-foreground rounded-md">Accent</div>
          <div className="p-4 bg-muted text-muted-foreground rounded-md">Muted</div>
          <div className="p-4 bg-destructive text-destructive-foreground rounded-md">Destructive</div>
          <div className="p-4 bg-success text-success-foreground rounded-md">Success</div>
        </div>
      </div>
    </ThemeProvider>
  ),
};
