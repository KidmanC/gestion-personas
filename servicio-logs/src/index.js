const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require("./db.js");

const app = express();
const PORT = 3005;

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Logs Service working!',
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Add new log
app.post('/logs', async (req, res) => {
  try {
    const { timestamp, action, documentNumber, service, details } = req.body;

    const newTimestamp = timestamp || new Date().toISOString();

    const query = `
      INSERT INTO logs (
        "timestamp", "action", "documentNumber", "service", "details", "receivedAt"
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;

    const values = [
      newTimestamp,
      action,
      documentNumber,
      service,
      details || null
    ];

    const { rows } = await pool.query(query, values);

    res.status(201).json({
      message: "Log registered successfully",
      log: rows[0]
    });

  } catch (error) {
    console.error('Error registering log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all logs
app.get('/logs', async (req, res) => {
  try {
    const { action, documentNumber, date } = req.query;

    let query = "SELECT * FROM logs WHERE 1=1";
    const params = [];

    if (action) {
      params.push(`%${action}%`);
      query += ` AND LOWER(action) LIKE LOWER($${params.length})`;
    }

    if (documentNumber) {
      params.push(documentNumber);
      query += ` AND documentNumber = $${params.length}`;
    }

    if (date) {
      params.push(`${date}%`);
      query += ` AND TO_CHAR(timestamp, 'YYYY-MM-DD') = $${params.length}`;
    }

    const { rows } = await pool.query(query, params);

    res.json({
      message: "Logs retrieved successfully",
      count: rows.length,
      filters: { action, documentNumber, date },
      data: rows
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get log by ID
app.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      "SELECT * FROM logs WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Log not found" });
    }

    res.json({
      message: "Log found successfully",
      data: rows
    });

  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all logs 
app.delete('/logs', async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM logs");

    res.json({
      message: "All logs deleted successfully",
      logsDeleted: rowCount
    });

  } catch (error) {
    console.error('Error deleting logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear logs by filter
app.delete('/logs/filter', async (req, res) => {
  try {
    const { action, documentNumber, service } = req.body;

    let query = "DELETE FROM logs WHERE 1=1";
    const params = [];

    if (action) {
      params.push(action);
      query += ` AND action = $${params.length}`;
    }

    if (documentNumber) {
      params.push(documentNumber);
      query += ` AND documentNumber = $${params.length}`;
    }

    if (service) {
      params.push(service);
      query += ` AND service = $${params.length}`;
    }

    const result = await pool.query(query, params);

    res.json({
      message: "Logs deleted by filter successfully",
      logsDeleted: result.rowCount,
      filtersApplied: { action, documentNumber, service }
    });

  } catch (error) {
    console.error('Error deleting logs by filter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Logs Service running on port ${PORT}`);
});