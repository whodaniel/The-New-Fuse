import { renderHook } from '@testing-library/react-hooks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle keyboard shortcuts when enabled', () => {
    const handler = jest.fn();
    const shortcuts = [
      { key: 'z', ctrlKey: true, handler, preventDefault: true }
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: true }));

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('should not handle shortcuts when disabled', () => {
    const handler = jest.fn();
    const shortcuts = [
      { key: 'z', ctrlKey: true, handler }
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple shortcuts', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const shortcuts = [
      { key: 'z', ctrlKey: true, handler: handler1 },
      { key: 'y', ctrlKey: true, handler: handler2 }
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    }));

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
    }));

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should handle case-insensitive key matching', () => {
    const handler = jest.fn();
    const shortcuts = [
      { key: 'Z', ctrlKey: true, handler }
    ];

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    }));

    expect(handler).toHaveBeenCalled();
  });
});