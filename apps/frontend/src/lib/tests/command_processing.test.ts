import { UserInterfaceHandlers } from '../handlers.js';

describe('Command Processing', () => {
  let uiHandlers;

  beforeEach(() => {
    uiHandlers = new UserInterfaceHandlers();
  });

  test('should execute known command: /search', async () => {
    uiHandlers.handleSearchCommand = jest.fn();

    await uiHandlers.handleCommand('search', 'test query');

    expect(uiHandlers.handleSearchCommand).toHaveBeenCalledWith('test query');
  });

  test('should execute command: /screenshot', async () => {
    uiHandlers.takeScreenshot = jest.fn();
    await uiHandlers.handleCommand('screenshot', '');
    expect(uiHandlers.takeScreenshot).toHaveBeenCalled();
  });

  test('should execute command: /export', async () => {
    uiHandlers.exportResults = jest.fn();
    await uiHandlers.handleCommand('export', '');
    expect(uiHandlers.exportResults).toHaveBeenCalled();
  });

  test('should execute command: /help', async () => {
    uiHandlers.showHelp = jest.fn();
    await uiHandlers.handleCommand('help', '');
    expect(uiHandlers.showHelp).toHaveBeenCalled();
  });

  test('should throw error for unknown command', async () => {
    await expect(uiHandlers.handleCommand('unknown', 'args')).rejects.toThrow('Unknown command: unknown');
  });

  // Add more tests for other commands
});

// command_processing.test.js

describe('UnifiedControls', () => {
  let controls;

  beforeEach(() => {
    controls = new UnifiedControls();
    controls.handlers = {
      handleSearch: jest.fn(),
      handleScreenshot: jest.fn(),
      handleExport: jest.fn(),
      handleHelp: jest.fn()
    };
  });

  test('should suggest matching commands', () => {
    const suggestions = controls.getCommandSuggestions('sc');
    expect(suggestions).toEqual([
      expect.objectContaining({ command: 'screenshot' }),
      expect.objectContaining({ command: 'search' })
    ]);
  });

  test('should execute valid command', async () => {
    await controls.executeCommand('search test query');
    expect(controls.handlers.handleSearch).toHaveBeenCalledWith('test query');
  });

  test('should throw on unknown command', async () => {
    await expect(controls.executeCommand('unknown')).rejects
      .toThrow('Unknown command');
  });

  test('should throw on missing required args', async () => {
    await expect(controls.executeCommand('search')).rejects
      .toThrow('Invalid usage');
  });
});
export {};
