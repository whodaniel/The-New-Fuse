import type { Meta, StoryObj } from '@storybook/react';
import { Split } from './Split.js';

const meta: Meta<typeof Split> = {
  title: 'Components/Split',
  component: Split,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
    initialSizes: { control: 'array' },
    minSize: { control: 'number' },
    resizable: { control: 'boolean' },
    gutterSize: { control: 'number' },
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof Split>;

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    initialSizes: [50, 50],
    minSize: 10,
    resizable: true,
    gutterSize: 4,
  },
  render: (args) => (
    <Split {...args} className="w-[800px] h-[400px] border border-border rounded-md">
      <div className="w-full h-full p-4 bg-muted">
        <h3 className="text-lg font-medium">Left Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the left panel content. You can resize this panel by dragging the gutter.
        </p>
      </div>
      <div className="w-full h-full p-4 bg-card">
        <h3 className="text-lg font-medium">Right Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the right panel content. You can resize this panel by dragging the gutter.
        </p>
      </div>
    </Split>
  ),
};

export const Vertical: Story = {
  args: {
    direction: 'vertical',
    initialSizes: [30, 70],
    minSize: 10,
    resizable: true,
    gutterSize: 4,
  },
  render: (args) => (
    <Split {...args} className="w-[800px] h-[400px] border border-border rounded-md">
      <div className="w-full h-full p-4 bg-muted">
        <h3 className="text-lg font-medium">Top Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the top panel content. You can resize this panel by dragging the gutter.
        </p>
      </div>
      <div className="w-full h-full p-4 bg-card">
        <h3 className="text-lg font-medium">Bottom Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the bottom panel content. You can resize this panel by dragging the gutter.
        </p>
      </div>
    </Split>
  ),
};

export const ThreePanels: Story = {
  args: {
    direction: 'horizontal',
    initialSizes: [25, 50, 25],
    minSize: 10,
    resizable: true,
    gutterSize: 4,
  },
  render: (args) => (
    <Split {...args} className="w-[800px] h-[400px] border border-border rounded-md">
      <div className="w-full h-full p-4 bg-muted">
        <h3 className="text-lg font-medium">Left Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the left panel content.
        </p>
      </div>
      <div className="w-full h-full p-4 bg-card">
        <h3 className="text-lg font-medium">Middle Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the middle panel content.
        </p>
      </div>
      <div className="w-full h-full p-4 bg-muted">
        <h3 className="text-lg font-medium">Right Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the right panel content.
        </p>
      </div>
    </Split>
  ),
};

export const NestedSplit: Story = {
  render: () => (
    <Split 
      direction="horizontal" 
      initialSizes={[30, 70]} 
      className="w-[800px] h-[400px] border border-border rounded-md"
    >
      <div className="w-full h-full p-4 bg-muted">
        <h3 className="text-lg font-medium">Left Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is the left panel content.
        </p>
      </div>
      <Split direction="vertical" initialSizes={[40, 60]}>
        <div className="w-full h-full p-4 bg-card">
          <h3 className="text-lg font-medium">Top Right Panel</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This is the top right panel content.
          </p>
        </div>
        <div className="w-full h-full p-4 bg-muted">
          <h3 className="text-lg font-medium">Bottom Right Panel</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This is the bottom right panel content.
          </p>
        </div>
      </Split>
    </Split>
  ),
};

export const NonResizable: Story = {
  args: {
    direction: 'horizontal',
    initialSizes: [30, 70],
    resizable: false,
  },
  render: (args) => (
    <Split {...args} className="w-[800px] h-[400px] border border-border rounded-md">
      <div className="w-full h-full p-4 bg-muted">
        <h3 className="text-lg font-medium">Left Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This panel is not resizable.
        </p>
      </div>
      <div className="w-full h-full p-4 bg-card">
        <h3 className="text-lg font-medium">Right Panel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This panel is not resizable.
        </p>
      </div>
    </Split>
  ),
};
