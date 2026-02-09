import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, Smile } from 'lucide-react';
import { nanoid } from 'nanoid';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { MessageType } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: string;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  isTyping?: boolean;
}

interface ChatRoomProps {
  roomId: string;
  title?: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, title }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, ] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join_room', { roomId });

    socket.emit('get_room_messages', { roomId }, (response: { messages: Message[] }) => {
      setMessages(response.messages);
      setLoading(false);
    });

    socket.emit('get_room_members', { roomId }, (response: { members: Member[] }) => {
      setMembers(response.members);
    });

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    const handleTypingStatus = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setMembers((prev) =>
        prev.map((member) => (member.id === userId ? { ...member, isTyping } : member))
      );
    };

    const handleMemberJoined = (member: Member) => {
      setMembers((prev) => [...prev, member]);
    };

    const handleMemberLeft = (memberId: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_status', handleTypingStatus);
    socket.on('member_joined', handleMemberJoined);
    socket.on('member_left', handleMemberLeft);

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('new_message', handleNewMessage);
      socket.off('typing_status', handleTypingStatus);
      socket.off('member_joined', handleMemberJoined);
      socket.off('member_left', handleMemberLeft);
    };
  }, [socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewMessage(value);
    if (socket) {
      socket.emit('typing', { roomId, isTyping: value.length > 0 });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !user) return;

    const message: Message = {
      id: nanoid(),
      roomId,
      senderId: user.id,
      content: newMessage,
      type: MessageType.TEXT,
      timestamp: new Date().toISOString(),
    };

    socket.emit('send_message', message, (response: { success: boolean }) => {
      if (response.success) {
        setNewMessage('');
        socket.emit('typing', { roomId, isTyping: false });
      }
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isSelf = message.senderId === user?.id;
    const sender = members.find((m) => m.id === message.senderId);

    return (
      <div key={message.id} className={`flex items-start gap-3 my-4 ${isSelf ? 'flex-row-reverse' : ''}`}>
        <Avatar>
          <AvatarImage src={sender?.avatar} alt={sender?.name} />
          <AvatarFallback>{sender?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={`flex flex-col gap-1 ${isSelf ? 'items-end' : ''}`}>
          <div className={`rounded-lg p-3 ${isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <p className="font-semibold text-sm">{sender?.name}</p>
            {message.type === MessageType.TEXT && <p className="text-sm">{message.content}</p>}
            {message.type === MessageType.MARKDOWN && <MarkdownRenderer content={message.content} />}
            {/* Add other message types here */}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title || `Chat Room ${roomId}`}</CardTitle>
        <div className="flex items-center gap-2">
          {members.map((member) => (
            <Avatar key={member.id} title={`${member.name}${member.isTyping ? ' (typing...)' : ''}`}>
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 w-full">
          <Button variant="ghost" size="icon">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Smile className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};