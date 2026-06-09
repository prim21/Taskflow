require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration (uncomment and configure when needed)
  // database: {
  //   host: process.env.DB_HOST || 'localhost',
  //   port: process.env.DB_PORT || 5432,
  //   name: process.env.DB_NAME || 'task_management',
  //   user: process.env.DB_USER,
  //   password: process.env.DB_PASSWORD,
  // },

  // JWT configuration (uncomment when implementing authentication)
  // jwt: {
  //   secret: process.env.JWT_SECRET,
  //   expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  // },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'TaskFlow <no-reply@taskflow.com>',
  },

  // CORS configuration
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, Postman, or mobile apps)
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.trim().replace(/\/$/, '');
      const allowed = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))
        : ['*'];
        
      const isAllowed = allowed.includes('*') || 
                        allowed.includes(cleanOrigin) || 
                        /\.vercel\.app$/.test(cleanOrigin); // Allow any Vercel deployment/preview URL
        
      if (isAllowed) {
        callback(null, origin); // Reflect the origin back to support credentials
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
};
