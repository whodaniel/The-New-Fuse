import type { Meta, StoryObj } from '@storybook/react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from './Dropdown.js';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'select' },
      options: ['auto', 'full'],
    },
    defaultOpen: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <DropdownTrigger>Options</DropdownTrigger>
      <DropdownContent>
        <DropdownItem>Profile</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Help</DropdownItem>
        <DropdownSeparator />
        <DropdownItem variant="destructive">Logout</DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <DropdownTrigger>Account</DropdownTrigger>
      <DropdownContent>
        <DropdownItem
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          }
        >
          Profile
        </DropdownItem>
        <DropdownItem
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          }
        >
          Settings
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          variant="destructive"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          }
        >
          Logout
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

export const WithLabels: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <DropdownTrigger>Categories</DropdownTrigger>
      <DropdownContent width="md">
        <DropdownLabel>Frontend</DropdownLabel>
        <DropdownItem>React</DropdownItem>
        <DropdownItem>Vue</DropdownItem>
        <DropdownItem>Angular</DropdownItem>
        <DropdownSeparator />
        <DropdownLabel>Backend</DropdownLabel>
        <DropdownItem>Node.js</DropdownItem>
        <DropdownItem>Python</DropdownItem>
        <DropdownItem>Ruby</DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

export const CustomTrigger: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <DropdownTrigger variant="outline" size="sm">
        Actions
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem>Edit</DropdownItem>
        <DropdownItem>Duplicate</DropdownItem>
        <DropdownItem>Archive</DropdownItem>
        <DropdownSeparator />
        <DropdownItem variant="destructive">Delete</DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

export const DisabledItems: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <DropdownTrigger>Status</DropdownTrigger>
      <DropdownContent>
        <DropdownItem>Active</DropdownItem>
        <DropdownItem disabled>Pending</DropdownItem>
        <DropdownItem>Draft</DropdownItem>
        <DropdownItem disabled>Archived</DropdownItem>
      </DropdownContent>
    </Dropdown>
  ),
};

export const PositionVariants: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <Dropdown {...args}>
        <DropdownTrigger>Bottom Start</DropdownTrigger>
        <DropdownContent position="bottom-start">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </DropdownContent>
      </Dropdown>
      
      <Dropdown {...args}>
        <DropdownTrigger>Bottom End</DropdownTrigger>
        <DropdownContent position="bottom-end">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </DropdownContent>
      </Dropdown>
      
      <Dropdown {...args}>
        <DropdownTrigger>Top Start</DropdownTrigger>
        <DropdownContent position="top-start">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </DropdownContent>
      </Dropdown>
      
      <Dropdown {...args}>
        <DropdownTrigger>Top End</DropdownTrigger>
        <DropdownContent position="top-end">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  ),
};
