console.log("The New Fuse content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.type === "INJECT_SCRIPT_REQUEST") {
    console.log("Content script processing INJECT_SCRIPT_REQUEST:", request.payload);
    sendResponse({ success: true, message: "Content script acknowledged injection." });
    return true;
  }

  if (request.type === 'CAPTURE_PAGE_OUTPUT') {
    const { chatOutputSelector } = request.payload;
    if (!chatOutputSelector) {
      console.error("CAPTURE_PAGE_OUTPUT: chatOutputSelector is missing");
      sendResponse({ success: false, error: 'chatOutputSelector is required.' });
      return true;
    }
    try {
      const element = document.querySelector(chatOutputSelector);
      if (!element) {
        console.warn(`CAPTURE_PAGE_OUTPUT: Element not found with selector: ${chatOutputSelector}`);
        sendResponse({ success: false, error: `Element not found with selector: ${chatOutputSelector}` });
        return true;
      }
      const text = (element as HTMLElement).innerText || (element as HTMLElement).textContent;
      console.log(`CAPTURE_PAGE_OUTPUT: Captured text: "${text}" from selector: ${chatOutputSelector}`);
      sendResponse({ success: true, type: 'PAGE_OUTPUT_CAPTURED', text });
    } catch (e: any) {
      console.error(`CAPTURE_PAGE_OUTPUT: Error capturing text from selector ${chatOutputSelector}:`, e);
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }

  if (request.type === 'SEND_TO_PAGE_INPUT') {
    const { chatInputSelector, sendButtonSelector, text } = request.payload;
    if (!chatInputSelector || !sendButtonSelector || typeof text === 'undefined') {
      console.error("SEND_TO_PAGE_INPUT: Missing required payload fields (chatInputSelector, sendButtonSelector, or text).");
      sendResponse({ success: false, error: 'chatInputSelector, sendButtonSelector, and text are required.' });
      return true;
    }
    try {
      const inputElement = document.querySelector(chatInputSelector) as HTMLInputElement | HTMLTextAreaElement;
      const buttonElement = document.querySelector(sendButtonSelector) as HTMLElement;

      if (!inputElement) {
        console.warn(`SEND_TO_PAGE_INPUT: Input element not found with selector: ${chatInputSelector}`);
        sendResponse({ success: false, error: `Input element not found with selector: ${chatInputSelector}` });
        return true;
      }
      if (!buttonElement) {
        console.warn(`SEND_TO_PAGE_INPUT: Button element not found with selector: ${sendButtonSelector}`);
        sendResponse({ success: false, error: `Button element not found with selector: ${sendButtonSelector}` });
        return true;
      }

      inputElement.value = text;
      console.log(`SEND_TO_PAGE_INPUT: Set value of input (${chatInputSelector}) to: "${text}"`);

      // Dispatch a click event. Consider if a 'submit' event might be needed for some forms.
      // For now, 'click' is more general.
      buttonElement.click();
      console.log(`SEND_TO_PAGE_INPUT: Clicked button (${sendButtonSelector})`);

      sendResponse({ success: true, type: 'SENT_TO_PAGE_CONFIRMED' });
    } catch (e: any) {
      console.error(`SEND_TO_PAGE_INPUT: Error sending text to page:`, e);
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }

  // Default response for unhandled message types
  console.warn("Content script received unhandled message type:", request.type);
  // sendResponse({ success: false, error: `Unhandled message type: ${request.type}` });
  // It's important to return true if you might send a response asynchronously,
  // but for unhandled types, if you don't sendResponse, you don't need to return true.
  // However, to be safe and avoid "The message port closed before a response was received",
  // it's often better to explicitly send a response or ensure all paths do.
  // For now, let's not send a response for unhandled types to avoid clutter if other extensions are messaging.
  return false;
});
