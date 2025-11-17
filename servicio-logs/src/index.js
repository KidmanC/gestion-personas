const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

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

// In-memory storage for logs (temporal)
let logs = [];

// Add new log
app.post('/logs', (req, res) => {
  try {
    const { timestamp, action, documentNumber, service, details } = req.body;
    
    const newLog = {
      id: Date.now().toString(),
      timestamp: timestamp || new Date().toISOString(),
      action,
      documentNumber,
      service,
      details,
      receivedAt: new Date().toISOString()
    };

    logs.push(newLog);
    console.log('New log registered:', newLog);

    res.status(201).json({
      message: 'Log registered successfully',
      log: newLog
    });

  } catch (error) {
    console.error('Error registering log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all logs
app.get('/logs', (req, res) => {
  try {
    const { action, documentNumber, date } = req.query;
    
    let filteredLogs = [...logs];

    // Filter by action
    if (action) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(action.toLowerCase())
      );
    }

    // Filter by document number
    if (documentNumber) {
      filteredLogs = filteredLogs.filter(log => 
        log.documentNumber === documentNumber
      );
    }

    // Filter by date
    if (date) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp.startsWith(date)
      );
    }

    res.json({
      message: 'Logs retrieved successfully',
      data: filteredLogs,
      count: filteredLogs.length,
      filters: { action, documentNumber, date }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get log by ID
app.get('/logs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const log = logs.find(l => l.id === id);
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({
      message: 'Log found successfully',
      data: log
    });

  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all logs
app.delete('/logs', (req, res) => {
    try {
      const previousCount = logs.length;
      logs = [];
      console.log('All logs cleared');
      
      res.json({
        message: 'All logs cleared successfully',
        logsDeleted: previousCount
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Clear logs by filter
app.delete('/logs/filter', (req, res) => {
    try {
      const { action, documentNumber, service } = req.body;
      
      const initialCount = logs.length;
      
      if (action || documentNumber || service) {
        logs = logs.filter(log => 
          (action && log.action !== action) &&
          (documentNumber && log.documentNumber !== documentNumber) &&
          (service && log.service !== service)
        );
      } else {
        logs = [];
      }
      
      const deletedCount = initialCount - logs.length;
      
      res.json({
        message: 'Logs cleared by filter successfully',
        logsDeleted: deletedCount,
        filtersApplied: { action, documentNumber, service }
      });
    } catch (error) {
      console.error('Error clearing logs by filter:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Start server
app.listen(PORT, () => {
  console.log(`Logs Service running on port ${PORT}`);
});