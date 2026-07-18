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


// POST: Submit a new daily report
app.post('/api/reports', async (req, res) => {
  const { employee_id, project_id, date, hours_worked, tasks_completed, blockers, status } = req.body;

  // Basic validation
  if (!employee_id || !hours_worked || !tasks_completed) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const queryText = `
      INSERT INTO daily_reports (employee_id, project_id, date, hours_worked, tasks_completed, blockers, status)
      VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, COALESCE($7, 'draft'))
      ON CONFLICT (employee_id, date) 
      DO UPDATE SET 
        project_id = EXCLUDED.project_id,
        hours_worked = EXCLUDED.hours_worked,
        tasks_completed = EXCLUDED.tasks_completed,
        blockers = EXCLUDED.blockers,
        status = EXCLUDED.status
      RETURNING *;
    `;

    const values = [employee_id, project_id || null, date, hours_worked, tasks_completed, blockers || '', status];
    const result = await pool.query(queryText, values);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database transaction failed: ' + err.message });
  }
});

// GET: Fetch all reports (For HR/Managers to view/filter)
app.get('/api/reports', async (req, res) => {
  try {
    const queryText = `
      SELECT r.*, e.first_name, e.last_name, p.name as project_name 
      FROM daily_reports r
      JOIN employees e ON r.employee_id = e.id
      LEFT JOIN projects p ON r.project_id = p.id
      ORDER BY r.date DESC;
    `;
    const result = await pool.query(queryText);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


//add employee
app.post('/api/employees', async (req, res) => {
  // We accept 'name' (Full Name) and 'phone' now
  const { name, email, role, phone, department_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required fields.' });
  }

  // Split full name into first and last name for your existing table structure
  const nameParts = name.trim().split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ') || '';

  try {
    const queryText = `
      INSERT INTO employees (first_name, last_name, email, role, phone, department_id)
      VALUES ($1, $2, $3, COALESCE($4, 'employee'), $5, $6)
      RETURNING *;
    `;
    const values = [first_name, last_name, email, role, phone || null, department_id || null];
    const result = await pool.query(queryText, values);
    
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An employee with this email address already exists.' });
    }
    res.status(500).json({ error: 'Database transaction failed.' });
  }
});

// GET: Fetch all employees with their department names
app.get('/api/employees', async (req, res) => {
  try {
    const queryText = `
      SELECT e.*, d.name as department_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.id DESC;
    `;
    const result = await pool.query(queryText);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve employee listing.' });
  }
});


// POST: Unified Login Verification Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Check if the user exists in the database by email
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role FROM employees WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No user found with this email address.' });
    }

    const user = result.rows[0];

    // 2. Simple password check for demonstration/testing
    if (password !== 'admin123') {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Success: Return user profile data and role category back to frontend
    res.json({
      status: 'success',
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role // 'hr', 'manager', or 'employee'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server authentication database failure.' });
  }
});

// CRITICAL FOR VERCEL: Export the app instead of app.listen()
module.exports = app;