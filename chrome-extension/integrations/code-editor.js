// Code editor integration with optimizations
class CodeEditorIntegration {
  constructor() {
    this.editor = null;
    this.editorType = null;
    this.completionObserver = null;
    this.modelDisposables = new Set();
    this.editorConfig = {
      monaco: {
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        snippetSuggestions: 'inline',
        formatOnPaste: true,
        formatOnType: true
      },
      ace: {
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showGutter: true,
        showLineNumbers: true
      }
    };
  }

  initialize() {
    this.detectEditor();
    if (this.editor) {
      this.setupEditorIntegration();
      this.optimizeEditor();
    }
  }

  detectEditor() {
    // Check for common code editors
    if (document.querySelector('.monaco-editor')) {
      this.editor = document.querySelector('.monaco-editor');
      this.editorType = 'monaco';
    } else if (document.querySelector('.ace_editor')) {
      this.editor = document.querySelector('.ace_editor');
      this.editorType = 'ace';
    } else if (document.querySelector('#codeInput')) {
      this.editor = document.querySelector('#codeInput');
      this.editorType = 'basic';
    }
  }

  setupEditorIntegration() {
    // Add action buttons
    this.injectEditorButtons();

    // Watch for completion widgets
    this.setupCompletionObserver();

    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  injectEditorButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'tnf-editor-actions';

    // Add VSCode sync button
    window.TheFuse.domUtils.injectButton(this.editor, {
      icon: '🔄',
      title: 'Sync with VSCode',
      onClick: () => this.syncWithVSCode()
    });

    // Add run in VSCode button
    window.TheFuse.domUtils.injectButton(this.editor, {
      icon: '▶️',
      title: 'Run in VSCode',
      onClick: () => this.runInVSCode()
    });
  }

  setupCompletionObserver() {
    // Watch for code completion widgets
    this.completionObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (this.isCompletionWidget(node)) {
            this.enhanceCompletionWidget(node);
          }
        });
      });
    });

    const target = this.editorType === 'basic' ? document.body : this.editor;
    this.completionObserver.observe(target, {
      childList: true,
      subtree: true
    });
  }

  isCompletionWidget(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    
    return node.classList.contains('suggest-widget') || // Monaco
           node.classList.contains('ace_autocomplete') || // Ace
           node.classList.contains('code-completion'); // Generic
  }

  enhanceCompletionWidget(widget) {
    // Add VSCode suggestion indicator
    const indicator = document.createElement('div');
    indicator.className = 'tnf-completion-source';
    indicator.textContent = 'VSCode AI';
    widget.appendChild(indicator);

    // Add action to use VSCode suggestions
    window.TheFuse.domUtils.injectButton(widget, {
      icon: '💡',
      title: 'Get VSCode suggestions',
      onClick: () => this.getVSCodeSuggestions()
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Alt + V to sync with VSCode
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'v') {
        e.preventDefault();
        this.syncWithVSCode();
      }
      
      // Ctrl/Cmd + Alt + R to run in VSCode
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'r') {
        e.preventDefault();
        this.runInVSCode();
      }
    });
  }

  getEditorContent() {
    if (this.editorType === 'basic') {
      return this.editor.value;
    }
    
    // For Monaco and Ace, we need to find the actual content
    const contentElement = this.editor.querySelector('.view-lines, .ace_content');
    return contentElement ? contentElement.textContent : '';
  }

  setEditorContent(content) {
    if (this.editorType === 'basic') {
      this.editor.value = content;
      return;
    }
    
    // For Monaco and Ace, we need to use their APIs
    if (window.monaco && this.editorType === 'monaco') {
      const model = window.monaco.editor.getModels()[0];
      if (model) {
        model.setValue(content);
      }
    } else if (window.ace && this.editorType === 'ace') {
      const aceEditor = window.ace.edit(this.editor);
      aceEditor.setValue(content);
    }
  }

  syncWithVSCode() {
    const code = this.getEditorContent();
    
    chrome.runtime.sendMessage({
      type: 'CODE_INPUT',
      code: code
    });

    window.TheFuse.domUtils.injectNotification('Code synced with VSCode');
    window.TheFuse.MessageLogger.log({
      type: 'code_sync',
      content: code,
      source: 'editor'
    });
  }

  runInVSCode() {
    const code = this.getEditorContent();
    
    chrome.runtime.sendMessage({
      type: 'TO_RELAY',
      data: {
        text: code,
        command: 'run',
        source: 'editor',
        timestamp: new Date().toISOString()
      }
    });

    window.TheFuse.domUtils.injectNotification('Running code in VSCode');
    window.TheFuse.MessageLogger.log({
      type: 'code_run',
      content: code,
      source: 'editor'
    });
  }

  optimizeEditor() {
    switch (this.editorType) {
      case 'monaco':
        this.optimizeMonaco();
        break;
      case 'ace':
        this.optimizeAce();
        break;
      case 'basic':
        this.optimizeBasicEditor();
        break;
    }
  }

  optimizeMonaco() {
    if (!window.monaco) return;

    const editor = window.monaco.editor.getEditors()[0];
    if (!editor) return;

    // Apply Monaco-specific optimizations
    editor.updateOptions(this.editorConfig.monaco);

    // Set up model change handling with debouncing
    const model = editor.getModel();
    if (model) {
      let changeTimeout;
      const disposable = model.onDidChangeContent(() => {
        clearTimeout(changeTimeout);
        changeTimeout = setTimeout(() => this.handleEditorChange(), 500);
      });
      this.modelDisposables.add(disposable);
    }

    // Add custom actions
    editor.addAction({
      id: 'vscode-sync',
      label: 'Sync with VSCode',
      keybindings: [
        window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Alt | window.monaco.KeyCode.KeyV
      ],
      run: () => this.syncWithVSCode()
    });

    // Optimize the suggestion widget
    const suggestWidget = editor._contentWidgets?.["editor.widget.suggestWidget"];
    if (suggestWidget) {
      suggestWidget.updateOptions({
        suggestOnTriggerCharacters: true,
        suggestSelection: 'recentlyUsed',
        snippetSuggestions: 'inline'
      });
    }
  }

  optimizeAce() {
    if (!window.ace) return;

    const editor = window.ace.edit(this.editor);
    
    // Apply Ace-specific optimizations
    editor.setOptions(this.editorConfig.ace);

    // Add custom keybindings
    editor.commands.addCommand({
      name: 'syncWithVSCode',
      bindKey: { win: 'Ctrl-Alt-V', mac: 'Command-Alt-V' },
      exec: () => this.syncWithVSCode()
    });

    // Set up change handling with debouncing
    let changeTimeout;
    editor.session.on('change', () => {
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(() => this.handleEditorChange(), 500);
    });

    // Optimize autocompletion
    if (window.ace.require) {
      const langTools = window.ace.require('ace/ext/language_tools');
      if (langTools) {
        editor.setOptions({
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true
        });

        // Add custom completer for VSCode suggestions
        langTools.addCompleter({
          getCompletions: (editor, session, pos, prefix, callback) => {
            this.getVSCodeSuggestions()
              .then(suggestions => {
                callback(null, suggestions.map(s => ({
                  caption: s.label,
                  value: s.insertText || s.label,
                  meta: 'VSCode',
                  score: 1000 // Prioritize VSCode suggestions
                })));
              })
              .catch(() => callback(null, []));
          }
        });
      }
    }
  }

  optimizeBasicEditor() {
    if (!this.editor) return;

    // Add basic syntax highlighting using highlight.js
    this.editor.className += ' code-input hljs';
    this.editor.setAttribute('spellcheck', 'false');
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.setAttribute('autocorrect', 'off');
    this.editor.setAttribute('autocapitalize', 'off');

    // Handle tab key
    this.editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        this.editor.value = 
          this.editor.value.substring(0, start) + 
          '  ' + 
          this.editor.value.substring(end);
        this.editor.selectionStart = this.editor.selectionEnd = start + 2;
      }
    });

    // Set up change handling with debouncing
    let changeTimeout;
    this.editor.addEventListener('input', () => {
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(() => this.handleEditorChange(), 500);
    });
  }

  handleEditorChange() {
    const content = this.getEditorContent();
    if (!content) return;

    // Check if content is valid code
    try {
      // Simple syntax validation
      new Function(content);
      
      // Request suggestions from VSCode
      this.getVSCodeSuggestions();
    } catch (error) {
      // Ignore syntax errors during typing
    }
  }

  // Enhanced VSCode suggestion handling
  async getVSCodeSuggestions() {
    const code = this.getEditorContent();
    const cursorPosition = this.getCursorPosition();
    
    chrome.runtime.sendMessage({
      type: 'CODE_INPUT',
      code: code,
      requestSuggestions: true,
      cursor: cursorPosition
    });

    window.TheFuse.domUtils.injectNotification('Getting suggestions from VSCode');
  }

  getCursorPosition() {
    switch (this.editorType) {
      case 'monaco':
        const editor = window.monaco.editor.getEditors()[0];
        const position = editor?.getPosition();
        return position ? { line: position.lineNumber - 1, column: position.column - 1 } : null;
      
      case 'ace':
        const aceEditor = window.ace.edit(this.editor);
        const pos = aceEditor.getCursorPosition();
        return pos ? { line: pos.row, column: pos.column } : null;
      
      case 'basic':
        const lines = this.editor.value.substr(0, this.editor.selectionStart).split('\n');
        return {
          line: lines.length - 1,
          column: lines[lines.length - 1].length
        };
      
      default:
        return null;
    }
  }

  handleVSCodeResponse(response) {
    if (response.type === 'AI_OUTPUT') {
      this.setEditorContent(response.code);
      
      window.TheFuse.domUtils.injectNotification('Received code from VSCode', 'success');
      window.TheFuse.MessageLogger.log({
        type: 'code_received',
        content: response.code,
        source: 'vscode'
      });
    }
  }

  cleanup() {
    if (this.completionObserver) {
      this.completionObserver.disconnect();
    }
    
    // Clean up Monaco model listeners
    this.modelDisposables.forEach(d => d.dispose());
    this.modelDisposables.clear();

    // Clean up Ace editor
    if (this.editorType === 'ace' && window.ace) {
      const editor = window.ace.edit(this.editor);
      editor.destroy();
    }
  }
}

// Export integration
window.TheFuse = window.TheFuse || {};
window.TheFuse.CodeEditorIntegration = new CodeEditorIntegration();