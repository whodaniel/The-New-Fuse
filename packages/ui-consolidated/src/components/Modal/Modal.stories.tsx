import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalCloseButton,
} from './Modal.js';
import { Button } from '../Button.js';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: { type: 'select' },
      options: ['default', 'top', 'bottom'],
    },
    closeOnClickOutside: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} open={open} onOpenChange={setOpen}>
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader>
              <ModalTitle>Modal Title</ModalTitle>
              <ModalDescription>This is a description of the modal.</ModalDescription>
            </ModalHeader>
            <div className="py-4">
              <p>This is the modal content. You can put anything here.</p>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Continue</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const Sizes: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');
    
    const openModal = (selectedSize: typeof size) => {
      setSize(selectedSize);
      setOpen(true);
    };
    
    return (
      <>
        <div className="flex gap-2">
          <Button onClick={() => openModal('sm')}>Small</Button>
          <Button onClick={() => openModal('md')}>Medium</Button>
          <Button onClick={() => openModal('lg')}>Large</Button>
          <Button onClick={() => openModal('xl')}>X-Large</Button>
          <Button onClick={() => openModal('2xl')}>2X-Large</Button>
        </div>
        <Modal {...args} open={open} onOpenChange={setOpen}>
          <ModalContent size={size}>
            <ModalCloseButton />
            <ModalHeader>
              <ModalTitle>{size.toUpperCase()} Modal</ModalTitle>
              <ModalDescription>This is a {size} sized modal.</ModalDescription>
            </ModalHeader>
            <div className="py-4">
              <p>This is the modal content. The size of this modal is {size}.</p>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Continue</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const Positions: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<'default' | 'top' | 'bottom'>('default');
    
    const openModal = (selectedPosition: typeof position) => {
      setPosition(selectedPosition);
      setOpen(true);
    };
    
    return (
      <>
        <div className="flex gap-2">
          <Button onClick={() => openModal('default')}>Center</Button>
          <Button onClick={() => openModal('top')}>Top</Button>
          <Button onClick={() => openModal('bottom')}>Bottom</Button>
        </div>
        <Modal {...args} open={open} onOpenChange={setOpen} position={position}>
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader>
              <ModalTitle>{position === 'default' ? 'Center' : position.charAt(0).toUpperCase() + position.slice(1)} Position</ModalTitle>
              <ModalDescription>This modal is positioned at the {position === 'default' ? 'center' : position}.</ModalDescription>
            </ModalHeader>
            <div className="py-4">
              <p>This is the modal content.</p>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Continue</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const WithForm: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Form Modal</Button>
        <Modal {...args} open={open} onOpenChange={setOpen}>
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader>
              <ModalTitle>Create Account</ModalTitle>
              <ModalDescription>Fill out the form below to create a new account.</ModalDescription>
            </ModalHeader>
            <form
              className="py-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter your password"
                />
              </div>
              <ModalFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Account</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </>
    );
  },
};

export const Confirmation: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>Delete Item</Button>
        <Modal {...args} open={open} onOpenChange={setOpen}>
          <ModalContent size="sm">
            <ModalHeader>
              <ModalTitle>Confirm Deletion</ModalTitle>
              <ModalDescription>This action cannot be undone.</ModalDescription>
            </ModalHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this item?</p>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setOpen(false)}>Delete</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  },
};
