import { useStore } from './store.js';

export const handleMessage = (data: any) => {
  try {
    // Add message to store
    useStore.getState().addMessage({
      text: typeof data === 'string' ? data : JSON.stringify(data),
      type: 'received',
    });

    // Send message to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'NEW_MESSAGE',
            data,
          });
        }
      });
    });
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

export const handleError = (error: Event) => {
  console.error('WebSocket error:', error);
  chrome.runtime.sendMessage({
    type: 'WEBSOCKET_ERROR',
    error: error.toString(),
  });
};
