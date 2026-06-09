const express = require('express');
const taskRoutes = require('./taskRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

/**
 * Main Router
 * Combines all route modules
 */

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', require('./projectRoutes'));
router.use('/upload', require('./uploadRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/calendar', require('./calendarRoutes'));
router.use('/contact', require('./contactRoutes'));
router.use('/workspaces', require('./workspaceRoutes'));

// Add more routes here as needed

module.exports = router;
