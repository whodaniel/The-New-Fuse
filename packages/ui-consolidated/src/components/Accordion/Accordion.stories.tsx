import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './Accordion.js';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['single', 'multiple'],
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'bordered', 'ghost'],
    },
    collapsible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
    defaultValue: 'item-1',
  },
  render: (args) => (
    <Accordion className="w-[400px]" {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['item-1', 'item-3'],
  },
  render: (args) => (
    <Accordion className="w-[400px]" {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>First item</AccordionTrigger>
        <AccordionContent>
          This is the first item's content. You can open multiple items at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second item</AccordionTrigger>
        <AccordionContent>
          This is the second item's content. Try opening this while the others are open.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third item</AccordionTrigger>
        <AccordionContent>
          This is the third item's content. Multiple items can be open simultaneously.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-2 text-sm font-medium">Default</h3>
        <Accordion type="single" defaultValue="item-1" className="w-[400px]">
          <AccordionItem value="item-1">
            <AccordionTrigger>Default variant</AccordionTrigger>
            <AccordionContent>
              This is the default variant of the accordion.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Another item</AccordionTrigger>
            <AccordionContent>
              This is another item in the default variant.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Bordered</h3>
        <Accordion type="single" defaultValue="item-1" variant="bordered" className="w-[400px]">
          <AccordionItem value="item-1">
            <AccordionTrigger>Bordered variant</AccordionTrigger>
            <AccordionContent>
              This is the bordered variant of the accordion.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Another item</AccordionTrigger>
            <AccordionContent>
              This is another item in the bordered variant.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Ghost</h3>
        <Accordion type="single" defaultValue="item-1" variant="ghost" className="w-[400px]">
          <AccordionItem value="item-1">
            <AccordionTrigger>Ghost variant</AccordionTrigger>
            <AccordionContent>
              This is the ghost variant of the accordion.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Another item</AccordionTrigger>
            <AccordionContent>
              This is another item in the ghost variant.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Enabled item</AccordionTrigger>
        <AccordionContent>
          This item is enabled and can be toggled.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Disabled item</AccordionTrigger>
        <AccordionContent>
          This content won't be visible because the item is disabled.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another enabled item</AccordionTrigger>
        <AccordionContent>
          This item is also enabled and can be toggled.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('item-1');
    
    return (
      <div className="flex flex-col gap-4">
        <Accordion
          type="single"
          value={value}
          onValueChange={setValue}
          className="w-[400px]"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>First item</AccordionTrigger>
            <AccordionContent>
              This accordion is controlled. The current value is: {value}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second item</AccordionTrigger>
            <AccordionContent>
              This accordion is controlled. The current value is: {value}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm border rounded-md"
            onClick={() => setValue('item-1')}
          >
            Open Item 1
          </button>
          <button
            className="px-3 py-1 text-sm border rounded-md"
            onClick={() => setValue('item-2')}
          >
            Open Item 2
          </button>
          <button
            className="px-3 py-1 text-sm border rounded-md"
            onClick={() => setValue('')}
          >
            Close All
          </button>
        </div>
      </div>
    );
  },
};

export const WithCustomChevron: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger
          chevron={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          }
        >
          Custom chevron
        </AccordionTrigger>
        <AccordionContent>
          This accordion has a custom chevron icon.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger showChevron={false}>
          No chevron
        </AccordionTrigger>
        <AccordionContent>
          This accordion item has no chevron icon.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
