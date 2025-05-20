import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureFlags } from '../FeatureFlags.js';
import { useFeatureFlags } from '../../../hooks/useFeatureFlags.js';

jest.mock('../../../hooks/useFeatureFlags');

describe('FeatureFlags', () => {
  const mockFlags = [
    {
      name: 'testFeature',
      enabled: true,
      environment: 'development',
      updatedAt: '2024-03-01'
    }
  ];

  beforeEach(() => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      flags: mockFlags,
      updateFlag: jest.fn(),
      loading: false
    });
  });

  it('renders feature flags list', () => {
    render(<FeatureFlags />);
    expect(screen.getByText('testFeature')).toBeInTheDocument();
  });

  it('handles flag toggle', async () => {
    const mockUpdateFlag = jest.fn();
    (useFeatureFlags as jest.Mock).mockReturnValue({
      flags: mockFlags,
      updateFlag: mockUpdateFlag,
      loading: false
    });

    render(<FeatureFlags />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    expect(mockUpdateFlag).toHaveBeenCalledWith('testFeature', false);
  });
});
