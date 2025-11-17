const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const axios = require('axios');

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

// Mock data - temporal
let mockPersons = [
  {
    id: '1',
    firstName: 'Juan',
    secondName: 'Carlos', 
    lastNames: 'Perez Gomez',
    birthDate: '1990-05-15',
    gender: 'Male',
    email: 'juan@example.com',
    phone: '3001234567',
    documentNumber: '123456789',
    documentType: 'Citizen ID'
  },
  {
    id: '2',
    firstName: 'Maria',
    lastNames: 'Garcia Lopez',
    birthDate: '1995-08-20', 
    gender: 'Female',
    email: 'maria@example.com',
    phone: '3109876543',
    documentNumber: '987654321',
    documentType: 'Citizen ID'
  }
];

// Delete person by document number
app.delete('/persons/:documentNumber', async (req, res) => {
  try {
    const { documentNumber } = req.params;
    console.log('Deleting person with document:', documentNumber);

    // Find person index
    const personIndex = mockPersons.findIndex(p => p.documentNumber === documentNumber);
    
    if (personIndex === -1) {
      return res.status(404).json({ 
        error: 'Person not found',
        documentNumber: documentNumber
      });
    }

    // Store deleted person for response
    const deletedPerson = mockPersons[personIndex];
    
    // Remove person from array
    mockPersons.splice(personIndex, 1);

    // Register in log
    await registerLog('PERSON_DELETED', documentNumber, {
        deletedPerson: deletedPerson
  });

    res.json({
      message: 'Person deleted successfully',
      data: deletedPerson
    });

  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all persons (for testing)
app.get('/persons', (req, res) => {
  res.json({
    message: 'Persons retrieved successfully',
    data: mockPersons,
    count: mockPersons.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Delete Microservice running on port ${PORT}`);
});