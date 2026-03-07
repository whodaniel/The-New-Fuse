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

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export enum BrowserControlMessageType {
  // ─── Connection & Registration ───
  REGISTER = 'REGISTER',
  REGISTER_ACK = 'REGISTER_ACK',
  HEARTBEAT = 'HEARTBEAT',
  HEARTBEAT_ACK = 'HEARTBEAT_ACK',

  // ─── Browser Navigation ───
  NAVIGATE = 'NAVIGATE',
  NAVIGATE_RESULT = 'NAVIGATE_RESULT',
  GO_BACK = 'GO_BACK',
  GO_FORWARD = 'GO_FORWARD',
  REFRESH = 'REFRESH',
  GET_CURRENT_URL = 'GET_CURRENT_URL',
  GET_CURRENT_URL_RESULT = 'GET_CURRENT_URL_RESULT',

  // ─── Page Analysis ───
  ANALYZE_PAGE = 'ANALYZE_PAGE',
  ANALYZE_PAGE_RESULT = 'ANALYZE_PAGE_RESULT',
  GET_PAGE_CONTENT = 'GET_PAGE_CONTENT',
  GET_PAGE_CONTENT_RESULT = 'GET_PAGE_CONTENT_RESULT',
  GET_DOM_SNAPSHOT = 'GET_DOM_SNAPSHOT',
  GET_DOM_SNAPSHOT_RESULT = 'GET_DOM_SNAPSHOT_RESULT',
  FIND_ELEMENTS = 'FIND_ELEMENTS',
  FIND_ELEMENTS_RESULT = 'FIND_ELEMENTS_RESULT',

  // ─── Element Interaction ───
  CLICK = 'CLICK',
  CLICK_RESULT = 'CLICK_RESULT',
  TYPE = 'TYPE',
  TYPE_RESULT = 'TYPE_RESULT',
  SCROLL = 'SCROLL',
  SCROLL_RESULT = 'SCROLL_RESULT',
  HOVER = 'HOVER',
  HOVER_RESULT = 'HOVER_RESULT',
  SELECT = 'SELECT',
  SELECT_RESULT = 'SELECT_RESULT',
  FOCUS = 'FOCUS',
  FOCUS_RESULT = 'FOCUS_RESULT',

  // ─── Form Handling ───
  FILL_FORM = 'FILL_FORM',
  FILL_FORM_RESULT = 'FILL_FORM_RESULT',
  SUBMIT_FORM = 'SUBMIT_FORM',
  SUBMIT_FORM_RESULT = 'SUBMIT_FORM_RESULT',
  GET_FORM_DATA = 'GET_FORM_DATA',
  GET_FORM_DATA_RESULT = 'GET_FORM_DATA_RESULT',

  // ─── Screenshots & Recording ───
  TAKE_SCREENSHOT = 'TAKE_SCREENSHOT',
  TAKE_SCREENSHOT_RESULT = 'TAKE_SCREENSHOT_RESULT',
  START_RECORDING = 'START_RECORDING',
  STOP_RECORDING = 'STOP_RECORDING',
  RECORDING_RESULT = 'RECORDING_RESULT',

  // ─── Tab Management ───
  NEW_TAB = 'NEW_TAB',
  NEW_TAB_RESULT = 'NEW_TAB_RESULT',
  CLOSE_TAB = 'CLOSE_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  LIST_TABS = 'LIST_TABS',
  LIST_TABS_RESULT = 'LIST_TABS_RESULT',

  // ─── AI Chat Interface ───
  DETECT_CHAT_ELEMENTS = 'DETECT_CHAT_ELEMENTS',
  DETECT_CHAT_ELEMENTS_RESULT = 'DETECT_CHAT_ELEMENTS_RESULT',
  SEND_CHAT_MESSAGE = 'SEND_CHAT_MESSAGE',
  SEND_CHAT_MESSAGE_RESULT = 'SEND_CHAT_MESSAGE_RESULT',
  GET_CHAT_MESSAGES = 'GET_CHAT_MESSAGES',
  GET_CHAT_MESSAGES_RESULT = 'GET_CHAT_MESSAGES_RESULT',
  WAIT_FOR_RESPONSE = 'WAIT_FOR_RESPONSE',
  CHAT_RESPONSE_RECEIVED = 'CHAT_RESPONSE_RECEIVED',

  // ─── Cascade Actions (Antigravity-style) ───
  CASCADE_START = 'CASCADE_START',
  CASCADE_STEP = 'CASCADE_STEP',
  CASCADE_CANCEL = 'CASCADE_CANCEL',
  CASCADE_STATUS = 'CASCADE_STATUS',
  CASCADE_COMPLETE = 'CASCADE_COMPLETE',

  // ─── Session Control ───
  START_SESSION = 'START_SESSION',
  END_SESSION = 'END_SESSION',
  GET_SESSION_STATUS = 'GET_SESSION_STATUS',
  SESSION_STATUS = 'SESSION_STATUS',

  // ─── Overlay Controls ───
  SHOW_OVERLAY = 'SHOW_OVERLAY',
  HIDE_OVERLAY = 'HIDE_OVERLAY',
  UPDATE_OVERLAY = 'UPDATE_OVERLAY',

  // ─── Error & Notifications ───
  ERROR = 'ERROR',
  NOTIFICATION = 'NOTIFICATION',
}

// ============================================================================
// MESSAGE INTERFACES
// ============================================================================

export interface BrowserControlMessage {
  id: string;
  type: BrowserControlMessageType;
  source: 'chrome_extension' | 'tauri_app' | 'relay_server' | 'ai_agent';
  target?: 'chrome_extension' | 'tauri_app' | 'relay_server' | 'ai_agent' | 'all';
  timestamp: string;
  correlationId?: string; // For request-response matching
  payload: any;
}

// ─── Registration ───
export interface RegisterPayload {
  clientType: 'chrome_extension' | 'tauri_app' | 'ai_agent';
  clientId: string;
  capabilities: string[];
  version: string;
  metadata?: Record<string, any>;
}

// ─── Navigation ───
export interface NavigatePayload {
  url: string;
  tabId?: number;
  newTab?: boolean;
  waitForLoad?: boolean;
}

export interface NavigateResult {
  success: boolean;
  tabId: number;
  url: string;
  title?: string;
  error?: string;
}

// ─── Page Analysis ───
export interface AnalyzePagePayload {
  tabId?: number;
  analysisTypes: ('structure' | 'interactive' | 'chat' | 'forms' | 'content')[];
}

export interface AnalyzePageResult {
  success: boolean;
  url: string;
  title: string;
  analysis: {
    structure?: DOMStructure;
    interactive?: InteractiveElement[];
    chatElements?: ChatElementMapping;
    forms?: FormInfo[];
    content?: ContentSummary;
  };
  error?: string;
}

// ─── Element Interaction ───
export interface ClickPayload {
  selector: string;
  tabId?: number;
  clickType?: 'single' | 'double' | 'right';
  waitAfterClick?: number;
}

export interface TypePayload {
  selector: string;
  text: string;
  tabId?: number;
  clearFirst?: boolean;
  pressEnter?: boolean;
  typeDelay?: number; // ms between characters
}

export interface ScrollPayload {
  tabId?: number;
  target?: string; // selector, or 'top'/'bottom'
  deltaX?: number;
  deltaY?: number;
  smooth?: boolean;
}

// ─── Chat Interface ───
export interface ChatElementMapping {
  inputSelector: string;
  inputXPath: string;
  sendButtonSelector: string;
  sendButtonXPath: string;
  outputContainerSelector: string;
  outputContainerXPath: string;
  messageItemSelector?: string;
  confidence: number;
  platform: 'chatgpt' | 'claude' | 'gemini' | 'generic';
}

export interface SendChatMessagePayload {
  message: string;
  tabId?: number;
  useMapping?: boolean;
  inputSelector?: string;
  sendButtonSelector?: string;
  waitForResponse?: boolean;
  responseTimeout?: number;
}

export interface GetChatMessagesPayload {
  tabId?: number;
  count?: number;
  includeUser?: boolean;
  includeAssistant?: boolean;
}

// ─── Cascade Actions ───
export interface CascadeStartPayload {
  cascadeId: string;
  steps: CascadeStep[];
  options: {
    stopOnError?: boolean;
    showOverlay?: boolean;
    recordSession?: boolean;
  };
}

export interface CascadeStep {
  id: string;
  action: BrowserControlMessageType;
  payload: any;
  waitCondition?: {
    type: 'delay' | 'element_visible' | 'element_hidden' | 'url_contains' | 'custom';
    value: string | number;
    timeout?: number;
  };
}

export interface CascadeStatusPayload {
  cascadeId: string;
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'error';
  currentStep: number;
  totalSteps: number;
  stepResults: Array<{
    stepId: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

// ─── Screenshots ───
export interface ScreenshotPayload {
  tabId?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage?: boolean;
  selector?: string; // Capture specific element
}

export interface ScreenshotResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  width: number;
  height: number;
  error?: string;
}

// ─── Tab Management ───
export interface TabInfo {
  id: number;
  url: string;
  title: string;
  active: boolean;
  status: 'loading' | 'complete';
  favIconUrl?: string;
  windowId: number;
}

// ─── Overlay ───
export interface OverlayPayload {
  message: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  progress?: number;
  showCancel?: boolean;
  cancelCallback?: string;
}

// ─── Supporting Types ───
export interface DOMStructure {
  nodeCount: number;
  depth: number;
  headings: Array<{ level: number; text: string }>;
  links: Array<{ href: string; text: string }>;
  images: Array<{ src: string; alt: string }>;
  iframes: number;
}

export interface InteractiveElement {
  selector: string;
  xpath: string;
  tag: string;
  type?: string;
  text: string;
  placeholder?: string;
  ariaLabel?: string;
  role?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isEnabled: boolean;
}

export interface FormInfo {
  id?: string;
  name?: string;
  action?: string;
  method?: string;
  fields: Array<{
    name: string;
    type: string;
    value: string;
    required: boolean;
    selector: string;
  }>;
}

export interface ContentSummary {
  text: string;
  wordCount: number;
  language?: string;
  mainContent?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createMessage(
  type: BrowserControlMessageType,
  source: BrowserControlMessage['source'],
  payload: any,
  options?: Partial<BrowserControlMessage>
): BrowserControlMessage {
  return {
    id: generateMessageId(),
    type,
    source,
    timestamp: new Date().toISOString(),
    payload,
    ...options,
  };
}

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isRequestMessage(type: BrowserControlMessageType): boolean {
  return (
    !type.endsWith('_RESULT') && !type.endsWith('_ACK') && type !== BrowserControlMessageType.ERROR
  );
}

export function getResponseType(
  requestType: BrowserControlMessageType
): BrowserControlMessageType | null {
  const resultType = `${requestType}_RESULT` as BrowserControlMessageType;
  if (Object.values(BrowserControlMessageType).includes(resultType)) {
    return resultType;
  }
  return null;
}
