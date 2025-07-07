import React from 'react';
import { render, screen } from '@testing-library/react';
import Popup from '../../popup/components/Popup.js';

describe('Popup Component', () => {
  it('renders the header with title', () => {
    render(<Popup />);
    expect(screen.getByText('The New Fuse')).toBeInTheDocument();
  });

  it('renders the message input area', () => {
    render(<Popup />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });
});
