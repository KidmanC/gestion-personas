const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const {pool} = require('./db.js')

// Function to register logs
const registerLog = async (action, documentNumber, details = {}) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      action: action,
      documentNumber: documentNumber,
      service: 'delete-service',
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
const PORT = 3004;

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Delete Microservice working!',
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Delete person by document number
app.delete('/persons/:documentNumber', async (req, res) => {
  try {
    const { documentNumber } = req.params;
    console.log('Deleting person with document:', documentNumber);
    
    const { rows } = await pool.query(
    `SELECT * FROM persons WHERE "documentNumber" = $1`,
      [documentNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Person not found",
        documentNumber
      });
    }

    const personFound = rows[0];

    await pool.query(
      `DELETE FROM persons WHERE "documentNumber" = $1`,
      [documentNumber]
    );

    await registerLog("PERSON_DELETED", documentNumber, {
      deletedPerson: `${personFound.firstName} ${personFound.lastNames}`,
      documentNumber: personFound.documentNumber
    });

    res.json({
      message: "Person deleted successfully",
      data: personFound
    });

  } catch (error) {
    console.error("Error deleting person:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Delete Microservice running on port ${PORT}`);
});