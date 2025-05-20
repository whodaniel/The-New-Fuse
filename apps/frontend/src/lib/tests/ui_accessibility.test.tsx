
import { UnifiedControlInterface } from '../unified_controls.js';

describe('UI Accessibility Tests', () => {
  let ui;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="command-palette" class="command-palette" style="display: none;">
        <input id="commandInput" type="text" />
        <div class="suggestion-list">
          <div class="suggestion-item" tabindex="0">Suggestion 1</div>
          <div class="suggestion-item" tabindex="0">Suggestion 2</div>
        </div>
      </div>
    `;
    ui = new UnifiedControlInterface();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should navigate suggestions with arrow keys', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    document.dispatchEvent(event);
    const suggestionItem = document.querySelector('.suggestion-item');
    expect(suggestionItem).toBe(document.activeElement);
  });

  test('should close dialogs with escape key', () => {
    // First make the palette visible
    const palette = document.getElementById('command-palette');
    palette.style.display = 'block';
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(palette.style.display).toBe('none');
  });

  test('should focus command input on palette open', () => {
    ui.toggleCommandPalette();
    expect(document.activeElement.id).toBe('commandInput');
  });
});
export {};
