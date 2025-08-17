#!/bin/bash

# Royal Media Auth Service - Development Setup
echo "🚀 Starting Royal Media Auth Service Development Environment"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists, if not create a sample one
if [ ! -f ".env" ]; then
    echo "📝 Creating sample .env file..."
    cat > .env << EOL
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/royal-media-auth
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-please-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long-please-change-this
EOL
    echo "✅ Sample .env file created. Please update it with your actual values."
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
else
    echo "🗃️  MongoDB check passed"
fi

# Check if Redis is running
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis is not installed. Please install Redis first."
else
    echo "🔴 Redis check passed"
fi

# Setup database
echo "🛠️  Setting up database..."
npm run setup

# Start the servers
echo "🚀 Starting development servers..."
echo "📋 Backend will run on: http://localhost:3001"
echo "🌐 Frontend will run on: http://localhost:3000"
echo "📚 API Docs will be available at: http://localhost:3001/api-docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=========================================================="

# Start backend server in background
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
npm run frontend &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait