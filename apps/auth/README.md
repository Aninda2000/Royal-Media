# 🚀 Royal Media Auth Service

A comprehensive authentication service for the Royal Media platform with enterprise-grade security features and local testing capabilities.

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** with access and refresh tokens
- **Role-based Access Control** (RBAC) with multiple user roles
- **Password Hashing** with bcrypt
- **Rate Limiting** with Redis backend
- **Input Validation** and sanitization
- **CORS Protection** and security headers
- **Session Management** with token blacklisting

### 👥 User Management
- User registration and login
- Profile management with image uploads
- Email verification system
- Password reset functionality
- Google OAuth integration ready
- User privacy settings

### 🛡️ Admin Features
- **User Management** - View, edit, activate/deactivate users
- **Role Management** - Assign and modify user roles
- **System Statistics** - Monitor user activity and system health
- **Audit Logging** - Track administrative actions

### 🧪 Local Testing
- **Interactive Web Interface** for API testing
- **Comprehensive API Documentation** with Swagger
- **Sample Data** and automated setup
- **Development Scripts** for easy local testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- Redis 6.0+

### 1. Clone and Install
```bash
cd /tmp/royal-media-auth
npm install
```

### 2. Environment Setup
Create `.env` file:
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/royal-media-auth
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
```

### 3. Start Development Environment
```bash
# Easy one-command startup
./start-dev.sh

# OR manually:
npm run setup    # Initialize database
npm run dev      # Start backend (http://localhost:3001)
npm run frontend # Start frontend (http://localhost:3000)
```

### 4. Test the Service
- **Web Interface**: http://localhost:3000
- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🧪 Testing Guide

### Default Admin Credentials
```
Email: admin@royal-media.com
Password: AdminPassword123!
Role: super_admin
```

### API Testing Options

#### 1. Web Interface (Recommended)
Navigate to http://localhost:3000 for an interactive testing environment with:
- One-click authentication
- Pre-filled API requests
- Real-time response viewing
- Token management
- Quick action buttons

#### 2. cURL Examples
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@royal-media.com","password":"AdminPassword123!"}'

# Register User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","handle":"testuser"}'

# Get Profile (with token)
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Postman Collection
Import the API documentation from http://localhost:3001/api-docs

## 📚 API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/profile` | Get current user | Yes |
| POST | `/api/auth/refresh` | Refresh token | Yes |

### User Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |
| POST | `/api/users/upload-avatar` | Upload avatar | Yes |
| POST | `/api/users/upload-cover` | Upload cover | Yes |

### Admin Endpoints
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | List all users | Admin |
| GET | `/api/admin/stats` | System statistics | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Super Admin |
| PUT | `/api/admin/users/:id/role` | Change role | Super Admin |

### System Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api-docs` | API documentation | No |

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache/Session**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, cors, express-rate-limit
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI

### Security Features
- **Multi-layer Rate Limiting** (IP-based and user-based)
- **Input Sanitization** and validation
- **SQL Injection Protection** via MongoDB/Mongoose
- **XSS Protection** via security headers
- **JWT Token Security** with short expiration
- **Password Security** with bcrypt hashing
- **CORS Configuration** for API access

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── scripts/        # Utility scripts
├── types/          # TypeScript definitions
└── utils/          # Helper functions

public/             # Frontend testing interface
scripts/            # Development scripts
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development        # Environment
PORT=3001                  # Server port
MONGODB_URI=mongodb://...  # MongoDB connection
REDIS_URL=redis://...      # Redis connection
JWT_SECRET=...             # JWT signing key
JWT_REFRESH_SECRET=...     # Refresh token key
JWT_EXPIRES_IN=15m         # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d  # Refresh token expiry
```

### User Roles
- `user` - Regular user (default)
- `moderator` - Content moderation permissions
- `admin` - User management permissions
- `super_admin` - Full system access

## 🛠️ Development

### Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run setup       # Initialize database
npm run frontend    # Start testing interface
npm run dev:full    # Start both backend and frontend
npm run typecheck   # TypeScript validation
```

### Development Workflow
1. Start MongoDB and Redis services
2. Run `npm run setup` to initialize database
3. Run `./start-dev.sh` for full development environment
4. Open http://localhost:3000 for testing interface
5. Make changes and test in real-time

## 🚨 Troubleshooting

### Common Issues

**Connection Errors**
- Ensure MongoDB is running on port 27017
- Ensure Redis is running on port 6379
- Check network connectivity and firewall settings

**Authentication Issues**
- Verify JWT secrets are at least 32 characters
- Check token format: `Bearer <token>`
- Ensure tokens haven't expired

**Permission Errors**
- Verify user roles in database
- Check middleware authentication order
- Confirm admin privileges for admin endpoints

### Debug Mode
Set `NODE_ENV=development` for detailed error logging and stack traces.

## 📈 Performance

### Optimizations
- **Connection Pooling** for MongoDB
- **Redis Caching** for sessions and rate limiting
- **JWT Statelessness** for horizontal scaling
- **Efficient Queries** with proper indexing
- **Response Compression** with gzip

### Monitoring
- Health check endpoint for service monitoring
- Comprehensive logging for debugging
- Rate limit monitoring and alerting
- Database performance metrics

## 🔄 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB and Redis
3. Set strong JWT secrets (32+ characters)
4. Enable HTTPS with proper certificates
5. Configure proper CORS origins
6. Set up monitoring and logging

### Docker Support
```dockerfile
# Example Dockerfile configuration
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**© Design and Developed by Aninda Sundar Roy**

---

## 🎯 Testing Checklist

- [ ] Server starts without errors
- [ ] Database connection established
- [ ] Redis connection established
- [ ] Admin user created
- [ ] Login functionality works
- [ ] JWT tokens generated correctly
- [ ] Protected routes require authentication
- [ ] Admin routes require admin role
- [ ] Rate limiting functions properly
- [ ] Frontend interface loads
- [ ] API documentation accessible
- [ ] Health check responds correctly

## 🚀 Ready to Test!

Your Royal Media Auth Service is now ready for comprehensive testing. Use the web interface at http://localhost:3000 or follow the API examples in the TESTING_GUIDE.md for detailed testing scenarios.

For questions or support, please refer to the troubleshooting section or check the API documentation.