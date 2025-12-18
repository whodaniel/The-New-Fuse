// @ts-check
require('es6-promise/auto');
require('reflect-metadata');
require('setimmediate');
const { Container } = require('inversify');
const { FrontendApplicationConfigProvider } = require('@theia/core/lib/browser/frontend-application-config-provider');

FrontendApplicationConfigProvider.set({
    "applicationName": "Eclipse Theia",
    "defaultTheme": {
        "light": "light",
        "dark": "dark"
    },
    "defaultIconTheme": "theia-file-icons",
    "electron": {
        "windowOptions": {},
        "showWindowEarly": true,
        "splashScreenOptions": {},
        "uriScheme": "theia"
    },
    "defaultLocale": "",
    "validatePreferencesSchema": true,
    "reloadOnReconnect": false,
    "uriScheme": "theia"
});


self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        return './editor.worker.js';
    }
}

function load(container, jsModule) {
    return Promise.resolve(jsModule)
        .then(containerModule => container.load(containerModule.default));
}

async function preload(container) {
    try {
        await load(container, require('@theia/core/lib/browser/preload/preload-module'));
        const { Preloader } = require('@theia/core/lib/browser/preload/preloader');
        const preloader = container.get(Preloader);
        await preloader.initialize();
    } catch (reason) {
        console.error('Failed to run preload scripts.');
        if (reason) {
            console.error(reason);
        }
    }
}

module.exports = (async () => {
    const { messagingFrontendModule } = require('@theia/core/lib/browser/messaging/messaging-frontend-module');
    const container = new Container();
    container.load(messagingFrontendModule);
    

    await preload(container);

    
    const { MonacoInit } = require('@theia/monaco/lib/browser/monaco-init');
    ;

    const { FrontendApplication } = require('@theia/core/lib/browser');
    const { frontendApplicationModule } = require('@theia/core/lib/browser/frontend-application-module');    
    const { loggerFrontendModule } = require('@theia/core/lib/browser/logger-frontend-module');

    container.load(frontendApplicationModule);
    undefined
    
    container.load(loggerFrontendModule);
    

    try {
        await load(container, require('@theia/core/lib/browser/i18n/i18n-frontend-module'));
        await load(container, require('@theia/core/lib/browser/menu/browser-menu-module'));
        await load(container, require('@theia/core/lib/browser/window/browser-window-module'));
        await load(container, require('@theia/core/lib/browser/keyboard/browser-keyboard-module'));
        await load(container, require('@theia/core/lib/browser/request/browser-request-module'));
        await load(container, require('@theia/variable-resolver/lib/browser/variable-resolver-frontend-module'));
        await load(container, require('@theia/editor/lib/browser/editor-frontend-module'));
        await load(container, require('@theia/filesystem/lib/browser/filesystem-frontend-module'));
        await load(container, require('@theia/filesystem/lib/browser/download/file-download-frontend-module'));
        await load(container, require('@theia/filesystem/lib/browser/file-dialog/file-dialog-module'));
        await load(container, require('@theia/workspace/lib/browser/workspace-frontend-module'));
        await load(container, require('@theia/markers/lib/browser/problem/problem-frontend-module'));
        await load(container, require('@theia/outline-view/lib/browser/outline-view-frontend-module'));
        await load(container, require('@theia/monaco/lib/browser/monaco-frontend-module'));
        await load(container, require('@theia/output/lib/browser/output-frontend-module'));
        await load(container, require('@theia/ai-core/lib/browser/ai-core-frontend-module'));
        await load(container, require('@theia/ai-anthropic/lib/browser/anthropic-frontend-module'));
        await load(container, require('@theia/ai-history/lib/browser/ai-history-frontend-module'));
        await load(container, require('@theia/process/lib/common/process-common-module'));
        await load(container, require('@theia/file-search/lib/browser/file-search-frontend-module'));
        await load(container, require('@theia/ai-chat/lib/browser/ai-chat-frontend-module'));
        await load(container, require('@theia/ai-huggingface/lib/browser/huggingface-frontend-module'));
        await load(container, require('@theia/ai-ollama/lib/browser/ollama-frontend-module'));
        await load(container, require('@theia/ai-openai/lib/browser/openai-frontend-module'));
        await load(container, require('@theia/console/lib/browser/console-frontend-module'));
        await load(container, require('@theia/terminal/lib/browser/terminal-frontend-module'));
        await load(container, require('@theia/userstorage/lib/browser/user-storage-frontend-module'));
        await load(container, require('@theia/task/lib/browser/task-frontend-module'));
        await load(container, require('@theia/navigator/lib/browser/navigator-frontend-module'));
        await load(container, require('@theia/test/lib/browser/view/test-view-frontend-module'));
        await load(container, require('@theia/debug/lib/browser/debug-frontend-module'));
        await load(container, require('@theia/preferences/lib/browser/preference-frontend-module'));
        await load(container, require('@theia/keymaps/lib/browser/keymaps-frontend-module'));
        await load(container, require('@theia/mini-browser/lib/browser/mini-browser-frontend-module'));
        await load(container, require('@theia/mini-browser/lib/browser/environment/mini-browser-environment-module'));
        await load(container, require('@theia/preview/lib/browser/preview-frontend-module'));
        await load(container, require('@theia/getting-started/lib/browser/getting-started-frontend-module'));
        await load(container, require('@theia/scm/lib/browser/scm-frontend-module'));
        await load(container, require('@theia/scm-extra/lib/browser/scm-extra-frontend-module'));
        await load(container, require('@theia/git/lib/browser/git-frontend-module'));
        await load(container, require('@theia/git/lib/browser/prompt/git-prompt-module'));
        await load(container, require('@theia/messages/lib/browser/messages-frontend-module'));
        await load(container, require('@theia/bulk-edit/lib/browser/bulk-edit-frontend-module'));
        await load(container, require('@theia/callhierarchy/lib/browser/callhierarchy-frontend-module'));
        await load(container, require('@theia/editor-preview/lib/browser/editor-preview-frontend-module'));
        await load(container, require('@theia/notebook/lib/browser/notebook-frontend-module'));
        await load(container, require('@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-module'));
        await load(container, require('@theia/timeline/lib/browser/timeline-frontend-module'));
        await load(container, require('@theia/typehierarchy/lib/browser/typehierarchy-frontend-module'));
        await load(container, require('@theia/plugin-ext/lib/plugin-ext-frontend-module'));
        await load(container, require('@theia/plugin-ext-vscode/lib/browser/plugin-vscode-frontend-module'));
        await load(container, require('@theia/toolbar/lib/browser/toolbar-frontend-module'));
        await load(container, require('@theia/vsx-registry/lib/common/vsx-registry-common-module'));
        await load(container, require('@theia/vsx-registry/lib/browser/vsx-registry-frontend-module'));
        
        MonacoInit.init(container);
        ;
        await start();
    } catch (reason) {
        console.error('Failed to start the frontend application.');
        if (reason) {
            console.error(reason);
        }
    }

    function start() {
        (window['theia'] = window['theia'] || {}).container = container;
        return container.get(FrontendApplication).start();
    }
})();
