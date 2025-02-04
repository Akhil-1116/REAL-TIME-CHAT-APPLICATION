import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Users, Send, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import type { Message, Room } from './types/chat';

const ROOMS: Room[] = [
  { id: 'general', name: 'General' },
  { id: 'random', name: 'Random' },
  { id: 'tech', name: 'Tech Talk' },
];

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room>(ROOMS[0]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('message', (message: Message) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    });

    socket.on('userList', (userList: string[]) => {
      setUsers(userList);
    });

    socket.on('typingUsers', (typingUsernames: string[]) => {
      setTypingUsers(typingUsernames);
    });

    return () => {
      socket.off('message');
      socket.off('userList');
      socket.off('typingUsers');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !username.trim()) return;

    socket.emit('join', { username, room: currentRoom.id });
    setIsJoined(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim()) return;

    socket.emit('message', { content: message, room: currentRoom.id });
    setMessage('');
    setIsTyping(false);
    socket.emit('typing', { isTyping: false, room: currentRoom.id });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { isTyping: true, room: currentRoom.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { isTyping: false, room: currentRoom.id });
    }, 1000);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <MessageCircle className="h-8 w-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Chat App</h1>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-indigo-200 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-indigo-500/30 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-indigo-200 mb-1">
                Select Room
              </label>
              <select
                id="room"
                value={currentRoom.id}
                onChange={(e) => setCurrentRoom(ROOMS.find(room => room.id === e.target.value) || ROOMS[0])}
                className="w-full px-4 py-2 bg-white/5 border border-indigo-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ROOMS.map(room => (
                  <option key={room.id} value={room.id} className="bg-indigo-900">
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-950/50 backdrop-blur-lg border-r border-white/10">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Chat App</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-white">{username}</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4 text-indigo-200">
            <Users className="h-5 w-5" />
            <h2 className="font-medium">Online Users</h2>
          </div>
          <ul className="space-y-2">
            {users.map((user, index) => (
              <li
                key={index}
                className="flex items-center gap-2 px-2 py-1 text-sm text-white/80"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {user}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-indigo-950/30 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">{currentRoom.name}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.type === 'system'
                  ? 'items-center'
                  : msg.username === username
                  ? 'items-end'
                  : 'items-start'
              }`}
            >
              {msg.type === 'system' ? (
                <div className="px-4 py-2 rounded-lg bg-white/5 text-indigo-200 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className={`max-w-[70%] ${
                  msg.username === username ? 'bg-indigo-600' : 'bg-white/10'
                } rounded-lg px-4 py-2`}>
                  {msg.username !== username && (
                    <div className="text-sm text-indigo-300 mb-1">{msg.username}</div>
                  )}
                  <div className="text-white">{msg.content}</div>
                  <div className="text-xs text-indigo-300 mt-1">
                    {format(msg.timestamp, 'HH:mm')}
                  </div>
                </div>
              )}
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="text-sm text-indigo-300 italic">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSend} className="p-4 bg-indigo-950/30 border-t border-white/10">
          <div className="flex gap-4">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-white/5 border border-indigo-500/30 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;