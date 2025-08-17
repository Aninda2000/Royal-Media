#!/bin/bash

# Install MongoDB and Redis locally using Homebrew

echo "📦 Installing Local Databases for Royal Media"
echo "============================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "🔄 Updating Homebrew..."
brew update

echo "📦 Installing MongoDB..."
# Add MongoDB tap
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community

echo "📦 Installing Redis..."
brew install redis

echo "🚀 Starting database services..."

# Start MongoDB
echo "   Starting MongoDB..."
brew services start mongodb-community

# Start Redis  
echo "   Starting Redis..."
brew services start redis

echo "⏳ Waiting for services to start..."
sleep 5

echo "🔍 Verifying installations..."

# Test MongoDB
if mongosh --eval "db.runCommand('ismaster')" --quiet &> /dev/null; then
    echo "✅ MongoDB is running on mongodb://localhost:27017"
else
    echo "⚠️  MongoDB may still be starting up..."
fi

# Test Redis
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is running on redis://localhost:6379"
else
    echo "⚠️  Redis may still be starting up..."
fi

echo ""
echo "🎉 Database installation complete!"
echo ""
echo "📋 Service Management:"
echo "   Stop MongoDB:  brew services stop mongodb-community"
echo "   Stop Redis:    brew services stop redis"
echo "   Start MongoDB: brew services start mongodb-community"  
echo "   Start Redis:   brew services start redis"
echo ""
echo "🔗 Connection URLs:"
echo "   MongoDB: mongodb://localhost:27017/royal_media"
echo "   Redis:   redis://localhost:6379"
echo ""
echo "✅ You can now run the development setup:"
echo "   ./scripts/dev-setup-simple.sh"