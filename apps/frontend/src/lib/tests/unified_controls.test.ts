import { UnifiedControlInterface } from '../unified_controls.js';

describe('UnifiedControlInterface', () => {
  let uiControl;

  beforeEach(() => {
    // Mock dependencies if necessary
    uiControl = new UnifiedControlInterface();
  });

  test('should register and execute shortcuts correctly', () => {
    const mockHandler = jest.fn();
    uiControl.registerShortcut('ctrl+k', mockHandler);

    // Simulate shortcut activation
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
    document.dispatchEvent(event);

    expect(mockHandler).toHaveBeenCalled();
  });

  test('should update command suggestions based on input', () => {
    uiControl.handleCommandInput({ target: { value: 'sea' } });
    const suggestions = uiControl.getCommandSuggestions('sea');

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ command: 'search', description: 'Search web content' }),
      ])
    );
  });

  test('should focus command palette on shortcut', () => {
    uiControl.focusCommandPalette = jest.fn();
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
    document.dispatchEvent(event);
    expect(uiControl.focusCommandPalette).toHaveBeenCalled();
  });

  test('should hide command palette on escape key', () => {
    uiControl.hideCommandPalette = jest.fn();
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(uiControl.hideCommandPalette).toHaveBeenCalled();
  });

  test('should execute command correctly', async () => {
    const mockHandleCommand = jest.fn();
    uiControl.handlers.handleCommand = mockHandleCommand;
    await uiControl.executeCommand('search');
    expect(mockHandleCommand).toHaveBeenCalledWith('search', '');
  });

  test('should switch tabs correctly', () => {
    const mockRefreshTabContent = jest.fn();
    uiControl.handlers.refreshTabContent = mockRefreshTabContent;
    uiControl.switchTab('browse');
    expect(uiControl.activeTab).toBe('browse');
    expect(mockRefreshTabContent).toHaveBeenCalledWith('browse');
  });

  test('should execute quick actions correctly', async () => {
    const mockStartBrowser = jest.fn();
    uiControl.handlers.startBrowser = mockStartBrowser;
    await uiControl.executeQuickAction('browser');
    expect(mockStartBrowser).toHaveBeenCalled();
  });

  test('should show error correctly', () => {
    const mockCreateElement = jest.spyOn(document, 'createElement');
    uiControl.showError('Test error');
    expect(mockCreateElement).toHaveBeenCalledWith('div');
  });

  test('should update tab content correctly', () => {
    const mockRefreshTabContent = jest.fn();
    uiControl.handlers.refreshTabContent = mockRefreshTabContent;
    uiControl.updateTabContent('api');
    expect(mockRefreshTabContent).toHaveBeenCalledWith('api');
  });

  test('should handle command keydown correctly', () => {
    const mockExecuteCommand = jest.fn();
    uiControl.executeCommand = mockExecuteCommand;
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(event);
    expect(mockExecuteCommand).toHaveBeenCalled();
  });

  test('should navigate command history with arrow keys', () => {
    uiControl.commandHistory = ['search', 'browse', 'screenshot'];
    const commandInput = document.createElement('input');
    commandInput.id = 'commandInput';
    document.body.appendChild(commandInput);

    const eventUp = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown' });

    // Simulate navigating up through history
    uiControl.handleCommandKeydown(eventUp);
    expect(commandInput.value).toBe('screenshot');
    uiControl.handleCommandKeydown(eventUp);
    expect(commandInput.value).toBe('browse');
    uiControl.handleCommandKeydown(eventUp);
    expect(commandInput.value).toBe('search');

    // Simulate navigating down through history
    uiControl.handleCommandKeydown(eventDown);
    expect(commandInput.value).toBe('browse');
    uiControl.handleCommandKeydown(eventDown);
    expect(commandInput.value).toBe('screenshot');
    uiControl.handleCommandKeydown(eventDown);
    expect(commandInput.value).toBe('');
  });
});

export {};
