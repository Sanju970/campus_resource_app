// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Import DB Connection ---
const db = require('./config/db');

// --- Import Routes ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const eventRoutes = require('./routes/events');
const favoriteRoutes = require('./routes/favorites');
const notificationRoutes = require('./routes/notifications');
const registrationRoutes = require('./routes/event_registrations');

// --- Initialize Express App ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Verify DB Connection ---
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

// --- Mount All Routes ---
app.use('/api/auth', authRoutes);              // login, signup, password change
app.use('/api', userRoutes);                   // admin users create/deactivate/reactivate/fetch
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/event_registrations', registrationRoutes);

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('🎓 Campus Portal Backend is running successfully!');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
