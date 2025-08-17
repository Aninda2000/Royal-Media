# Royal Media Auth Service - Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running on localhost:27017
- Redis running on localhost:6379

### 1. Install Dependencies
```bash
cd /tmp/royal-media-auth
npm install
```

### 2. Setup Environment
Create `.env` file:
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/royal-media-auth
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
```

### 3. Initialize Database
```bash
npm run setup
```

### 4. Start Backend Server
```bash
npm run dev
```

### 5. Start Frontend Testing Interface
```bash
npm run frontend
```

## 🧪 Testing the Application

### Option 1: Web Interface
1. Open http://localhost:3000 in your browser
2. Use the default admin credentials:
   - Email: `admin@royal-media.com`
   - Password: `AdminPassword123!`
3. Test various API endpoints using the interactive interface

### Option 2: Manual API Testing

#### Login (Get Access Token)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@royal-media.com",
    "password": "AdminPassword123!"
  }'
```

#### Register New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "handle": "testuser123"
  }'
```

#### Get Profile (Protected Route)
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Admin Stats (Admin Only)
```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

#### Health Check
```bash
curl -X GET http://localhost:3001/health
```

## 📋 Available API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile image
- `POST /api/users/upload-cover` - Upload cover image

### Admin (Admin/Super Admin Only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Get system statistics
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/role` - Change user role
- `PUT /api/admin/users/:id/status` - Activate/deactivate user

### System
- `GET /health` - Health check
- `GET /api-docs` - API documentation (Swagger)

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret

### Default Admin User
- Email: `admin@royal-media.com`
- Password: `AdminPassword123!`
- Role: `super_admin`

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Start frontend testing interface
npm run frontend

# Start both backend and frontend
npm run dev:full

# Initialize database with admin user
npm run setup

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

## 🔍 Testing Scenarios

### 1. User Registration and Login
1. Register a new user via `/api/auth/register`
2. Login with the new user via `/api/auth/login`
3. Access protected routes with the token

### 2. Profile Management
1. Login as user
2. Get profile via `/api/users/profile`
3. Update profile via `PUT /api/users/profile`

### 3. Admin Operations
1. Login as admin
2. View all users via `/api/admin/users`
3. Get system stats via `/api/admin/stats`
4. Manage user roles and status

### 4. Security Testing
1. Try accessing protected routes without token
2. Try accessing admin routes as regular user
3. Test rate limiting by making multiple requests

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running: `mongod`
   - Check connection string in `.env`

2. **Redis Connection Error**
   - Ensure Redis is running: `redis-server`
   - Check Redis URL in `.env`

3. **JWT Errors**
   - Ensure JWT secrets are at least 32 characters
   - Check for valid tokens in Authorization header

4. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:3001 | xargs kill`

### Logs
Check server logs for detailed error information:
```bash
tail -f logs/app.log
```

## 🎯 Success Indicators

✅ Server starts without errors  
✅ Database connection established  
✅ Redis connection established  
✅ Admin user created successfully  
✅ Login returns valid JWT token  
✅ Protected routes work with token  
✅ Admin routes accessible with admin token  
✅ Frontend interface loads and functions  

## 📝 Notes

- The service includes comprehensive rate limiting
- All passwords are hashed with bcrypt
- JWT tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- All API responses follow consistent format
- CORS is enabled for frontend integration

---

**© Design and Developed by Aninda Sundar Roy**