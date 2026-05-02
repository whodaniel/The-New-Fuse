// @ts-check

(function() {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    
    function updateForm(settings) {
        const form = document.getElementById('settings-form');
        if (!form) return;
        
        for (const [key, value] of Object.entries(settings)) {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = !!value;
                } else {
                    element.value = value || '';
                }
            }
        }
    }
    
    function getFormData() {
        const form = document.getElementById('settings-form');
        if (!form) return {};
        
        const formData = {};
        for (const element of form.elements) {
            if (element.id) {
                if (element.type === 'checkbox') {
                    formData[element.id] = element.checked;
                } else if (element.value !== '') {
                    formData[element.id] = element.value;
                }
            }
        }
        return formData;
    }
    
    // Request current settings when the webview loads
    vscode.postMessage({ command: 'getSettings' });
    
    // Handle form submission
    document.getElementById('settings-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const settings = getFormData();
        vscode.postMessage({
            command: 'saveSettings',
            settings
        });
    });
    
    // Handle messages from the extension
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.command) {
            case 'settingsUpdate':
                updateForm(message.settings);
                break;
        }
    });
})();
