declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

interface Window {
  __REDUX_DEVTOOLS_EXTENSION__?: () => any;
}

interface ChromeMessage {
  type: string;
  data?: any;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface StoreMessage {
  id: string;
  text: string;
  timestamp: number;
  type: 'sent' | 'received';
}
