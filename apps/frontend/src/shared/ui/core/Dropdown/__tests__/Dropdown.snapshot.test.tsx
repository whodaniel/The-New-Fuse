import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Dropdown } from '../Dropdown.js';

describe('Dropdown Snapshots', () => {
  it('renders basic dropdown correctly', () => {
    assertSnapshot(
      <Dropdown>
        <Dropdown.Trigger>Open Menu</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item>Item 1</Dropdown.Item>
          <Dropdown.Item>Item 2</Dropdown.Item>
          <Dropdown.Item>Item 3</Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>
    );
  });

  it('renders dropdown with sections and separators', () => {
    assertSnapshot(
      <Dropdown>
        <Dropdown.Trigger>Menu</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Group>
            <Dropdown.Label>User</Dropdown.Label>
            <Dropdown.Item>Profile</Dropdown.Item>
            <Dropdown.Item>Settings</Dropdown.Item>
          </Dropdown.Group>
          <Dropdown.Separator />
          <Dropdown.Group>
            <Dropdown.Label>Account</Dropdown.Label>
            <Dropdown.Item>Billing</Dropdown.Item>
            <Dropdown.Item>Subscription</Dropdown.Item>
          </Dropdown.Group>
        </Dropdown.Content>
      </Dropdown>
    );
  });

  it('renders dropdown with disabled items', () => {
    assertSnapshot(
      <Dropdown>
        <Dropdown.Trigger>Actions</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item>Edit</Dropdown.Item>
          <Dropdown.Item disabled>Delete</Dropdown.Item>
          <Dropdown.Separator />
          <Dropdown.Item>Share</Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>
    );
  });

  it('renders dropdown with icons', () => {
    assertSnapshot(
      <Dropdown>
        <Dropdown.Trigger>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" />
            Options
          </span>
        </Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" />
            Edit
          </Dropdown.Item>
          <Dropdown.Item>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" />
            Delete
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>
    );
  });

  it('renders dropdown with checkbox items', () => {
    assertSnapshot(
      <Dropdown>
        <Dropdown.Trigger>Filters</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.CheckboxItem checked>
            Show Archived
          </Dropdown.CheckboxItem>
          <Dropdown.CheckboxItem>
            Show Deleted
          </Dropdown.CheckboxItem>
          <Dropdown.Separator />
          <Dropdown.CheckboxItem checked disabled>
            Show System Files
          </Dropdown.CheckboxItem>
        </Dropdown.Content>
      </Dropdown>
    );
  });
});