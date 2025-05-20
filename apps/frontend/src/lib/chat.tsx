    let currentRoom = null;
    const userId = Math.random().toString(36).substring(7);
    document.getElementById('createRoom').addEventListener('click', async () => {
        const response = await fetch('/chat/rooms', {
            method: 'POST'
        });
        const data = await response.json();
        await joinRoom(data.room_id);
        updateRoomList();
    });
    document.getElementById('sendMessage').addEventListener('click', async () => {
        if (!currentRoom)
            return;
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        if (!content)
            return;
        await fetch(`/chat/rooms/${currentRoom}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                content: content
            })
        });
        input.value = '';
        await updateMessages();
    });
    async function joinRoom(roomId) {
        await fetch(`/chat/rooms/${roomId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        currentRoom = roomId;
        document.getElementById('currentRoom').textContent = `Room: ${roomId}`;
        await updateMessages();
    }
    async function updateMessages() {
        if (!currentRoom)
            return;
        const response = await fetch(`/chat/rooms/${currentRoom}/messages`);
        const data = await response.json();
        const messagesArea = document.getElementById('messagesArea');
        messagesArea.innerHTML = data.messages.map(msg => `
            <div class="message ${msg.sender_id === userId ? 'text-end' : ''}">
                <small class="text-muted">${msg.sender_id}</small>
                <div class="p-2 mb-2 ${msg.sender_id === userId ? 'bg-primary text-white' : 'bg-light'} rounded">
                    ${msg.content}
                </div>
            </div>
        `).join('');
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    setInterval(updateMessages, 3000);
});
export {};
//# sourceMappingURL=chat.js.map