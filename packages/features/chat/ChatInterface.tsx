"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInterface = void 0;
var react_1 = require("react");
var ChatContext_1 = require("./ChatContext");
var ChatMessage_1 = require("./ChatMessage");
var ChatInput_1 = require("./ChatInput");
var ChatInterface = function (_a) {
    var currentUser = _a.currentUser, _b = _a.className, className = _b === void 0 ? '' : _b;
    var _c = (0, ChatContext_1.useChat)(), state = _c.state, sendMessage = _c.sendMessage;
    var messagesEndRef = (0, react_1.useRef)(null);
    var scrollToBottom = function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: smooth' });
    };
    (0, react_1.useEffect)(function () {
        scrollToBottom();
    }, [state.messages]);
    return (<div className={"flex flex-col h-full ".concat(className)}>
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Chat</h2>
            <p className="text-sm text-gray-500">
              {state.status === 'typing' && 'Agent is typing...'}
            </p>
          </div>
          {state.error && (<div className="text-sm text-red-600">{state.error}</div>)}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 ? (<div className="flex items-center justify-center h-full text-gray-500">
            No messages yet
          </div>) : (state.messages.map(function (message) { return (<ChatMessage_1.ChatMessage key={message.id} message={message} isCurrentUser={message.sender === currentUser}/>); }))}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <ChatInput_1.ChatInput onSend={sendMessage} disabled={state.status === 'processing'}/>
    </div>);
};
exports.ChatInterface = ChatInterface;
export {};
