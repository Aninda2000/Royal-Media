#!/bin/bash

# Royal Media Development Setup Script
echo "🚀 Starting Royal Media development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists mongod; then
    echo -e "${YELLOW}⚠️  MongoDB is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install MongoDB or ensure it's running${NC}"
fi

if ! command_exists redis-server; then
    echo -e "${YELLOW}⚠️  Redis is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Redis or ensure it's running${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Build services
echo -e "${BLUE}Building services...${NC}"
npm run build

# Start services concurrently
echo -e "${BLUE}Starting all services...${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔐 Auth Service: http://localhost:3001${NC}"
echo -e "${GREEN}📝 Posts Service: http://localhost:3002${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Run all services concurrently
npx concurrently \
  --prefix-colors "cyan,magenta,yellow" \
  --names "web,auth,posts" \
  --kill-others \
  "cd apps/web && npm run dev" \
  "cd apps/auth && npm run dev" \
  "cd apps/posts && npm run dev"