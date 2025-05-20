
import { UnifiedControlInterface } from '../unified_controls.js';

describe('Command Palette Tests', () => {
  let commandPalette;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="command-palette" class="command-palette" style="display: none;">
        <input id="commandInput" type="text" />
      </div>
    `;
    commandPalette = new UnifiedControlInterface();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should show command palette on ctrl+k', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
    document.dispatchEvent(event);
    expect(document.getElementById('command-palette').style.display).toBe('block');
  });

  test('should filter command suggestions correctly', () => {
    const input = 'scr';
    const suggestions = commandPalette.getCommandSuggestions(input);
    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ command: 'scrape' }),
        expect.objectContaining({ command: 'screenshot' })
      ])
    );
  });

  test('should execute valid commands', async () => {
    const mockHandler = jest.fn();
    commandPalette.handlers.handleCommand = mockHandler;
    
    const input = document.getElementById('commandInput');
    if (input) {
      input.value = '/search test query';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
      expect(mockHandler).toHaveBeenCalledWith('search', 'test query');
    }
  });
});
export {};
