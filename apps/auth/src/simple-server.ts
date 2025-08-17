import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Royal Media Auth Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'auth-service',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      health: '/health',
    },
  });
});

// Basic auth endpoints for testing
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;
  
  // Basic validation
  if (!firstName || !lastName || !email || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Mock successful registration
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: Date.now().toString(),
        firstName,
        lastName,
        email,
        username,
        handle: username,
        role: 'user',
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, username, password } = req.body;
  
  // Basic validation
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      code: 'VALIDATION_ERROR'
    });
  }

  if (!email && !username) {
    return res.status(400).json({
      success: false,
      message: 'Email or username is required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Mock successful login
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: Date.now().toString(),
        firstName: 'Test',
        lastName: 'User',
        email: email || 'user@example.com',
        username: username || 'testuser',
        handle: username || 'testuser',
        role: 'user',
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// Mock profile endpoint
app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required',
      code: 'UNAUTHORIZED'
    });
  }

  // Mock user profile
  res.status(200).json({
    success: true,
    data: {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      username: 'testuser',
      handle: 'testuser',
      role: 'user',
      isVerified: true,
      isActive: true,
      profileImage: null,
      coverImage: null,
      bio: null,
      location: null,
      website: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`✅ Auth service running on port ${PORT}`);
  console.log(`🌐 Access: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;