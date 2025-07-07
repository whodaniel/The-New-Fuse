/**
 * Tests for CodeSnippetsManager
 */
import { CodeSnippetsManager } from '../../utils/code-snippets.js';

describe('CodeSnippetsManager', () => {
  let codeSnippetsManager: CodeSnippetsManager;
  
  beforeEach(() => {
    // Mock chrome.storage.local.get
    chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
      callback({ codeSnippets: [] });
    });
    
    // Mock chrome.storage.local.set
    chrome.storage.local.set = jest.fn().mockImplementation((data, callback) => {
      if (callback) callback();
    });
    
    // Create CodeSnippetsManager
    codeSnippetsManager = new CodeSnippetsManager();
  });
  
  test('should create a CodeSnippetsManager instance', () => {
    expect(codeSnippetsManager).toBeInstanceOf(CodeSnippetsManager);
  });
  
  test('should add a snippet', () => {
    const snippet = {
      name: 'Test Snippet',
      language: 'javascript',
      code: 'console.log("Hello, world!");',
      description: 'A simple test snippet',
      tags: ['test', 'javascript']
    };
    
    const id = codeSnippetsManager.addSnippet(snippet);
    
    // Verify ID format
    expect(id).toMatch(/^snippet_\d+_[a-z0-9]+$/);
    
    // Verify storage was updated
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });
  
  test('should update a snippet', () => {
    // Add a snippet first
    const snippet = {
      name: 'Test Snippet',
      language: 'javascript',
      code: 'console.log("Hello, world!");'
    };
    
    const id = codeSnippetsManager.addSnippet(snippet);
    
    // Update the snippet
    const updated = codeSnippetsManager.updateSnippet(id, {
      name: 'Updated Snippet',
      code: 'console.log("Updated!");'
    });
    
    // Verify result
    expect(updated).toBe(true);
    
    // Verify storage was updated
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(2);
  });
  
  test('should delete a snippet', () => {
    // Add a snippet first
    const snippet = {
      name: 'Test Snippet',
      language: 'javascript',
      code: 'console.log("Hello, world!");'
    };
    
    const id = codeSnippetsManager.addSnippet(snippet);
    
    // Delete the snippet
    const deleted = codeSnippetsManager.deleteSnippet(id);
    
    // Verify result
    expect(deleted).toBe(true);
    
    // Verify storage was updated
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(2);
  });
  
  test('should get a snippet by ID', () => {
    // Add a snippet first
    const snippet = {
      name: 'Test Snippet',
      language: 'javascript',
      code: 'console.log("Hello, world!");'
    };
    
    const id = codeSnippetsManager.addSnippet(snippet);
    
    // Mock storage to return our snippets
    chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
      callback({
        codeSnippets: [
          {
            id,
            ...snippet,
            created: expect.any(Number),
            modified: expect.any(Number)
          }
        ]
      });
    });
    
    // Create a new manager to load from storage
    const newManager = new CodeSnippetsManager();
    
    // Get the snippet
    const retrievedSnippet = newManager.getSnippet(id);
    
    // Verify result
    expect(retrievedSnippet).not.toBeNull();
    expect(retrievedSnippet?.name).toBe(snippet.name);
    expect(retrievedSnippet?.language).toBe(snippet.language);
    expect(retrievedSnippet?.code).toBe(snippet.code);
  });
  
  test('should search snippets', () => {
    // Add snippets
    const snippet1 = {
      name: 'JavaScript Function',
      language: 'javascript',
      code: 'function hello() { console.log("Hello"); }',
      tags: ['function', 'javascript']
    };
    
    const snippet2 = {
      name: 'Python Function',
      language: 'python',
      code: 'def hello():\n    print("Hello")',
      tags: ['function', 'python']
    };
    
    codeSnippetsManager.addSnippet(snippet1);
    codeSnippetsManager.addSnippet(snippet2);
    
    // Mock storage to return our snippets
    chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
      callback({
        codeSnippets: [
          {
            id: 'snippet_1',
            ...snippet1,
            created: 1,
            modified: 1
          },
          {
            id: 'snippet_2',
            ...snippet2,
            created: 2,
            modified: 2
          }
        ]
      });
    });
    
    // Create a new manager to load from storage
    const newManager = new CodeSnippetsManager();
    
    // Search for JavaScript snippets
    const jsSnippets = newManager.searchSnippets('javascript');
    
    // Verify result
    expect(jsSnippets).toHaveLength(1);
    expect(jsSnippets[0].name).toBe(snippet1.name);
    
    // Search for function snippets
    const functionSnippets = newManager.searchSnippets('function');
    
    // Verify result
    expect(functionSnippets).toHaveLength(2);
    
    // Filter by language
    const pythonSnippets = newManager.filterByLanguage('python');
    
    // Verify result
    expect(pythonSnippets).toHaveLength(1);
    expect(pythonSnippets[0].name).toBe(snippet2.name);
    
    // Filter by tag
    const pythonTagSnippets = newManager.filterByTag('python');
    
    // Verify result
    expect(pythonTagSnippets).toHaveLength(1);
    expect(pythonTagSnippets[0].name).toBe(snippet2.name);
  });
  
  test('should import and export snippets', () => {
    // Add a snippet
    const snippet = {
      name: 'Test Snippet',
      language: 'javascript',
      code: 'console.log("Hello, world!");'
    };
    
    codeSnippetsManager.addSnippet(snippet);
    
    // Export snippets
    const exported = codeSnippetsManager.exportSnippets();
    
    // Verify export format
    expect(exported).toContain('"name":"Test Snippet"');
    expect(exported).toContain('"language":"javascript"');
    expect(exported).toContain('"code":"console.log(\\"Hello, world!\\");"');
    
    // Clear snippets
    codeSnippetsManager.clearSnippets();
    
    // Import snippets
    const imported = codeSnippetsManager.importSnippets(JSON.parse(exported));
    
    // Verify import result
    expect(imported).toBe(1);
    
    // Verify storage was updated
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(3);
  });
});
