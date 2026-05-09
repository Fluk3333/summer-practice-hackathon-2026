import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());


const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'mysql',
  logging: false,
});


const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
  },
});


sequelize.sync()
  .then(() => console.log('✅ Database & Tables synced to AWS'))
  .catch(err => console.error('❌ Database connection failed:', err));


app.get('/api/ping', (req, res) => {
  res.json({ message: "Pong! The Brain is alive.", timestamp: new Date() });
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body;
    const newUser = await User.create({ email, name });
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: "Failed to create user." });
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});