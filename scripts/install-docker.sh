#!/bin/bash

# Docker Installation Script for macOS
# This script will install Docker Desktop using Homebrew

echo "🐳 Docker Installation Script for Royal Media"
echo "============================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only."
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew is already installed"
fi

# Update Homebrew
echo "🔄 Updating Homebrew..."
brew update

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "✅ Docker is already installed"
    docker --version
    
    # Check if Docker is running
    if docker info &> /dev/null; then
        echo "✅ Docker is running"
    else
        echo "⚠️  Docker is installed but not running. Starting Docker..."
        open /Applications/Docker.app
        echo "⏳ Waiting for Docker to start..."
        
        # Wait for Docker to start (up to 60 seconds)
        for i in {1..12}; do
            if docker info &> /dev/null; then
                echo "✅ Docker is now running!"
                break
            fi
            echo "   Waiting... ($i/12)"
            sleep 5
        done
        
        if ! docker info &> /dev/null; then
            echo "❌ Docker failed to start. Please start Docker Desktop manually."
            exit 1
        fi
    fi
else
    echo "📦 Installing Docker Desktop..."
    brew install --cask docker
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker Desktop installed successfully"
        
        echo "🚀 Starting Docker Desktop..."
        open /Applications/Docker.app
        
        echo "⏳ Waiting for Docker to start (this may take a minute)..."
        
        # Wait for Docker to start (up to 2 minutes)
        for i in {1..24}; do
            if docker info &> /dev/null; then
                echo "✅ Docker is now running!"
                break
            fi
            echo "   Starting Docker... ($i/24)"
            sleep 5
        done
        
        if ! docker info &> /dev/null; then
            echo "⚠️  Docker is taking longer than expected to start."
            echo "   Please wait for Docker Desktop to finish starting, then run:"
            echo "   ./scripts/dev-setup.sh"
            exit 1
        fi
    else
        echo "❌ Failed to install Docker Desktop"
        exit 1
    fi
fi

# Verify Docker installation
echo ""
echo "🔍 Verifying Docker installation..."
docker --version
docker-compose --version

# Test Docker with hello-world
echo "🧪 Testing Docker..."
if docker run hello-world &> /dev/null; then
    echo "✅ Docker test successful!"
else
    echo "⚠️  Docker test failed, but installation completed"
fi

echo ""
echo "🎉 Docker setup complete!"
echo ""
echo "Next steps:"
echo "1. Docker Desktop should now be running (check for whale icon in menu bar)"
echo "2. Run the Royal Media development setup:"
echo "   ./scripts/dev-setup.sh"
echo ""
echo "If you see the Docker whale icon in your menu bar, you're ready to go!"