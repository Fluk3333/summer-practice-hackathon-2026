import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

app.use(express.json());
app.use(cors());

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'mysql',
  logging: false,
});

// ==========================================
// MODELS
// ==========================================

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING, // 👈 Added user bio / short description
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sports: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  showUpToday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  room: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

// 👈 New Event Model to assist Captain coordination
const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  room: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Only one active event per sport group
  },
  venue: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.STRING,
    defaultValue: 'Free',
  },
  rsvps: {
    type: DataTypes.TEXT, // Comma-separated list of RSVP'd users (e.g. "Andrei,Maria")
    defaultValue: '',
  }
});

sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database & Tables synced to AWS'))
  .catch(err => console.error('❌ Database connection failed:', err));

// ==========================================
// SOCKETS
// ==========================================
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  socket.on('join_room', (roomName: string) => {
    socket.join(roomName);
  });

  socket.on('leave_room', (roomName: string) => {
    socket.leave(roomName);
  });

  socket.on('send_message', async (data: { room: string; sender: string; text: string; timestamp: string }) => {
    try {
      await Message.create({
        room: data.room,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp
      });
      io.to(data.room).emit('receive_message', data);
    } catch (err) {
      console.error("❌ Failed to save message:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔥 User disconnected');
  });
});

// ==========================================
// REST ROUTES
// ==========================================

app.get('/api/ping', (req, res) => {
  res.json({ message: "Pong!", timestamp: new Date() });
});

// Chat room historical feed
app.get('/api/messages/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const history = await Message.findAll({
      where: { room: roomName },
      order: [['createdAt', 'ASC']],
      limit: 50
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve chat history." });
  }
});

// Fetch Active Event for a specific Chat Room
app.get('/api/events/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const event = await Event.findOne({ where: { room: roomName } });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to load active group event." });
  }
});

// Create/Replace an Event (Captain privilege)
app.post('/api/events', async (req, res) => {
  try {
    const { room, venue, time, price, captainName } = req.body;

    // Remove old event if it exists to clean up
    await Event.destroy({ where: { room } });

    // Create a new event with the captain pre-RSVP'd
    const event = await Event.create({
      room,
      venue,
      time,
      price,
      rsvps: captainName, // Captain is automatically attending
    });

    // 📢 Real-time announcement inside this room!
    io.to(room).emit('event_created', event);
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: "Failed to save coordinated event." });
  }
});

// Toggle RSVP status ("Show Up" / "Leave Event")
app.post('/api/events/:id/rsvp', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;

    const event = await Event.findByPk(id) as any;
    if (!event) return res.status(404).json({ error: "Event not found" });

    let attendeeArray = event.rsvps ? event.rsvps.split(',').filter(Boolean) : [];

    if (attendeeArray.includes(userName)) {
      // Toggle off: Remove RSVP
      attendeeArray = attendeeArray.filter((name: string) => name !== userName);
    } else {
      // Toggle on: Add RSVP
      attendeeArray.push(userName);
    }

    event.rsvps = attendeeArray.join(',');
    await event.save();

    // 📢 Sync attendance changes in real-time
    io.to(event.room).emit('rsvp_updated', event);
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: "Failed to process RSVP request." });
  }
});

app.post('/api/users/sync', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { name, email, showUpToday: false }
    });
    
    if (created) {
      io.emit('user_created', user);
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to sync user session." });
  }
});

// Profile update including descriptions
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { location, sports, showUpToday, description } = req.body;
    
    await User.update({ location, sports, showUpToday, description }, { where: { id } });
    
    const updatedUser = await User.findByPk(id);
    io.emit('user_updated', updatedUser);
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: "Failed to update profile details." });
  }
});

app.get('/api/matches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findByPk(userId) as any;
    if (!currentUser || !currentUser.location || !currentUser.sports) {
      return res.json([]);
    }

    const currentUserSports = currentUser.sports.split(',').filter(Boolean);

    const locals = await User.findAll({
      where: {
        location: { [Op.like]: `%${currentUser.location}%` },
        id: { [Op.ne]: userId },
        showUpToday: true
      }
    }) as any[];

    const matchedAthletes = locals.filter((local) => {
      if (!local.sports) return false;
      const localSports = local.sports.split(',').filter(Boolean);
      return currentUserSports.some((sport: string) => localSports.includes(sport));
    });

    res.json(matchedAthletes);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate matches." });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await User.destroy({ where: { id } });
    if (deletedCount > 0) {
      io.emit('user_deleted', { id: parseInt(id) });
      res.json({ success: true, message: "User deleted" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to load directory." });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server + Realtime running on http://localhost:${PORT}`);
});