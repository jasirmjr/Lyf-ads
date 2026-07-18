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


// POST: Add a new employee record
app.post('/api/employees', async (req, res) => {
  const { first_name, last_name, email, role, department_id } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required fields.' });
  }

  try {
    const queryText = `
      INSERT INTO employees (first_name, last_name, email, role, department_id)
      VALUES ($1, $2, $3, COALESCE($4, 'employee'), $5)
      RETURNING *;
    `;
    const values = [first_name, last_name, email, role, department_id || null];
    const result = await pool.query(queryText, values);
    
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // PostgreSQL Unique Violation error code
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

// CRITICAL FOR VERCEL: Export the app instead of app.listen()
module.exports = app;