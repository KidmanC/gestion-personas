const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Docker = require('dockerode');

const app = express();
const PORT = 3006;
const docker = new Docker();

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Orchestration Service working!',
    status: 'OK'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Enable query service
app.post('/orchestration/query/enable', async (req, res) => {
  try {
    console.log('Enabling query service...');
    
    // Start the query service container
    const container = docker.getContainer('ms-consulta');
    await container.start();
    
    console.log('Query service enabled successfully');
    res.json({ 
      message: 'Query service enabled successfully',
      service: 'query-service',
      status: 'enabled'
    });
  } catch (error) {
    console.error('Error enabling query service:', error);
    res.status(500).json({ 
      error: 'Failed to enable query service',
      details: error.message
    });
  }
});

// Disable query service
app.post('/orchestration/query/disable', async (req, res) => {
  try {
    console.log('Disabling query service...');
    
    // Stop the query service container
    const container = docker.getContainer('ms-consulta');
    await container.stop();
    
    console.log('Query service disabled successfully');
    res.json({ 
      message: 'Query service disabled successfully',
      service: 'query-service',
      status: 'disabled'
    });
  } catch (error) {
    console.error('Error disabling query service:', error);
    res.status(500).json({ 
      error: 'Failed to disable query service',
      details: error.message
    });
  }
});

// Get service status
app.get('/orchestration/status', async (req, res) => {
  try {
    const container = docker.getContainer('ms-consulta');
    const info = await container.inspect();
    
    res.json({
      service: 'query-service',
      status: info.State.Running ? 'enabled' : 'disabled',
      running: info.State.Running,
      startedAt: info.State.StartedAt
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({ 
      error: 'Failed to get service status',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Orchestration Service running on port ${PORT}`);
});