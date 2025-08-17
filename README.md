# Royal Media 👑

A modern, scalable social media platform built with microservices architecture, featuring real-time interactions, comprehensive user management, and advanced social features.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - Secure JWT-based auth with refresh tokens
- **User Profiles** - Comprehensive user management with avatars and bio
- **Posts & Media** - Rich text posts with image/video support
- **Social Interactions** - Likes, comments, shares, and bookmarks
- **Real-time Feed** - Personalized timeline with trending content
- **Search & Discovery** - Advanced search for users and content
- **Notifications** - Real-time notifications for all interactions

### Technical Features
- **Microservices Architecture** - Scalable, maintainable service-oriented design
- **Real-time Updates** - WebSocket integration for live interactions
- **Caching Layer** - Redis for performance optimization
- **File Upload** - Secure media handling with cloud storage
- **API Documentation** - Comprehensive OpenAPI/Swagger docs
- **Health Monitoring** - Service health checks and monitoring
- **Docker Support** - Containerized deployment ready

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Auth Service  │    │  Posts Service  │
│   (Next.js)     │◄──►│   (Port 3001)   │    │   (Port 3002)   │
│   Port 3000     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Databases     │
                    │                 │
                    │ MongoDB + Redis │
                    └─────────────────┘
```

### Services Overview

- **Frontend (Next.js)** - Modern React-based web application
- **Auth Service** - User authentication, authorization, and profile management
- **Posts Service** - Content creation, social interactions, and feed generation
- **MongoDB** - Primary database for user data and posts
- **Redis** - Caching and session management

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **Axios** - HTTP client with interceptors

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe server development
- **MongoDB** - Document database
- **Mongoose** - MongoDB ODM
- **Redis** - In-memory data store
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

### DevOps & Tools
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Swagger** - API documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose (optional but recommended)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/royal-media/royal-media.git
cd royal-media
```

### 2. Start Development Environment
```bash
# Make the development script executable
chmod +x dev.sh

# Start all services (includes database setup)
./dev.sh start

# Or use npm scripts
npm run dev
```

This will:
- Start MongoDB and Redis containers
- Install all dependencies
- Build the services
- Seed the database with sample data
- Start all services in development mode

### 3. Access the Application
- **Web Application**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Posts Service**: http://localhost:3002

## 📋 Available Scripts

### Development Scripts
```bash
# Start all services
npm run dev
./dev.sh start

# Stop all services
npm run stop
./dev.sh stop

# Restart services
npm run restart
./dev.sh restart

# View service logs
npm run logs
./dev.sh logs

# Check service status
npm run status
./dev.sh status

# Clean up (stop services and remove containers)
npm run clean
./dev.sh clean
```

### Build & Test Scripts
```bash
# Install all dependencies
npm run install:all

# Build all services
npm run build:all

# Run tests
npm test

# Run linting
npm run lint
```

### Docker Scripts
```bash
# Start databases only (for development)
docker-compose -f docker-compose.dev.yml up -d

# Full production deployment
docker-compose up -d

# Build and start
docker-compose up --build
```

## 📁 Project Structure

```
royal-media/
├── apps/
│   ├── auth/                 # Authentication service
│   │   ├── src/
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── models/       # Database models
│   │   │   ├── routes/       # API routes
│   │   │   └── utils/        # Utility functions
│   │   └── package.json
│   ├── posts/                # Posts and social features service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   └── package.json
│   └── web/                  # Next.js frontend application
│       ├── src/
│       │   ├── app/          # App router pages
│       │   ├── components/   # Reusable components
│       │   ├── lib/          # Utilities and API client
│       │   └── types/        # TypeScript type definitions
│       ├── public/           # Static assets
│       └── package.json
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Production deployment
├── docker-compose.dev.yml    # Development databases
├── dev.sh                    # Development script
└── package.json              # Root package.json
```

## 🔧 Configuration

### Environment Variables

Each service requires specific environment variables. Example configurations:

#### Auth Service (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://admin:password@localhost:27017/royal_media?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

#### Posts Service (.env)
```env
NODE_ENV=development
PORT=3002
MONGODB_URI=mongodb://admin:password@localhost:27017/royal_media?authSource=admin
REDIS_URL=redis://localhost:6379
AUTH_SERVICE_URL=http://localhost:3001
```

#### Web App (.env.local)
```env
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_POSTS_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests for specific service
cd services/auth && npm test
cd services/posts && npm test
cd apps/web && npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 📚 API Documentation

### Auth Service Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Posts Service Endpoints
- `GET /api/posts/feed` - Get personalized feed
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/bookmark` - Bookmark/unbookmark post
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment

Full API documentation is available at:
- Auth Service: http://localhost:3001/api-docs
- Posts Service: http://localhost:3002/api-docs

## 🚀 Deployment

### Development Deployment
```bash
# Start development environment
./dev.sh start
```

### Production Deployment
```bash
# Build and deploy with Docker Compose
docker-compose up -d --build

# Or deploy individual services
docker-compose up -d mongodb redis
docker-compose up -d auth-service posts-service
docker-compose up -d web-app nginx
```

### Environment Setup
1. Copy environment files: `cp .env.example .env`
2. Update configuration values for your environment
3. Ensure all required services are accessible
4. Run database migrations if needed

## 🔍 Monitoring & Debugging

### Health Checks
- Auth Service: http://localhost:3001/health
- Posts Service: http://localhost:3002/health

### Logs
```bash
# View all service logs
./dev.sh logs

# View specific service logs
docker logs royal-media-auth
docker logs royal-media-posts
docker logs royal-media-web
```

### Debugging
- Enable debug mode: `DEBUG=royal-media:* npm run dev`
- Use VS Code debugger configurations in `.vscode/launch.json`
- Monitor database queries with MongoDB Compass

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Update documentation for new features
- Ensure all services pass health checks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/royal-media/royal-media/issues)
- **Discussions**: [GitHub Discussions](https://github.com/royal-media/royal-media/discussions)
- **Documentation**: [Wiki](https://github.com/royal-media/royal-media/wiki)

## 🎯 Roadmap

- [ ] Real-time messaging system
- [ ] Video calling integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered content recommendations
- [ ] Advanced moderation tools
- [ ] Multi-language support
- [ ] Progressive Web App features

---

Built with ❤️ by the Royal Media Team