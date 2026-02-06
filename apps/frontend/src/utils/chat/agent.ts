export const websocketURI = (workspace?: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws${workspace ? `/${workspace}` : ''}`;
};

export const AGENT_SESSION_START = 'agent_session_start';
export const AGENT_SESSION_END = 'agent_session_end';
export const ABORT_STREAM_EVENT = 'abort_stream';

export default function handleSocketResponse(response: any) {
  // Basic socket response handler
  console.log('Socket response:', response);
  return response;
}
