import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

interface Message {
  room: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface ChatRoomProps {
  roomName: string; // e.g. "Timisoara-Tennis"
  currentUser: { name: string };
  onClose: () => void;
}

export function ChatRoom({ roomName, currentUser, onClose }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clean the room display name (e.g. "Timisoara-Tennis" -> "Timișoara Tennis Chat")
  const displayRoomName = roomName.replace('-', ' ') + ' Chat';

  // Join room on mount, leave on unmount
  useEffect(() => {
    socket.emit('join_room', roomName);

    // Listen for incoming messages in this room
    socket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit('leave_room', roomName);
      socket.off('receive_message');
    };
  }, [roomName]);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageData: Message = {
      room: roomName,
      sender: currentUser.name,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Emit to backend
    socket.emit('send_message', messageData);
    setInputText('');
  };

  return (
    <div className="bg-gray-800 border border-blue-500/30 rounded-xl shadow-2xl flex flex-col h-[450px] mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">🟢 Active Match</span>
          <h2 className="text-base font-bold text-gray-200 capitalize">{displayRoomName}</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all"
        >
          Back to Matches
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950/40">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-12">
            <span className="text-2xl">🤝</span>
            <p className="mt-2">Room created! Say hi and set up your game.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === currentUser.name;
            return (
              <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-0.5 px-1">{msg.sender}</span>
                <div 
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                  }`}
                >
                  <p className="break-all">{msg.text}</p>
                  <span className="text-[9px] text-gray-300 block text-right mt-1 opacity-70">{msg.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSendMessage} className="p-3 bg-gray-900 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-950 border border-gray-700 px-3.5 py-2 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-950"
        >
          Send
        </button>
      </form>
    </div>
  );
}