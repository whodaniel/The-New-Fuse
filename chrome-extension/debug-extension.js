// Debug script to test extension loading
console.log('🔍 TNF Extension Debug - Starting...');

// Check if scripts are loaded
console.log('🔍 Content script available:', typeof window.tnfAIContentScript);
console.log('🔍 Injectable UI available:', typeof window.tnfInjectableUI);

// Check for TNF button
const tnfButton = document.getElementById('tnf-toggle-button');
console.log('🔍 TNF Button found:', !!tnfButton);

// Check for TNF UI
const tnfUI = document.getElementById('tnf-injectable-ui');
console.log('🔍 TNF UI found:', !!tnfUI);

// Try to manually create the UI if it doesn't exist
if (!window.tnfInjectableUI) {
    console.log('🔧 Manually creating TNF Injectable UI...');
    try {
        // Load the script manually
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injectable-ui.js');
        document.head.appendChild(script);
        console.log('✅ Injectable UI script injected manually');
    } catch (error) {
        console.error('❌ Failed to inject script:', error);
    }
}

// Report current page info
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 Page title:', document.title);

setTimeout(() => {
    console.log('🔍 Delayed check - TNF UI exists:', !!window.tnfInjectableUI);
    console.log('🔍 Delayed check - TNF Button exists:', !!document.getElementById('tnf-toggle-button'));
}, 2000);