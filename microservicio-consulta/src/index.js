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

// Mock data - temporal (luego vendrá de base de datos)
const mockPersons = [
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
      secondName: '',
      lastNames: 'Garcia Lopez',
      birthDate: '1995-08-20',
      gender: 'Female',
      email: 'maria@example.com',
      phone: '3109876543',
      documentNumber: '987654321',
      documentType: 'Citizen ID'
    }
  ];
  
// Get all persons
app.get('/persons', async (req, res) => {
    try {
      console.log('Fetching all persons');
      
      // Log de consulta general
      await registerLog('PERSONS_LIST_REQUESTED', null, {
        personsCount: mockPersons.length
      });
  
      res.json({
        message: 'Persons retrieved successfully',
        data: mockPersons,
        count: mockPersons.length
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
  
      const person = mockPersons.find(p => p.documentNumber === documentNumber);
      
      if (!person) {
        // Log de búsqueda fallida
        await registerLog('PERSON_SEARCH_NOT_FOUND', documentNumber);
        return res.status(404).json({ 
          error: 'Person not found',
          documentNumber: documentNumber
        });
      }
  
      // Log de búsqueda exitosa
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
  
      const filteredPersons = mockPersons.filter(person =>
        person.firstName.toLowerCase().includes(criteria.toLowerCase()) ||
        person.lastNames.toLowerCase().includes(criteria.toLowerCase()) ||
        person.email.toLowerCase().includes(criteria.toLowerCase())
      );
  
      // Log de búsqueda
      await registerLog('PERSONS_SEARCH', null, {
        criteria: criteria,
        resultsCount: filteredPersons.length
      });
  
      res.json({
        message: 'Search completed successfully',
        data: filteredPersons,
        count: filteredPersons.length,
        criteria: criteria
      });
    } catch (error) {
      console.error('Error in search:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Start server
app.listen(PORT, () => {
  console.log(`Query Microservice running on port ${PORT}`);
});