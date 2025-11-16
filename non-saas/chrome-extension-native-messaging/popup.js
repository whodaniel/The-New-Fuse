// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const connectButton = document.getElementById('connectButton');

    connectButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ from: 'popup', data: { action: 'connect' } }, (response) => {
           if (chrome.runtime.lastError) {
               statusElement.textContent = 'Error';
           } else {
               statusElement.textContent = 'Connected';
           }
        });
    });
});