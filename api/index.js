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


// POST: Submit Daily Report
app.post('/api/reports', async (req, res) => {
  const { employee_id, date, project_name, work_status, start_time, end_time, remarks } = req.body;

  if (!employee_id || !project_name || !work_status || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required report fields.' });
  }

  try {
    const queryText = `
      INSERT INTO daily_reports (employee_id, date, project_name, work_status, start_time, end_time, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (employee_id, date, project_name) 
      DO UPDATE SET 
        work_status = EXCLUDED.work_status,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        remarks = EXCLUDED.remarks
      RETURNING *;
    `;
    const values = [employee_id, date, project_name, work_status, start_time, end_time, remarks];
    const result = await pool.query(queryText, values);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database transaction failed.' });
  }
});

// GET: Fetch Work Reports & Status Trackers (Updated with Dynamic History Date Filter)
app.get('/api/reports', async (req, res) => {
  const { employee_id, role, date } = req.query;

  try {
    // Standard User: Only fetch their individual history log list
    if (role !== 'hr' && role !== 'manager') {
      const queryText = `
        SELECT r.*, concat(e.first_name, ' ', e.last_name) as employee_name, d.name as department_name 
        FROM daily_reports r
        JOIN employees e ON r.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE r.employee_id = $1
        ORDER BY r.date DESC, r.id DESC;
      `;
      const result = await pool.query(queryText, [parseInt(employee_id)]);
      return res.json({ status: 'success', data: result.rows, type: 'individual' });
    }

    // HR Admin Dashboard: Handle conditional filtering for either a single Day or an entire Month
    const filterDate = date || new Date().toISOString().split('T')[0];
    const isMonthRange = req.query.range === 'month';

    let queryText = '';
    const values = [];

    if (isMonthRange) {
      // 1. ADVANCED MONTH RANGE: Cross-joins generated dates against all employees
      const yearMonth = filterDate.substring(0, 7);
      
      queryText = `
        WITH month_days AS (
          SELECT generate_series(
            date_trunc('month', ($1 || '-01')::date),
            (date_trunc('month', ($1 || '-01')::date) + interval '1 month' - interval '1 day')::date,
            interval '1 day'
          )::date AS report_date
        )
        SELECT 
          e.id as employee_id,
          concat(e.first_name, ' ', e.last_name) as employee_name,
          d.name as department_name,
          r.id as report_id,
          md.report_date as date,
          r.project_name,
          r.work_status,
          r.start_time,
          r.end_time,
          r.remarks,
          CASE 
            WHEN r.id IS NOT NULL THEN 'Submitted'
            ELSE 'Pending'
          END as submission_status
        FROM month_days md
        CROSS JOIN employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN daily_reports r ON e.id = r.employee_id AND r.date = md.report_date
        ORDER BY md.report_date ASC, employee_name ASC;
      `;
      values.push(yearMonth);
      
    } else {
      // 2. STANDARD SINGLE DAY VIEW: Queries a specific timestamp safely using table 'r'
      queryText = `
        SELECT 
          e.id as employee_id,
          concat(e.first_name, ' ', e.last_name) as employee_name,
          d.name as department_name,
          r.id as report_id,
          r.date,
          r.project_name,
          r.work_status,
          r.start_time,
          r.end_time,
          r.remarks,
          CASE 
            WHEN r.id IS NOT NULL THEN 'Submitted'
            ELSE 'Pending'
          END as submission_status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN daily_reports r ON e.id = r.employee_id AND r.date = $1
        ORDER BY submission_status ASC, employee_name ASC;
      `;
      values.push(filterDate);
    }

    const result = await pool.query(queryText, values);
    res.json({ status: 'success', data: result.rows, type: 'hr-dashboard' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// POST: Onboard a new employee with dynamic department and role mapping
app.post('/api/employees', async (req, res) => {
  const { name, email, phone, department_id, design_role_id } = req.body;

  if (!name || !email || !department_id || !design_role_id) {
    return res.status(400).json({ error: 'Name, email, department, and role are required fields.' });
  }

  // Split full name into first and last name for database table structure consistency
  const nameParts = name.trim().split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ') || '';

  try {
    const queryText = `
      INSERT INTO employees (first_name, last_name, email, phone, department_id, design_role_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      first_name, 
      last_name, 
      email.trim().toLowerCase(), 
      phone || null, 
      parseInt(department_id), 
      parseInt(design_role_id)
    ];
    
    const result = await pool.query(queryText, values);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An employee profile with this corporate email already exists.' });
    }
    res.status(500).json({ error: 'Database transaction failed.' });
  }
});

// GET: Fetch all employees with their department names
app.get('/api/employees', async (req, res) => {
  try {
    const queryText = `
      SELECT e.*, concat(e.first_name, ' ', e.last_name) as full_name, d.name as department_name, r.role_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN department_roles r ON e.design_role_id = r.id
      ORDER BY e.id DESC
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
      `SELECT 
        e.id, 
        e.first_name, 
        e.last_name, 
        e.email, 
        r.role_name as role, 
        d.name as department_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN department_roles r ON e.design_role_id = r.id
      WHERE e.email = $1`,
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
        role: user.role,
        department: user.department_name || 'General Operations' // Packaged for frontend autofill
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server authentication database failure.' });
  }
});

// GET: Fetch all departments along with their inner mapped sub-roles
app.get('/api/departments', async (req, res) => {
  try {
    const depts = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    const roles = await pool.query('SELECT * FROM department_roles ORDER BY role_name ASC');

    const structure = depts.rows.map(dept => ({
      ...dept,
      roles: roles.rows.filter(r => r.department_id === dept.id)
    }));

    res.json({ status: 'success', data: structure });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add a new department
app.post('/api/departments', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json({ status: 'success', data: { ...result.rows[0], roles: [] } });
  } catch (err) {
    res.status(500).json({ error: 'Department name already exists or query failed.' });
  }
});

// POST: Add a sub-role inside a department
app.post('/api/departments/roles', async (req, res) => {
  const { department_id, role_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO department_roles (department_id, role_name) VALUES ($1, $2) RETURNING *',
      [department_id, role_name.trim()]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Role already exists inside this department.' });
  }
});

// DELETE: Remove a department entirely
app.delete('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // ON DELETE CASCADE on the foreign key constraints will handle dependent roles
    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [parseInt(id)]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found.' });
    
    res.json({ status: 'success', message: 'Department removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete department.' });
  }
});

// DELETE: Remove a single sub-role inside a department
app.delete('/api/departments/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM department_roles WHERE id = $1 RETURNING *', [parseInt(id)]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found.' });
    
    res.json({ status: 'success', message: 'Sub-role removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete sub-role.' });
  }
});

// DELETE: Remove an employee record by ID
app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    
    res.json({ status: 'success', message: 'Employee record successfully removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete employee due to database dependencies.' });
  }
});

// CRITICAL FOR VERCEL: Export the app instead of app.listen()
module.exports = app;