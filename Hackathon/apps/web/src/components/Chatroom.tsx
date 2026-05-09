import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapEmbed } from './MapEmbed'; // 👈 Imported our map component

const socket = io('http://localhost:3000');

interface Message {
  room: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface EventData {
  id: number;
  room: string;
  venue: string;
  time: string;
  price: string;
  rsvps: string;
}

interface ChatRoomProps {
  roomName: string; 
  currentUser: { id: number; name: string };
  matchedUsers: Array<{ id: number; name: string }>;
  onClose: () => void;
}

export function ChatRoom({ roomName, currentUser, matchedUsers, onClose }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Event State
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [venueInput, setVenueInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [priceInput, setPriceInput] = useState('Free');

  // Nominating Captain (Deterministic: Person in the matching group with the lowest User ID is Captain)
  const allGroupMembers = [currentUser, ...matchedUsers].sort((a, b) => a.id - b.id);
  const captain = allGroupMembers[0];
  const isCaptain = currentUser.id === captain?.id;

  const displayRoomName = roomName.replace('-', ' ') + ' Matchup';

  useEffect(() => {
    setLoadingHistory(true);

    // Fetch Chat History
    fetch(`http://localhost:3000/api/messages/${roomName}`)
      .then((res) => res.json())
      .then((history: Message[]) => {
        setMessages(history);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));

    // Fetch Active Coordinated Event
    fetch(`http://localhost:3000/api/events/${roomName}`)
      .then((res) => res.json())
      .then((event) => {
        if (event) setActiveEvent(event);
      });

    socket.emit('join_room', roomName);

    socket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('event_created', (event: EventData) => {
      setActiveEvent(event);
    });

    socket.on('rsvp_updated', (event: EventData) => {
      setActiveEvent(event);
    });

    return () => {
      socket.emit('leave_room', roomName);
      socket.off('receive_message');
      socket.off('event_created');
      socket.off('rsvp_updated');
    };
  }, [roomName]);

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

    socket.emit('send_message', messageData);
    setInputText('');
  };

  // Captain: Create/Plan a Spontaneous Event
  const handleProposeEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomName,
          venue: venueInput,
          time: timeInput,
          price: priceInput,
          captainName: captain.name,
        }),
      });
      setVenueInput('');
      setTimeInput('');
    } catch (err) {
      console.error("Failed to propose event.");
    }
  };

  // User: Toggle RSVP ("Show Up!")
  const handleToggleRSVP = async () => {
    if (!activeEvent) return;
    try {
      await fetch(`http://localhost:3000/api/events/${activeEvent.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser.name }),
      });
    } catch (err) {
      console.error("RSVP failed.");
    }
  };

  const currentAttendees = activeEvent?.rsvps ? activeEvent.rsvps.split(',').filter(Boolean) : [];
  const hasRSVPd = currentAttendees.includes(currentUser.name);

  return (
    <div className="bg-gray-800 border border-blue-500/30 rounded-xl shadow-2xl flex flex-col min-h-[500px] mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <div>
          <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
            👑 Captain: {captain?.name || 'Assigned'}
          </span>
          <h2 className="text-base font-bold text-gray-200 capitalize">{displayRoomName}</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all"
        >
          Back to Matches
        </button>
      </div>

      {/* PERSISTENT COORDINATED EVENT PLANNER CARD */}
      <div className="p-4 bg-gray-950/70 border-b border-gray-700/60">
        {activeEvent ? (
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3.5 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  📍 Spontaneous Meetup Plan
                </span>
                <p className="text-sm font-bold text-gray-100 mt-1">🏟️ Venue: {activeEvent.venue}</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-0.5">
                  <span>🕒 Time: {activeEvent.time}</span>
                  <span>💵 Fee: {activeEvent.price}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  <span className="text-[10px] text-gray-500 mr-1">Attendees ({currentAttendees.length}):</span>
                  {currentAttendees.map((name) => (
                    <span key={name} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleToggleRSVP}
                className={`w-full md:w-auto px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                  hasRSVPd
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/20'
                }`}
              >
                {hasRSVPd ? 'Show Up Confirmed! ✓' : 'I am showing up! 🏃‍♂️'}
              </button>
            </div>

            {/* 👈 Dynamic Map Coordination Visualizer */}
            <MapEmbed venueName={activeEvent.venue} />
          </div>
        ) : (
          isCaptain ? (
            <form onSubmit={handleProposeEvent} className="bg-gray-900 p-3 rounded-lg border border-gray-800 space-y-3">
              <span className="text-[9px] font-bold bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                👑 Captain's Planning Tool
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Venue (e.g. Baza 2 Timisoara)"
                  className="bg-gray-950 border border-gray-800 p-2 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  value={venueInput}
                  onChange={(e) => setVenueInput(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Date/Time (e.g. Saturday @ 18:00)"
                  className="bg-gray-950 border border-gray-800 p-2 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  required
                />
                <select
                  className="bg-gray-950 border border-gray-800 p-2 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                >
                  <option value="Free (No Fee)">Free (No Fee)</option>
                  <option value="15 RON / person">15 RON / person</option>
                  <option value="30 RON / person">30 RON / person</option>
                  <option value="Split court fee">Split court fee</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 py-1.5 rounded text-xs font-bold text-gray-950 transition-all">
                Publish Spontaneous Event
              </button>
            </form>
          ) : (
            <p className="text-gray-500 text-xs text-center py-2 italic">
              Waiting for Captain <strong>{captain?.name}</strong> to propose an active venue meetup time...
            </p>
          )
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950/40 max-h-[220px]">
        {loadingHistory ? (
          <div className="text-center text-gray-500 text-sm py-12 flex flex-col items-center justify-center">
            <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs text-gray-400">Loading chatlogs...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-12">
            <span className="text-2xl">🤝</span>
            <p className="mt-2 text-xs">Spontaneous room created! Coordinate details with your local teammates.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === currentUser.name;
            return (
              <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-0.5 px-1">{msg.sender}</span>
                <div 
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs ${
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
          className="flex-1 bg-gray-950 border border-gray-700 px-3.5 py-2 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 placeholder-gray-500"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loadingHistory}
        />
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          disabled={loadingHistory}
        >
          Send
        </button>
      </form>
    </div>
  );
}