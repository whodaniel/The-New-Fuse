"use strict";
/**
 * Browser Control Protocol
 *
 * Defines the communication protocol between:
 * - TNF Chrome Extension (browser-side)
 * - TNF Relay Server (bridge)
 * - Tauri Desktop App (AI control interface)
 * - Any Local AI Agent
 *
 * Enables any local AI to control websites through the TNF Chrome extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserControlMessageType = void 0;
exports.createMessage = createMessage;
exports.generateMessageId = generateMessageId;
exports.isRequestMessage = isRequestMessage;
exports.getResponseType = getResponseType;
// ============================================================================
// MESSAGE TYPES
// ============================================================================
var BrowserControlMessageType;
(function (BrowserControlMessageType) {
    // ─── Connection & Registration ───
    BrowserControlMessageType["REGISTER"] = "REGISTER";
    BrowserControlMessageType["REGISTER_ACK"] = "REGISTER_ACK";
    BrowserControlMessageType["HEARTBEAT"] = "HEARTBEAT";
    BrowserControlMessageType["HEARTBEAT_ACK"] = "HEARTBEAT_ACK";
    // ─── Browser Navigation ───
    BrowserControlMessageType["NAVIGATE"] = "NAVIGATE";
    BrowserControlMessageType["NAVIGATE_RESULT"] = "NAVIGATE_RESULT";
    BrowserControlMessageType["GO_BACK"] = "GO_BACK";
    BrowserControlMessageType["GO_FORWARD"] = "GO_FORWARD";
    BrowserControlMessageType["REFRESH"] = "REFRESH";
    BrowserControlMessageType["GET_CURRENT_URL"] = "GET_CURRENT_URL";
    BrowserControlMessageType["GET_CURRENT_URL_RESULT"] = "GET_CURRENT_URL_RESULT";
    // ─── Page Analysis ───
    BrowserControlMessageType["ANALYZE_PAGE"] = "ANALYZE_PAGE";
    BrowserControlMessageType["ANALYZE_PAGE_RESULT"] = "ANALYZE_PAGE_RESULT";
    BrowserControlMessageType["GET_PAGE_CONTENT"] = "GET_PAGE_CONTENT";
    BrowserControlMessageType["GET_PAGE_CONTENT_RESULT"] = "GET_PAGE_CONTENT_RESULT";
    BrowserControlMessageType["GET_DOM_SNAPSHOT"] = "GET_DOM_SNAPSHOT";
    BrowserControlMessageType["GET_DOM_SNAPSHOT_RESULT"] = "GET_DOM_SNAPSHOT_RESULT";
    BrowserControlMessageType["FIND_ELEMENTS"] = "FIND_ELEMENTS";
    BrowserControlMessageType["FIND_ELEMENTS_RESULT"] = "FIND_ELEMENTS_RESULT";
    // ─── Element Interaction ───
    BrowserControlMessageType["CLICK"] = "CLICK";
    BrowserControlMessageType["CLICK_RESULT"] = "CLICK_RESULT";
    BrowserControlMessageType["TYPE"] = "TYPE";
    BrowserControlMessageType["TYPE_RESULT"] = "TYPE_RESULT";
    BrowserControlMessageType["SCROLL"] = "SCROLL";
    BrowserControlMessageType["SCROLL_RESULT"] = "SCROLL_RESULT";
    BrowserControlMessageType["HOVER"] = "HOVER";
    BrowserControlMessageType["HOVER_RESULT"] = "HOVER_RESULT";
    BrowserControlMessageType["SELECT"] = "SELECT";
    BrowserControlMessageType["SELECT_RESULT"] = "SELECT_RESULT";
    BrowserControlMessageType["FOCUS"] = "FOCUS";
    BrowserControlMessageType["FOCUS_RESULT"] = "FOCUS_RESULT";
    // ─── Form Handling ───
    BrowserControlMessageType["FILL_FORM"] = "FILL_FORM";
    BrowserControlMessageType["FILL_FORM_RESULT"] = "FILL_FORM_RESULT";
    BrowserControlMessageType["SUBMIT_FORM"] = "SUBMIT_FORM";
    BrowserControlMessageType["SUBMIT_FORM_RESULT"] = "SUBMIT_FORM_RESULT";
    BrowserControlMessageType["GET_FORM_DATA"] = "GET_FORM_DATA";
    BrowserControlMessageType["GET_FORM_DATA_RESULT"] = "GET_FORM_DATA_RESULT";
    // ─── Screenshots & Recording ───
    BrowserControlMessageType["TAKE_SCREENSHOT"] = "TAKE_SCREENSHOT";
    BrowserControlMessageType["TAKE_SCREENSHOT_RESULT"] = "TAKE_SCREENSHOT_RESULT";
    BrowserControlMessageType["START_RECORDING"] = "START_RECORDING";
    BrowserControlMessageType["STOP_RECORDING"] = "STOP_RECORDING";
    BrowserControlMessageType["RECORDING_RESULT"] = "RECORDING_RESULT";
    // ─── Tab Management ───
    BrowserControlMessageType["NEW_TAB"] = "NEW_TAB";
    BrowserControlMessageType["NEW_TAB_RESULT"] = "NEW_TAB_RESULT";
    BrowserControlMessageType["CLOSE_TAB"] = "CLOSE_TAB";
    BrowserControlMessageType["SWITCH_TAB"] = "SWITCH_TAB";
    BrowserControlMessageType["LIST_TABS"] = "LIST_TABS";
    BrowserControlMessageType["LIST_TABS_RESULT"] = "LIST_TABS_RESULT";
    // ─── AI Chat Interface ───
    BrowserControlMessageType["DETECT_CHAT_ELEMENTS"] = "DETECT_CHAT_ELEMENTS";
    BrowserControlMessageType["DETECT_CHAT_ELEMENTS_RESULT"] = "DETECT_CHAT_ELEMENTS_RESULT";
    BrowserControlMessageType["SEND_CHAT_MESSAGE"] = "SEND_CHAT_MESSAGE";
    BrowserControlMessageType["SEND_CHAT_MESSAGE_RESULT"] = "SEND_CHAT_MESSAGE_RESULT";
    BrowserControlMessageType["GET_CHAT_MESSAGES"] = "GET_CHAT_MESSAGES";
    BrowserControlMessageType["GET_CHAT_MESSAGES_RESULT"] = "GET_CHAT_MESSAGES_RESULT";
    BrowserControlMessageType["WAIT_FOR_RESPONSE"] = "WAIT_FOR_RESPONSE";
    BrowserControlMessageType["CHAT_RESPONSE_RECEIVED"] = "CHAT_RESPONSE_RECEIVED";
    // ─── Cascade Actions (Antigravity-style) ───
    BrowserControlMessageType["CASCADE_START"] = "CASCADE_START";
    BrowserControlMessageType["CASCADE_STEP"] = "CASCADE_STEP";
    BrowserControlMessageType["CASCADE_CANCEL"] = "CASCADE_CANCEL";
    BrowserControlMessageType["CASCADE_STATUS"] = "CASCADE_STATUS";
    BrowserControlMessageType["CASCADE_COMPLETE"] = "CASCADE_COMPLETE";
    // ─── Session Control ───
    BrowserControlMessageType["START_SESSION"] = "START_SESSION";
    BrowserControlMessageType["END_SESSION"] = "END_SESSION";
    BrowserControlMessageType["GET_SESSION_STATUS"] = "GET_SESSION_STATUS";
    BrowserControlMessageType["SESSION_STATUS"] = "SESSION_STATUS";
    // ─── Overlay Controls ───
    BrowserControlMessageType["SHOW_OVERLAY"] = "SHOW_OVERLAY";
    BrowserControlMessageType["HIDE_OVERLAY"] = "HIDE_OVERLAY";
    BrowserControlMessageType["UPDATE_OVERLAY"] = "UPDATE_OVERLAY";
    // ─── Error & Notifications ───
    BrowserControlMessageType["ERROR"] = "ERROR";
    BrowserControlMessageType["NOTIFICATION"] = "NOTIFICATION";
})(BrowserControlMessageType || (exports.BrowserControlMessageType = BrowserControlMessageType = {}));
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function createMessage(type, source, payload, options) {
    return {
        id: generateMessageId(),
        type,
        source,
        timestamp: new Date().toISOString(),
        payload,
        ...options,
    };
}
function generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function isRequestMessage(type) {
    return (!type.endsWith('_RESULT') && !type.endsWith('_ACK') && type !== BrowserControlMessageType.ERROR);
}
function getResponseType(requestType) {
    const resultType = `${requestType}_RESULT`;
    if (Object.values(BrowserControlMessageType).includes(resultType)) {
        return resultType;
    }
    return null;
}
//# sourceMappingURL=protocol.js.map