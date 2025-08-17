#!/bin/bash

# Royal Media Development Setup Script

echo "🚀 Starting Royal Media Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

echo "📦 Installing frontend dependencies..."
cd apps/web && npm install && cd ../..

echo "📦 Installing auth service dependencies..."
cd apps/auth && npm install && cd ../..

echo "🐳 Starting services with Docker Compose..."
docker-compose up -d mongo redis

echo "⏳ Waiting for databases to be ready..."
sleep 10

echo "🔧 Starting auth service..."
cd apps/auth && npm run dev &
AUTH_PID=$!

echo "🌐 Starting frontend..."
cd apps/web && npm run dev &
WEB_PID=$!

echo "✅ Development environment is ready!"
echo ""
echo "📋 Services:"
echo "   🌐 Frontend:     http://localhost:3000"
echo "   🔐 Auth Service: http://localhost:3001"
echo "   🗄️  MongoDB:     mongodb://admin:password123@localhost:27017/royal_media"
echo "   🔴 Redis:        redis://localhost:6379"
echo ""
echo "⚠️  To stop all services, run: ./scripts/stop-dev.sh"

# Create stop script
cat > scripts/stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Royal Media development environment..."

# Kill background processes
if [ ! -z "$AUTH_PID" ]; then
    kill $AUTH_PID 2>/dev/null
fi

if [ ! -z "$WEB_PID" ]; then
    kill $WEB_PID 2>/dev/null
fi

# Stop Docker services
docker-compose down

echo "✅ Development environment stopped."
EOF

chmod +x scripts/stop-dev.sh

# Wait for user interrupt
trap 'echo ""; echo "🛑 Shutting down..."; kill $AUTH_PID $WEB_PID 2>/dev/null; docker-compose down; exit 0' INT

wait