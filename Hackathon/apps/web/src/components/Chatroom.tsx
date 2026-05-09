import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapEmbed } from './MapEmbed';
import styles from './Chatroom.module.css';

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

  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [venueInput, setVenueInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [priceInput, setPriceInput] = useState('Free');

  const [weatherSuggest, setWeatherSuggest] = useState<{ temp: number; desc: string; suggest: string }>({
    temp: 21,
    desc: "Partly Cloudy",
    suggest: "Perfect conditions for outdoor sports!"
  });

  const allGroupMembers = [currentUser, ...matchedUsers].sort((a, b) => a.id - b.id);
  const captain = allGroupMembers[0];
  const isCaptain = currentUser.id === captain?.id;

  const displayRoomName = roomName.replace('-', ' ') + ' Matchup';

  useEffect(() => {
    setLoadingHistory(true);

    fetch(`http://localhost:3000/api/messages/${roomName}`)
      .then((res) => res.json())
      .then((history: Message[]) => {
        setMessages(history);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));

    fetch(`http://localhost:3000/api/events/${roomName}`)
      .then((res) => res.json())
      .then((event) => {
        if (event) setActiveEvent(event);
      });

    const currentHour = new Date().getHours();
    if (currentHour > 19 || currentHour < 7) {
      setWeatherSuggest({
        temp: 14,
        desc: "Clear Night",
        suggest: "Recommend courts with active floodlight setups!"
      });
    } else {
      setWeatherSuggest({
        temp: 23,
        desc: "Warm & Sunny ☀️",
        suggest: "Ideal outdoor match weather! Book Baza 2 outdoor courts."
      });
    }

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

    socket.on('event_cancelled', () => {
      setActiveEvent(null);
    });

    return () => {
      socket.emit('leave_room', roomName);
      socket.off('receive_message');
      socket.off('event_created');
      socket.off('rsvp_updated');
      socket.off('event_cancelled');
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

  const handleCallRainCheck = async () => {
    try {
      await fetch(`http://localhost:3000/api/events/${roomName}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error("Failed to cancel event.");
    }
  };

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
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <div>
          <span className={styles.captainBadge}>
            👑 Captain: {captain?.name || 'Assigned'}
          </span>
          <h2 className={styles.roomTitle}>{displayRoomName}</h2>
        </div>
        <button onClick={onClose} className={styles.backButton}>
          Back to Matches
        </button>
      </div>

      <div className={styles.eventTray}>
        {activeEvent ? (
          <div className={styles.activePlanCard}>
            <div>
              <span className={styles.eventTitle}>
                📍 Spontaneous Meetup Plan
              </span>
              <p className={styles.venueText}>🏟️ Venue: {activeEvent.venue}</p>
              <div className={styles.detailsRow}>
                <span>🕒 Time: {activeEvent.time}</span>
                <span>💵 Fee: {activeEvent.price}</span>
              </div>
              <div className={styles.attendeesContainer}>
                <span className={styles.attendeeLabel}>Attendees ({currentAttendees.length}):</span>
                {currentAttendees.map((name) => (
                  <span key={name} className={styles.attendeePill}>
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.actionButtonContainer}>
              <button
                onClick={handleToggleRSVP}
                className={`${styles.rsvpButton} ${hasRSVPd ? styles.rsvpConfirmed : styles.rsvpPending}`}
              >
                {hasRSVPd ? 'Show Up Confirmed! ✓' : 'I am showing up! 🏃‍♂️'}
              </button>

              {isCaptain && (
                <button onClick={handleCallRainCheck} className={styles.rainCheckButton}>
                  Call a Rain Check 🌧️
                </button>
              )}
            </div>
          </div>
        ) : (
          isCaptain ? (
            <div className="space-y-3">

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center gap-3 text-xs">
                <span className="text-xl">🌤️</span>
                <div>
                  <p className="font-bold text-emerald-400">Timisoara Weather: {weatherSuggest.temp}°C — {weatherSuggest.desc}</p>
                  <p className="text-gray-400 text-[11px]">{weatherSuggest.suggest}</p>
                </div>
              </div>

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
            </div>
          ) : (
            <p className="text-gray-500 text-xs text-center py-2 italic">
              Waiting for Captain <strong>{captain?.name}</strong> to propose an active venue meetup time...
            </p>
          )
        )}
      </div>

      <div className={styles.feed}>
        {loadingHistory ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner}></div>
            <p className="text-xs text-gray-400">Loading chatlogs...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.loadingBox}>
            <span className="text-2xl">🤝</span>
            <p className="mt-2 text-xs">Spontaneous room created! Coordinate details with your local teammates.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === currentUser.name;
            return (
              <div 
                key={index} 
                className={`${styles.msgGroup} ${isMe ? styles.msgRight : styles.msgLeft}`}
              >
                <span className={styles.senderName}>{msg.sender}</span>
                <div className={`${styles.bubble} ${isMe ? styles.bubbleRight : styles.bubbleLeft}`}>
                  <p>{msg.text}</p>
                  <span className={styles.timestamp}>{msg.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputTray}>
        <input
          type="text"
          className={styles.inputField}
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loadingHistory}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={loadingHistory}
        >
          Send
        </button>
      </form>
    </div>
  );
}