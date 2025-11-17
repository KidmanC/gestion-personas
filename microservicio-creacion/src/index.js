const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 3001;

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Creation Microservice working!',
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});


const axios = require('axios');

// Function to register logs
const registerLog = async (action, documentNumber, details = {}) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      action: action,
      documentNumber: documentNumber,
      service: 'creation-microservice',
      details: details
    };

    // 1. Show in console
    console.log('LOG REGISTERED:', JSON.stringify(logData, null, 2));
    
    // 2. SEND to logging service (ACTIVAR ESTO)
    try {
      await axios.post('http://logs-service:3005/logs', logData);
      console.log('Log sent to logging service successfully');
    } catch (logError) {
      console.error('Failed to send log to logging service:', logError.message);
      // Continue even if logging fails
    }
    
  } catch (error) {
    console.error('Error registering log:', error);
  }
};

// Validations for creating persons
const createPersonValidations = [
  // First Name: not number and not longer than 30 characters
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 30 }).withMessage('First name cannot be longer than 30 characters')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('First name can only contain letters'),

  // Second Name: not number and not longer than 30 characters (optional)
  body('secondName')
    .optional()
    .isLength({ max: 30 }).withMessage('Second name cannot be longer than 30 characters')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('Second name can only contain letters'),

  // Last Names: not number and not longer than 60 characters
  body('lastNames')
    .notEmpty().withMessage('Last names are required')
    .isLength({ max: 60 }).withMessage('Last names cannot be longer than 60 characters')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('Last names can only contain letters'),

  // Birth Date: valid format
  body('birthDate')
    .notEmpty().withMessage('Birth date is required')
    .isDate().withMessage('Birth date must have a valid format'),

  // Gender: must be in the allowed values list
  body('gender')
    .isIn(['Male', 'Female', 'Non-binary', 'Prefer not to say'])
    .withMessage('Gender must be: Male, Female, Non-binary or Prefer not to say'),

  // Email: validate format
  body('email')
    .isEmail().withMessage('Must provide a valid email'),

  // Phone: number and exactly 10 characters
  body('phone')
    .isNumeric().withMessage('Phone must contain only numbers')
    .isLength({ min: 10, max: 10 }).withMessage('Phone must have exactly 10 digits'),

  // Document Number: number and not longer than 10 characters
  body('documentNumber')
    .isNumeric().withMessage('Document number must contain only numbers')
    .isLength({ max: 10 }).withMessage('Document number cannot be longer than 10 digits'),

  // Document Type: must be in the list
  body('documentType')
    .isIn(['ID Card', 'Citizen ID'])
    .withMessage('Document type must be: ID Card or Citizen ID')
];

// Endpoint to create persons WITH VALIDATIONS
app.post('/persons', createPersonValidations, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { 
      firstName,
      secondName, 
      lastNames,
      birthDate,
      gender,
      email,
      phone,
      documentNumber,
      documentType
    } = req.body;

    // Log received data (later will be in the log system)
    await registerLog('PERSON_CREATED', documentNumber, {
        firstName: firstName,
        lastNames: lastNames,
        email: email,
        documentType: documentType
    });

    // Temporary response (later we'll connect to database)
    res.status(201).json({
      message: 'Person created successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        documentNumber: documentNumber,
        fullName: `${firstName} ${secondName || ''} ${lastNames}`.trim(),
        email: email,
        phone: phone
      }
    });
} catch (error) {
    console.error('Error creating person:', error);
    // Register error in log
    await registerLog('PERSON_CREATION_ERROR', req.body.documentNumber, {
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Creation Microservice running on port ${PORT}`);
});