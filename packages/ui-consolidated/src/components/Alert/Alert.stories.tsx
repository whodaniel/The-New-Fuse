import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from './Alert.js';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'info', 'success', 'warning', 'error'],
    },
    dismissible: { control: 'boolean' },
    onDismiss: { action: 'dismissed' },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: (args) => (
    <Alert className="w-[400px]" {...args}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const Info: Story = {
  render: (args) => (
    <Alert variant="info" className="w-[400px]" {...args}>
      <AlertTitle>Note</AlertTitle>
      <AlertDescription>
        This is an informational message.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: (args) => (
    <Alert variant="success" className="w-[400px]" {...args}>
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Your changes have been saved successfully.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: (args) => (
    <Alert variant="warning" className="w-[400px]" {...args}>
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Your account is about to expire.
      </AlertDescription>
    </Alert>
  ),
};

export const Error: Story = {
  render: (args) => (
    <Alert variant="error" className="w-[400px]" {...args}>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        There was a problem with your request.
      </AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <Alert 
      variant="info" 
      className="w-[400px]" 
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      }
      {...args}
    >
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        This alert includes an icon for better visibility.
      </AlertDescription>
    </Alert>
  ),
};

export const Dismissible: Story = {
  render: (args) => (
    <Alert 
      variant="success" 
      className="w-[400px]" 
      dismissible
      onDismiss={() => console.log('Alert dismissed')}
      {...args}
    >
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        This alert can be dismissed by clicking the close button.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutTitle: Story = {
  render: (args) => (
    <Alert className="w-[400px]" {...args}>
      <AlertDescription>
        This is an alert without a title.
      </AlertDescription>
    </Alert>
  ),
};

export const WithCustomContent: Story = {
  render: (args) => (
    <Alert variant="info" className="w-[400px]" {...args}>
      <AlertTitle>Custom Content</AlertTitle>
      <AlertDescription>
        <p className="mb-2">This alert contains custom content.</p>
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
          <code>npm install @the-new-fuse/ui-consolidated</code>
        </div>
      </AlertDescription>
    </Alert>
  ),
};
