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

// Database client setup complete
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
    type: DataTypes.STRING,
    allowNull: true,
  },
  skillLevel: {
    type: DataTypes.STRING,
    defaultValue: 'Intermediate',
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

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  room: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
    type: DataTypes.TEXT,
    defaultValue: '',
  }
});

sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database & Tables synced to AWS'))
  .catch(err => console.error('❌ Database connection failed:', err));

const SUGGESTED_VENUES: Record<string, { venue: string; price: string }> = {
  Tennis: { venue: "Baza 2 UPT (Strada recoltei, Timisoara)", price: "40 RON / hour" },
  Basketball: { venue: "Sala Olimpia (Timisoara Indoor Court)", price: "Split Court Fee (approx 20 RON)" },
  Soccer: { venue: "Teren Sintetic Decathlon Timisoara", price: "Free (Spontaneous Grassroots)" },
  Running: { venue: "Parcul Copiilor track & Bega River Canal", price: "Free (Outdoor)" },
  Volleyball: { venue: "Baza Sportiva UVT (Oituz, Timisoara)", price: "30 RON / hour" },
  Badminton: { venue: "Sala de Sport Banu Sport Timisoara", price: "25 RON / hour" }
};

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

    await Event.destroy({ where: { room } });

    const event = await Event.create({
      room,
      venue,
      time,
      price,
      rsvps: captainName,
    });

    io.to(room).emit('event_created', event);
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: "Failed to save coordinated event." });
  }
});

// 👈 NEW: Cancel/Delete Event (Captain Privilege)
app.delete('/api/events/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    
    await Event.destroy({ where: { room: roomName } });
    
    // 📢 Tell everyone in the room to hide the event panel!
    io.to(roomName).emit('event_cancelled');
    
    res.json({ success: true, message: "Match plan cancelled" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel planned match." });
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
      attendeeArray = attendeeArray.filter((name: string) => name !== userName);
    } else {
      attendeeArray.push(userName);
    }

    event.rsvps = attendeeArray.join(',');
    await event.save();

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
      defaults: { name, email, showUpToday: false, skillLevel: 'Intermediate' }
    });
    
    if (created) {
      io.emit('user_created', user);
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to sync user session." });
  }
});

// Profile update
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { location, sports, showUpToday, description, skillLevel } = req.body;
    
    await User.update({ location, sports, showUpToday, description, skillLevel }, { where: { id } });
    
    const updatedUser = await User.findByPk(id);
    io.emit('user_updated', updatedUser);
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: "Failed to update profile details." });
  }
});

// Upgraded Matchmaking
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

    const matchedAthletes = locals
      .filter((local) => {
        if (!local.sports) return false;
        const localSports = local.sports.split(',').filter(Boolean);
        return currentUserSports.some((sport: string) => localSports.includes(sport));
      })
      .map((local) => {
        const userSkill = (currentUser.skillLevel || 'Intermediate').trim();
        const localSkill = (local.skillLevel || 'Intermediate').trim();

        let skillBonus = 20;
        if (userSkill === localSkill) {
          skillBonus = 30;
        } else if (
          (userSkill === 'Beginner' && localSkill === 'Advanced') ||
          (userSkill === 'Advanced' && localSkill === 'Beginner')
        ) {
          skillBonus = 10;
        }

        const compatibilityScore = 70 + skillBonus;

        return {
          id: local.id,
          name: local.name,
          email: local.email,
          description: local.description,
          location: local.location,
          sports: local.sports,
          skillLevel: localSkill,
          compatibility: compatibilityScore 
        };
      });

    // ==========================================
    // AUTO-EVENT GENERATOR
    // ==========================================
    for (const sport of currentUserSports) {
      const sportSpecificMatches = matchedAthletes.filter(athlete => 
        athlete.sports?.split(',').includes(sport)
      );

      const totalGroupSizeIncludingMe = sportSpecificMatches.length + 1;
      const minRequiredGroup = (sport === 'Tennis' || sport === 'Badminton' || sport === 'Running') ? 2 : 3;

      if (totalGroupSizeIncludingMe >= minRequiredGroup) {
        const roomName = `${currentUser.location.replace(/\s+/g, '')}-${sport}`;
        
        const existingEvent = await Event.findOne({ where: { room: roomName } });
        if (!existingEvent) {
          const suggestion = SUGGESTED_VENUES[sport] || { venue: "Local Community Court", price: "Free" };
          const deterministicCaptain = [currentUser, ...sportSpecificMatches].sort((a, b) => a.id - b.id)[0];

          await Event.create({
            room: roomName,
            venue: `${suggestion.venue} (Auto-Generated Group Match)`,
            time: "Spontaneous Game - Tonight at 19:30",
            price: suggestion.price,
            rsvps: deterministicCaptain.name,
          });

          console.log(`🤖 Auto-Event generated for room: ${roomName}`);
        }
      }
    }

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