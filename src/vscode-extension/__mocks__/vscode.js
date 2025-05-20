const vscode = {
    window: {
        createOutputChannel: jest.fn(() => ({
            appendLine: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn(),
            show: jest.fn()
        })),
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        withProgress: jest.fn()
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn(),
            has: jest.fn()
        })),
        workspaceFolders: [],
        openTextDocument: jest.fn(() => ({
            getText: jest.fn(),
            save: jest.fn()
        })),
        applyEdit: jest.fn()
    },
    commands: {
        registerCommand: jest.fn(),
        executeCommand: jest.fn()
    },
    Uri: {
        file: jest.fn(f => ({ fsPath: f })),
        parse: jest.fn()
    },
    Position: jest.fn(),
    Range: jest.fn(),
    Location: jest.fn(),
    StatusBarAlignment: {},
    StatusBarItem: jest.fn(),
    ThemeColor: jest.fn(),
    ThemeIcon: jest.fn(),
    WebviewPanel: jest.fn(),
    ViewColumn: {},
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2
    },
    TreeItem: jest.fn(),
    ProgressLocation: {
        SourceControl: 1,
        Window: 10,
        Notification: 15
    },
    EventEmitter: jest.fn(),
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3
    }
};

module.exports = vscode;