
import { UnifiedControlInterface } from '../unified_controls.js';

describe('Keyboard Shortcuts Tests', () => {
  let shortcuts;

  beforeEach(() => {
    shortcuts = new UnifiedControlInterface();
  });

  test('should register custom shortcuts', () => {
    const handler = jest.fn();
    shortcuts.registerShortcut('ctrl+t', handler);
    
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 't' });
    document.dispatchEvent(event);
    expect(handler).toHaveBeenCalled();
  });

  test('should handle multiple modifiers', () => {
    const handler = jest.fn();
    shortcuts.registerShortcut('ctrl+shift+s', handler);
    
    const event = new KeyboardEvent('keydown', { 
      ctrlKey: true, 
      shiftKey: true, 
      key: 's' 
    });
    document.dispatchEvent(event);
    expect(handler).toHaveBeenCalled();
  });
});
export {};
