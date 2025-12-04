export var websocketURI = function (workspace) {
    var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var host = window.location.host;
    return "".concat(protocol, "//").concat(host, "/ws").concat(workspace ? "/".concat(workspace) : '');
};
export var AGENT_SESSION_START = 'agent_session_start';
export var AGENT_SESSION_END = 'agent_session_end';
export var ABORT_STREAM_EVENT = 'abort_stream';
export default function handleSocketResponse(response) {
    // Basic socket response handler
    console.log('Socket response:', response);
    return response;
}
