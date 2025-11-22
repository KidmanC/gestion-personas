const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { pool } = require('./db.js');
const upload = require("./photos/upload");
const multer = require("multer");

const axios = require('axios');

// Function to register logs
const registerLog = async (action, documentNumber, details = {}) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      action: action,
      documentNumber: documentNumber,
      service: 'update-service',
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
const PORT = 3003;

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Update Microservice working!',
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Validations for updating persons (same as creation)
const updatePersonValidations = [
  body('firstName')
    .optional()
    .isLength({ max: 30 }).withMessage('First name cannot be longer than 30 characters')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('First name can only contain letters'),

  body('secondName')
    .optional()
    .isLength({ max: 30 }).withMessage('Second name cannot be longer than 30 characters')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('Second name can only contain letters'),

  body('lastNames')
    .optional()
    .isLength({ max: 60 }).withMessage('Last names cannot be longer than 60 characters')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('Last names can only contain letters'),

  body('birthDate')
    .optional()
    .isDate().withMessage('Birth date must have a valid format'),

  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Non-binary', 'Prefer not to say'])
    .withMessage('Gender must be: Male, Female, Non-binary or Prefer not to say'),

  body('email')
    .optional()
    .isEmail().withMessage('Must provide a valid email'),

  body('phone')
    .optional()
    .isNumeric().withMessage('Phone must contain only numbers')
    .isLength({ min: 10, max: 10 }).withMessage('Phone must have exactly 10 digits'),

  body('documentType')
    .optional()
    .isIn(['ID Card', 'Citizen ID'])
    .withMessage('Document type must be: ID Card or Citizen ID')
];

// Update person by document number
app.put('/persons/:documentNumber', upload.single("photoUrl"), updatePersonValidations, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { documentNumber } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.photoUrl = req.file.path;
    }

    const fields = Object.keys(updateData);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');

    const values = Object.values(updateData);

    values.push(documentNumber);

    const query = `
      UPDATE persons
      SET ${setClause}
      WHERE "documentNumber" = $${values.length}
      RETURNING *;
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Person not found',
        documentNumber: documentNumber
      });
    }

    await registerLog('PERSON_UPDATED', documentNumber, {
      updatedFields: fields,
      newData: updateData
    });

    res.json({
      message: 'Person updated successfully',
      data: rows[0]
    });

  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Error updating person' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Photo cannot exceed 2MB"
      });
    }

    return res.status(400).json({ error: err.message });
  }

  next(err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Update Microservice running on port ${PORT}`);
});