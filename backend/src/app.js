const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const logger = require('./utils/logger');

/**
 * Express Application Setup
 */

const path = require('path');

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads locally
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Debug middleware to log request body
app.use((req, res, next) => {
    if (req.path.includes('/documents') && req.method === 'POST') {
        console.log('=== INCOMING REQUEST ===');
        console.log('Path:', req.path);
        console.log('Method:', req.method);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Body keys:', Object.keys(req.body));
    }
    next();
});


// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Task Management API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            tasks: '/api/tasks',
            documents: '/api/documents',
            calendar: '/api/calendar',
        },
    });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
    const PORT = config.port;
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`API available at: http://localhost:${PORT}/api`);
    });
}

module.exports = app;
