import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Modal } from '../Modal.js';
import { Button } from '../../Button.js';

describe('Modal Snapshots', () => {
  it('renders basic modal correctly', () => {
    assertSnapshot(
      <Modal isOpen onClose={() => {}}>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Basic Modal</h2>
          <p>This is a basic modal content</p>
        </div>
      </Modal>
    );
  });

  it('renders modal with header and footer', () => {
    assertSnapshot(
      <Modal isOpen onClose={() => {}}>
        <Modal.Header>
          <Modal.Title>Modal Title</Modal.Title>
          <Modal.Description>This is a modal description</Modal.Description>
        </Modal.Header>
        
        <Modal.Content>
          <p>Modal content goes here</p>
        </Modal.Content>

        <Modal.Footer>
          <Button variant="outline" onClick={() => {}}>Cancel</Button>
          <Button onClick={() => {}}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    );
  });

  it('renders modal with custom width', () => {
    assertSnapshot(
      <Modal isOpen onClose={() => {}} className="max-w-2xl">
        <Modal.Content>
          <p>Wide modal content</p>
        </Modal.Content>
      </Modal>
    );
  });

  it('renders modal with close button', () => {
    assertSnapshot(
      <Modal isOpen onClose={() => {}} showCloseButton>
        <Modal.Content>
          <p>Modal with close button</p>
        </Modal.Content>
      </Modal>
    );
  });

  it('renders modal with custom overlay styles', () => {
    assertSnapshot(
      <Modal 
        isOpen 
        onClose={() => {}}
        overlayClassName="bg-black/80 backdrop-blur-sm"
      >
        <Modal.Content>
          <p>Modal with custom overlay</p>
        </Modal.Content>
      </Modal>
    );
  });
});