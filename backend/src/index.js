require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

// Allow both React dev servers: localhost:3000 & localhost:5173
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn('Blocked by CORS:', origin);
        return callback(
          new Error('CORS not allowed for this origin: ' + origin),
          false
        );
      }
    },
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Check MySQL connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database');
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));

// Default route for sanity check
app.get('/', (req, res) => {
  res.send('Campus Portal API running successfully');
});

// Global error handler (optional but helpful)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
