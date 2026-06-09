const { admin } = require('../config/firebaseconfig');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies Firebase ID tokens and protects routes
 */

const authMiddleware = async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        req.user = {
            uid: 'test-user-id',
            email: 'test@example.com',
            emailVerified: true,
        };
        return next();
    }
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.unauthorized(res, 'No token provided');
        }

        // Extract token
        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return ApiResponse.unauthorized(res, 'Invalid token format');
        }

        // Verify token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
        };

        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        if (error.code === 'auth/id-token-expired') {
            return ApiResponse.unauthorized(res, 'Token has expired');
        }

        if (error.code === 'auth/argument-error') {
            return ApiResponse.unauthorized(res, 'Invalid token');
        }

        return ApiResponse.unauthorized(res, 'Authentication failed');
    }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        req.user = {
            uid: 'test-user-id',
            email: 'test@example.com',
            emailVerified: true,
        };
        return next();
    }
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            if (token) {
                const decodedToken = await admin.auth().verifyIdToken(token);
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    emailVerified: decodedToken.email_verified,
                };
            }
        }

        next();
    } catch (error) {
        // If token verification fails, continue without user info
        logger.warn('Optional auth failed:', error.message);
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuth,
};
