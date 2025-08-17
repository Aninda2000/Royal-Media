# 🚀 Royal Media Auth Service - Quick Start Guide

This guide will get you up and running with the Royal Media Auth Service in less than 5 minutes.

## Prerequisites

Before starting, make sure you have:

- **Node.js 18+** installed
- **MongoDB** running locally (or connection string)
- **Redis** running locally (optional, will work without for basic features)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database & Initial Data

```bash
npm run setup
```

This will:
- Connect to MongoDB
- Create an admin user
- Create sample users for testing
- Display login credentials

### 3. Start the Service

```bash
npm run dev
```

The service will start on `http://localhost:3001`

## Test the Service

After starting, you can test the service in several ways:

### Option 1: Automated Test Script

```bash
npm run test:service
```

This runs automated tests against the running service.

### Option 2: Manual Testing with curl

```bash
# Health check
curl http://localhost:3001/health

# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "termsAccepted": true
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Option 3: Use the Pre-created Admin Account

The setup script creates an admin account:

- **Email**: admin@royal-media.com
- **Password**: AdminPassword123!

You can use this to test admin endpoints.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/search` - Search users

### Admin (Requires Admin Role)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:userId/role` - Update user role
- `PATCH /api/admin/users/:userId/activate` - Activate user
- `GET /api/admin/stats` - Get platform statistics

## Environment Configuration

The service uses the following key environment variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/royal-media-auth
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Admin
ADMIN_EMAIL=admin@royal-media.com
ADMIN_PASSWORD=AdminPassword123!
```

## Security Features

✅ **Rate Limiting** - Multiple layers of protection  
✅ **Input Validation** - Comprehensive validation rules  
✅ **Password Security** - bcrypt hashing with salt rounds  
✅ **JWT Authentication** - Secure token-based auth  
✅ **CORS Protection** - Configurable origins  
✅ **Security Headers** - Helmet.js integration  
✅ **Request Sanitization** - XSS and injection prevention  

## Troubleshooting

### MongoDB Connection Issues

1. Make sure MongoDB is running:
   ```bash
   mongod
   ```

2. Check the connection string in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/royal-media-auth
   ```

### Redis Connection Issues

Redis is optional. If you don't have Redis running:

1. Comment out Redis-related code in `/src/config/database.ts`
2. Or install and start Redis:
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu
   sudo apt install redis-server
   sudo systemctl start redis-server
   ```

### Port Already in Use

If port 3001 is already in use:

1. Change the port in `.env`:
   ```env
   PORT=3002
   ```

2. Or stop the service using port 3001:
   ```bash
   lsof -ti:3001 | xargs kill
   ```

## Development Scripts

```bash
npm run dev          # Start development server
npm run setup        # Setup database and initial data
npm run test         # Run unit tests
npm run test:service # Test running service
npm run build        # Build for production
npm run start        # Start production server
```

## Next Steps

1. **Frontend Integration**: Use the tokens returned by `/api/auth/login` in your frontend
2. **Email Setup**: Configure SMTP settings for email verification
3. **Google OAuth**: Set up Google OAuth credentials
4. **Production**: Configure environment variables for production deployment

## Support

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Verify all prerequisites are installed and running
3. Check the environment configuration
4. Run the automated tests to identify specific issues

---

**© Design and Developed by Aninda Sundar Roy**

🎉 **Congratulations!** Your Royal Media Auth Service is now ready for development and testing.