import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Dialog } from '../Dialog.js';
import { Button } from '../../Button.js';

describe('Dialog Snapshots', () => {
  it('renders basic dialog correctly', () => {
    assertSnapshot(
      <Dialog open>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Basic Dialog</Dialog.Title>
            <Dialog.Description>
              This is a basic dialog content
            </Dialog.Description>
          </Dialog.Header>
          <p>Dialog content goes here</p>
        </Dialog.Content>
      </Dialog>
    );
  });

  it('renders dialog with actions', () => {
    assertSnapshot(
      <Dialog open>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Confirmation Dialog</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to perform this action?
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => {}}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => {}}>
              Confirm
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    );
  });

  it('renders dialog with custom width', () => {
    assertSnapshot(
      <Dialog open>
        <Dialog.Content className="max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>Wide Dialog</Dialog.Title>
          </Dialog.Header>
          <p>This is a wider dialog with custom max-width</p>
        </Dialog.Content>
      </Dialog>
    );
  });

  it('renders dialog with form content', () => {
    assertSnapshot(
      <Dialog open>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Edit Profile</Dialog.Title>
          </Dialog.Header>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                className="mt-1 block w-full rounded-md border p-2"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="mt-1 block w-full rounded-md border p-2"
                placeholder="Enter your email"
              />
            </div>
          </form>
          <Dialog.Footer>
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    );
  });

  it('renders dialog with custom close trigger', () => {
    assertSnapshot(
      <Dialog open>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Custom Close</Dialog.Title>
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
              ✕
            </Dialog.Close>
          </Dialog.Header>
          <p>Dialog with custom close button</p>
        </Dialog.Content>
      </Dialog>
    );
  });
});