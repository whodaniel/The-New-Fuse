import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Modal,
} from '../ConsolidatedDialog.js';

describe('Dialog', () => {
  it('renders dialog with trigger and content', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Dialog should be closed initially
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    
    // Open dialog
    await userEvent.click(screen.getByText('Open Dialog'));
    
    // Dialog should be open
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('renders modal when isOpen is true', () => {
    const handleClose = jest.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal Title">
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });
  
  it('does not render modal when isOpen is false', () => {
    const handleClose = jest.fn();
    
    render(
      <Modal isOpen={false} onClose={handleClose} title="Modal Title">
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Modal Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });
  
  it('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal Title">
        <div>Modal Content</div>
      </Modal>
    );
    
    // Click close button
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
