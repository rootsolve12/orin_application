const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const collabRoutes = require('./routes/collab');

// Mount Routes
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collab', collabRoutes);

module.exports = app;
