#!/bin/bash

# Royal Media Auth Service - Local Setup Script
# © Design and Developed by Aninda Sundar Roy

echo "🚀 Royal Media Auth Service - Local Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB and start it."
    echo "   macOS: brew install mongodb-community && brew services start mongodb/brew/mongodb-community"
    echo "   Ubuntu: sudo apt install mongodb && sudo systemctl start mongodb"
else
    echo "✅ MongoDB found"
fi

# Check if Redis is running (optional)
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis not found (optional). Some features may not work."
    echo "   macOS: brew install redis && brew services start redis"
    echo "   Ubuntu: sudo apt install redis-server && sudo systemctl start redis-server"
else
    echo "✅ Redis found"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

echo "🔧 Setting up database and initial data..."
npm run setup

if [ $? -ne 0 ]; then
    echo "❌ Database setup failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the service:"
echo "  npm run dev"
echo ""
echo "To test the service:"
echo "  npm run test:service"
echo ""
echo "API will be available at: http://localhost:3001"
echo "========================================"
echo "© Design and Developed by Aninda Sundar Roy"