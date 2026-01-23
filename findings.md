# Findings

## Custom Element Error

- Error:
  `Uncaught Error: A custom element with name 'mce-autosize-textarea' has already been defined.`
- Sources: `webcomponents-ce.js` (polyfill?), `overlay_bundle.js`.

## SimpleChatBridge

- Spam: "Elements NOT ready"
- Likely looking for chat elements on pages that don't have them, or before they
  load.
