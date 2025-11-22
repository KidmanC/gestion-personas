const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./db.js');
const axios = require('axios');

// Function to register logs
const registerLog = async (action, documentNumber, details = {}) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      action: action,
      documentNumber: documentNumber,
      service: 'query-service',
      details: details
    };

    // Show in console
    console.log('LOG REGISTERED:', JSON.stringify(logData, null, 2));

    // Send to logging service
    try {
      await axios.post('http://logs-service:3005/logs', logData);
      console.log('Log sent to logging service successfully');
    } catch (logError) {
      console.error('Failed to send log to logging service:', logError.message);
    }

  } catch (error) {
    console.error('Error registering log:', error);
  }
};

const app = express();
const PORT = 3002; // Puerto diferente al de creación

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Query Microservice working!',
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Get all persons
app.get('/persons', async (req, res) => {
  try {
    console.log('Fetching all persons');

    const { rows } = await pool.query("SELECT * FROM persons");

    await registerLog('PERSONS_LIST_REQUESTED', "ALL", {
      personsCount: rows.length
    });

    res.json({
      message: 'Persons retrieved successfully',
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get person by document number
app.get('/persons/:documentNumber', async (req, res) => {
  try {
    const { documentNumber } = req.params;
    console.log('Searching for document:', documentNumber);

    const { rows } = await pool.query(
      `SELECT * FROM persons WHERE "documentNumber" = $1`,
      [documentNumber]
    );

    if (rows.length === 0) {
      await registerLog('PERSON_SEARCH_NOT_FOUND', documentNumber);
      return res.status(404).json({
        error: 'Person not found',
        documentNumber
      });
    }

    const person = rows[0];

    await registerLog('PERSON_SEARCH_SUCCESS', documentNumber, {
      personFound: `${person.firstName} ${person.lastNames}`
    });

    res.json({
      message: 'Person found successfully',
      data: person
    });

  } catch (error) {
    console.error('Error searching person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search persons by criteria (name, email, etc.)
app.get('/persons/search/:criteria', async (req, res) => {
  try {
    const { criteria } = req.params;
    console.log('Searching with criteria:', criteria);

    const query = `
      SELECT *
      FROM persons
      WHERE LOWER("firstName") LIKE LOWER($1)
         OR LOWER("lastNames") LIKE LOWER($1)
         OR LOWER("email") LIKE LOWER($1)
    `;

    const { rows } = await pool.query(query, [`%${criteria}%`]);

    person = rows[0];

    await registerLog('PERSONS_SEARCH', person.documentNumber, {
      criteria,
      resultsCount: rows.length
    });

    res.json({
      message: 'Search completed successfully',
      data: rows,
      count: rows.length,
      criteria
    });

  } catch (error) {
    await registerLog('PERSON_SEARCH_NOT_FOUND', null);
    console.error('Error in search:', error);
    res.status(500).json({ error: 'Error in search' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Query Microservice running on port ${PORT}`);
});