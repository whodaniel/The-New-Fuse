// background.js

let port = null;

// Function to connect to the native messaging host
function connect() {
  const hostName = "com.my_company.my_application";
  port = chrome.runtime.connectNative(hostName);

  port.onMessage.addListener((message) => {
    // Forward message from native app to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  });

  port.onDisconnect.addListener(() => {
    port = null;
  });
}

// Listen for messages from the content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === 'content' || message.from === 'popup') {
    if (!port) {
      connect();
    }
    // Forward message to the native application
    if (port) {
        port.postMessage(message.data);
    }
  }
  return true;
});

// Reconnect on popup click if disconnected
chrome.action.onClicked.addListener(() => {
    if (!port) {
        connect();
    }
});