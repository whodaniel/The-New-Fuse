import { EventEmitter } from 'events';
export class ChatManager extends EventEmitter {
    _messages = [];
    get messages() {
        return this._messages;
    }
    clearChat() {
        this._messages = [];
        this.emit('chatCleared');
    }
    addMessage(message) {
        this._messages.push(message);
        this.emit('messageAdded', message);
    }
}
//# sourceMappingURL=ChatManager.js.map