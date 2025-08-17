#!/bin/bash

# Royal Media Development Setup Script (Fixed Version)

echo "🚀 Starting Royal Media Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the royal-media root directory"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# Function to check if MongoDB is accessible
check_mongodb() {
    if mongosh --eval "db.adminCommand('ismaster')" --quiet >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Function to check if Redis is accessible
check_redis() {
    if redis-cli ping >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

echo "🔍 Checking required ports..."
if ! check_port 3000 || ! check_port 3001; then
    echo "❌ Required ports are in use. Please stop other services first."
    echo "   To kill processes on these ports:"
    echo "   lsof -ti:3000 | xargs kill -9"
    echo "   lsof -ti:3001 | xargs kill -9"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install frontend dependencies
echo "   Installing frontend dependencies..."
cd apps/web
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi
npm install --silent
cd ../..

# Install auth service dependencies
echo "   Installing auth service dependencies..."
cd apps/auth
if [ ! -f "package.json" ]; then
    echo "❌ Auth service package.json not found!"
    exit 1
fi
npm install --silent
cd ../..

echo "🔍 Checking database services..."

# Check MongoDB
if check_mongodb; then
    echo "✅ MongoDB is running and accessible"
    MONGODB_URI="mongodb://localhost:27017/royal_media"
else
    echo "❌ MongoDB is not accessible. Please start it:"
    echo "   brew services start mongodb-community"
    exit 1
fi

# Check Redis
if check_redis; then
    echo "✅ Redis is running and accessible"
    REDIS_URL="redis://localhost:6379"
else
    echo "❌ Redis is not accessible. Please start it:"
    echo "   brew services start redis"
    exit 1
fi

# Create environment file for auth service
echo "🔧 Creating environment configuration..."
cat > apps/auth/.env << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=${MONGODB_URI}
REDIS_URL=${REDIS_URL}
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
EOF

# Create environment file for frontend
cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "🚀 Starting services..."

# Start auth service in background
echo "   Starting auth service..."
cd apps/auth
npm run dev > ../../logs/auth.log 2>&1 &
AUTH_PID=$!
cd ../..

# Wait for auth service to start
echo "   Waiting for auth service to initialize..."
for i in {1..15}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Auth service is ready"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Auth service failed to start. Check logs: cat logs/auth.log"
        kill $AUTH_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start frontend in background
echo "   Starting frontend..."
cd apps/web
npm run dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
cd ../..

# Wait for frontend to start
echo "   Waiting for frontend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Frontend taking longer than expected. Check logs: cat logs/web.log"
        break
    fi
    sleep 1
done

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Services:"
echo "   🌐 Frontend:     http://localhost:3000"
echo "   🔐 Auth Service: http://localhost:3001"
echo "   📊 API Status:   http://localhost:3001/api"
echo "   ❤️  Health Check: http://localhost:3001/health"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/auth.log    # Auth service logs"
echo "   tail -f logs/web.log     # Frontend logs"
echo ""
echo "🧪 Quick Test:"
echo "   curl http://localhost:3001/api    # Test auth service"
echo "   open http://localhost:3000        # Open frontend"
echo ""

# Create stop script
cat > scripts/stop-dev.sh << EOF
#!/bin/bash
echo "🛑 Stopping Royal Media development environment..."

# Kill processes
if kill $AUTH_PID 2>/dev/null; then
    echo "✅ Auth service stopped (PID: $AUTH_PID)"
else
    echo "⚠️  Auth service not running or already stopped"
fi

if kill $WEB_PID 2>/dev/null; then
    echo "✅ Frontend stopped (PID: $WEB_PID)"
else
    echo "⚠️  Frontend not running or already stopped"
fi

# Kill any remaining processes on our ports
if lsof -ti:3000 >/dev/null 2>&1; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo "🧹 Cleaned up remaining processes on port 3000"
fi

if lsof -ti:3001 >/dev/null 2>&1; then
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo "🧹 Cleaned up remaining processes on port 3001"
fi

echo "✅ Development environment stopped."
EOF

chmod +x scripts/stop-dev.sh

# Store PIDs for reference
echo "$AUTH_PID" > .auth_pid
echo "$WEB_PID" > .web_pid

echo "⚠️  To stop all services:"
echo "   Press Ctrl+C or run: ./scripts/stop-dev.sh"
echo ""

# Handle Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $AUTH_PID $WEB_PID 2>/dev/null
    
    # Clean up any remaining processes
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    
    rm -f .auth_pid .web_pid
    echo "✅ Cleanup complete."
    exit 0
}

trap cleanup INT

# Keep script running and show status
echo "📊 Monitoring services... (Press Ctrl+C to stop)"
while true; do
    sleep 30
    
    # Check if services are still running
    if ! kill -0 $AUTH_PID 2>/dev/null; then
        echo "❌ Auth service stopped unexpectedly. Check logs: cat logs/auth.log"
        break
    fi
    
    if ! kill -0 $WEB_PID 2>/dev/null; then
        echo "❌ Frontend stopped unexpectedly. Check logs: cat logs/web.log"
        break
    fi
    
    echo "✅ Services running ($(date +%H:%M:%S))"
done

cleanup