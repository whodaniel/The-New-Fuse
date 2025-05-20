# The New Fuse - Chrome Extension

This document provides an overview of "The New Fuse" Chrome Extension, detailing its architecture, core functionalities, and key components.

## Architecture

The Chrome extension is built using a modern web stack, with **React** as the primary library for building user interfaces, particularly for the popup and any injected UI elements. TypeScript is used for robust, type-safe code.

The extension follows a standard Chrome extension architecture, comprising:
*   **Background Script**: Manages long-term tasks, state, and communication between different parts of the extension and the native application/backend.
*   **Content Script(s)**: Injected into web pages to interact with the DOM, extract information, and inject UI elements.
*   **Popup**: The user interface displayed when the extension icon is clicked.
*   **Options Page** (if applicable): For user-configurable settings.

Communication between these components is handled via Chrome's messaging APIs (`chrome.runtime.sendMessage`, `chrome.runtime.connect`, `chrome.tabs.sendMessage`).

## Core Functionalities

1.  **UI Injection**:
    *   The extension can inject custom UI elements (e.g., floating panels, buttons) directly into web pages to provide contextual actions and information. This is primarily managed by the content script.

2.  **Message Handling**:
    *   Robust message passing is implemented between the background script, content scripts, and popup to coordinate actions and data flow.
    *   Handles messages from the native application/backend via WebSocket for real-time communication.

3.  **Content Extraction and Insertion**:
    *   **Extraction**: Content scripts can extract various types of content from web pages, including selected text, HTML snippets, and structured data from known AI chat platforms (e.g., chat logs, code blocks).
    *   **Insertion**: Content scripts can insert text or HTML (sanitized using DOMPurify) into input fields, content-editable elements, or other designated areas on web pages.

4.  **File Transfer**:
    *   Facilitates the transfer of files or data blobs between the browser and the backend/native application, potentially involving compression and chunking for large files.

5.  **WebSocket Communication**:
    *   The background script maintains a WebSocket connection to a backend server for real-time, bidirectional communication. This is used for tasks like:
        *   Sending commands or data from the extension to the backend.
        *   Receiving updates, instructions, or data from the backend to be acted upon by the extension (e.g., inserting text into a webpage).

## Key Components and Their Roles

1.  **Background Script (`background.ts`)**:
    *   **Role**: The central coordinator of the extension.
    *   **Responsibilities**:
        *   Manages the WebSocket connection to the backend.
        *   Handles messages from content scripts and the popup.
        *   Maintains persistent state for the extension.
        *   Orchestrates complex operations that involve multiple components (e.g., receiving a command via WebSocket and instructing a content script to perform an action).
        *   Manages context menus.
        *   Handles communication with the native messaging host if applicable.

2.  **Content Script (`src/content/index.ts`)**:
    *   **Role**: Interacts directly with the web pages the user visits.
    *   **Responsibilities**:
        *   Injects UI elements (e.g., floating action buttons, sidebars) into the page.
        *   Listens for user interactions on the page (e.g., text selection, clicks on injected UI).
        *   Extracts content from the page (e.g., selected text, chat logs from AI platforms).
        *   Inserts content into input fields or other elements on the page, ensuring HTML is sanitized using `DOMPurify` to prevent XSS.
        *   Communicates with the background script to send data or receive instructions.
        *   Detects active AI chat platforms and adapts its behavior accordingly.

3.  **Popup (`src/popup/index.tsx` and related components)**:
    *   **Role**: Provides the primary user interface when the extension icon is clicked.
    *   **Responsibilities**:
        *   Displays information and controls to the user.
        *   Built with React for a modern and responsive UI.
        *   Communicates with the background script to trigger actions or retrieve data.
        *   May display status information (e.g., WebSocket connection status).
        *   Allows users to initiate actions like extracting content or sending data.

4.  **Shared Utilities (`src/utils/`)**:
    *   **Role**: Provides common helper functions and classes used across different parts of the extension.
    *   **Examples**:
        *   `logger.ts`: For consistent logging.
        *   `websocket-manager.ts`: (Potentially used by background script) for managing WebSocket connections.
        *   `file-transfer.ts`: Utilities for handling file transfers.

5.  **Manifest File (`manifest.json`)**:
    *   **Role**: The configuration file for the Chrome extension.
    *   **Responsibilities**:
        *   Defines permissions required by the extension (e.g., access to specific websites, storage, tabs).
        *   Declares the background script, content scripts (and their matching patterns), popup page, and other extension components.
        *   Specifies icons, version, name, and description of the extension.

This updated documentation reflects the current React-based architecture and core functionalities of "The New Fuse" Chrome extension.
