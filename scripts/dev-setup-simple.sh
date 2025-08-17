#!/bin/bash

# Royal Media Development Setup Script (No Docker Version)

echo "🚀 Starting Royal Media Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the royal-media root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking required ports..."
check_port 3000 && check_port 3001 || {
    echo "❌ Required ports are in use. Please stop other services first."
    exit 1
}

echo "📦 Installing dependencies..."

# Install root dependencies
echo "   Installing root dependencies..."
npm install

# Install frontend dependencies
echo "   Installing frontend dependencies..."
cd apps/web
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi
npm install
cd ../..

# Install auth service dependencies
echo "   Installing auth service dependencies..."
cd apps/auth
if [ ! -f "package.json" ]; then
    echo "❌ Auth service package.json not found!"
    exit 1
fi
npm install
cd ../..

# Check if MongoDB and Redis are available locally
echo "🔍 Checking database services..."

# Check MongoDB
if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
    echo "✅ MongoDB client found"
    MONGODB_URI="mongodb://localhost:27017/royal_media"
else
    echo "⚠️  MongoDB not found locally. You'll need to install it or use Docker."
    echo "   Run: brew install mongodb-community"
    MONGODB_URI="mongodb://localhost:27017/royal_media"
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis found"
    REDIS_URL="redis://localhost:6379"
else
    echo "⚠️  Redis not found locally. You'll need to install it or use Docker."
    echo "   Run: brew install redis"
    REDIS_URL="redis://localhost:6379"
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
echo "   Auth service PID: $AUTH_PID"
cd ../..

# Wait a moment for auth service to start
sleep 3

# Start frontend in background
echo "   Starting frontend..."
cd apps/web
npm run dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
echo "   Frontend PID: $WEB_PID"
cd ../..

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

echo "✅ Development environment is ready!"
echo ""
echo "📋 Services:"
echo "   🌐 Frontend:     http://localhost:3000"
echo "   🔐 Auth Service: http://localhost:3001"
echo "   📝 Logs:         tail -f logs/auth.log logs/web.log"
echo ""
echo "💡 Database Setup (if needed):"
echo "   📦 Install MongoDB: brew install mongodb-community"
echo "   📦 Install Redis:   brew install redis"
echo "   🚀 Start MongoDB:   brew services start mongodb-community"
echo "   🚀 Start Redis:     brew services start redis"
echo ""
echo "⚠️  To stop all services, press Ctrl+C or run: kill $AUTH_PID $WEB_PID"

# Create stop script
cat > scripts/stop-dev.sh << EOF
#!/bin/bash
echo "🛑 Stopping Royal Media development environment..."

# Kill processes
if kill $AUTH_PID 2>/dev/null; then
    echo "✅ Auth service stopped"
else
    echo "⚠️  Auth service not running or already stopped"
fi

if kill $WEB_PID 2>/dev/null; then
    echo "✅ Frontend stopped"
else
    echo "⚠️  Frontend not running or already stopped"
fi

# Kill any remaining node processes on our ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "✅ Development environment stopped."
EOF

chmod +x scripts/stop-dev.sh

# Store PIDs for the stop script
echo "$AUTH_PID" > .auth_pid
echo "$WEB_PID" > .web_pid

# Handle Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $AUTH_PID $WEB_PID 2>/dev/null
    rm -f .auth_pid .web_pid
    exit 0
}

trap cleanup INT

# Show real-time logs
echo "📝 Showing logs (Ctrl+C to stop):"
echo "-----------------------------------"

# Wait and show status
sleep 2
if kill -0 $AUTH_PID 2>/dev/null && kill -0 $WEB_PID 2>/dev/null; then
    echo "🎉 Both services are running successfully!"
    echo "   Visit http://localhost:3000 to see your application"
    echo ""
    
    # Follow logs
    tail -f logs/auth.log logs/web.log &
    wait
else
    echo "❌ Some services failed to start. Check the logs:"
    echo "   Auth service log: cat logs/auth.log"
    echo "   Frontend log: cat logs/web.log"
fi