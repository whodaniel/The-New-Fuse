import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip.js';
import { Button } from '../Button.js';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
    },
    delayDuration: { control: 'number' },
    disabled: { control: 'boolean' },
    skipDelayDuration: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 justify-center">
      <Tooltip content="Top tooltip" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <Button>Right</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <Button>Left</Button>
      </Tooltip>
    </div>
  ),
};

export const WithDelay: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 justify-center">
      <Tooltip content="Default delay (700ms)">
        <Button>Default Delay</Button>
      </Tooltip>
      <Tooltip content="Short delay (200ms)" delayDuration={200}>
        <Button>Short Delay</Button>
      </Tooltip>
      <Tooltip content="Long delay (1500ms)" delayDuration={1500}>
        <Button>Long Delay</Button>
      </Tooltip>
      <Tooltip content="No delay" skipDelayDuration>
        <Button>No Delay</Button>
      </Tooltip>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 justify-center">
      <Tooltip content="Enabled tooltip">
        <Button>Enabled</Button>
      </Tooltip>
      <Tooltip content="Disabled tooltip" disabled>
        <Button>Disabled</Button>
      </Tooltip>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <div className="flex flex-col items-center gap-4">
        <Tooltip content="Controlled tooltip" open={open} onOpenChange={setOpen}>
          <Button>Hover or click buttons below</Button>
        </Tooltip>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Show Tooltip
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Hide Tooltip
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
            Toggle Tooltip
          </Button>
        </div>
      </div>
    );
  },
};

export const WithRichContent: Story = {
  render: () => (
    <Tooltip
      content={
        <div className="max-w-xs">
          <h4 className="font-semibold mb-1">Rich Tooltip</h4>
          <p className="text-xs">
            This tooltip contains rich content including text formatting, links, and more.
          </p>
          <div className="mt-2 pt-2 border-t border-border">
            <a href="#" className="text-xs text-primary hover:underline">
              Learn more
            </a>
          </div>
        </div>
      }
    >
      <Button>Rich Content</Button>
    </Tooltip>
  ),
};
