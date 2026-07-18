// api/index.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Set up the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for cloud providers like Neon/Supabase
  }
});

// A test API route
app.get('/api/health', async (req, res) => {
  try {
    // Basic query to check if the database is responding
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'success', 
      message: 'Backend and Database are connected!',
      time: dbCheck.rows[0].now 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// CRITICAL FOR VERCEL: Export the app instead of app.listen()
module.exports = app;