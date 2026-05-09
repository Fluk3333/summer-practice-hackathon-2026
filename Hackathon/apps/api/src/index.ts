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

io.on('connection', (socket) => {
  console.log('⚡ A user connected to websocket:', socket.id);

  socket.on('join_room', (roomName: string) => {
    socket.join(roomName);
    console.log(`👤 User ${socket.id} joined room: ${roomName}`);
  });

  socket.on('leave_room', (roomName: string) => {
    socket.leave(roomName);
    console.log(`👤 User ${socket.id} left room: ${roomName}`);
  });

  socket.on('send_message', (data: { room: string; sender: string; text: string; timestamp: string }) => {
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('🔥 User disconnected from websocket');
  });
});

const PORT = 3000;

app.use(express.json());
app.use(cors());

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'mysql',
  logging: false,
});

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
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sports: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database & Tables synced to AWS'))
  .catch(err => console.error('❌ Database connection failed:', err));


app.get('/api/ping', (req, res) => {
  res.json({ message: "Pong! The Brain is alive.", timestamp: new Date() });
});

app.post('/api/users/sync', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { name, email }
    });
    
    if (created) {
      io.emit('user_created', user);
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to sync user session." });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { location, sports } = req.body;
    
    await User.update({ location, sports }, { where: { id } });
    
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
        location: {
          [Op.like]: `%${currentUser.location}%`
        },
        id: {
          [Op.ne]: userId
        }
      }
    }) as any[];

    const matchedAthletes = locals.filter((local) => {
      if (!local.sports) return false;
      const localSports = local.sports.split(',').filter(Boolean);
      return currentUserSports.some((sport: string) => localSports.includes(sport));
    });

    res.json(matchedAthletes);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate matching athletes." });
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
    res.status(500).json({ error: "Failed to fetch user list." });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server + Realtime running on http://localhost:${PORT}`);
});