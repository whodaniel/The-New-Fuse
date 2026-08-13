// @ts-nocheck
// Chat.tsx
import ChatInterface from '../components/features/ChatInterface';

export default function Chat() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
      <div className="w-full max-w-2xl p-4">
        <h1 className="text-2xl font-bold mb-4">Chat</h1>
        <ChatInterface />
      </div>
    </div>
  );
}
