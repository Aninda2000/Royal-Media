# Docker Setup Guide for Royal Media

## Installing Docker on macOS

### Option 1: Docker Desktop (Recommended)

1. **Download Docker Desktop:**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Click "Download for Mac"
   - Choose the right version for your Mac:
     - **Apple Silicon (M1/M2/M3)**: Download "Mac with Apple chip"
     - **Intel Mac**: Download "Mac with Intel chip"

2. **Install Docker Desktop:**
   - Open the downloaded `.dmg` file
   - Drag Docker to your Applications folder
   - Open Docker from Applications
   - Follow the setup wizard

3. **Start Docker:**
   - Docker Desktop should start automatically
   - You'll see the Docker whale icon in your menu bar
   - Wait for it to say "Docker Desktop is running"

### Option 2: Using Homebrew

```bash
# Install Docker Desktop via Homebrew
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

## Verify Docker Installation

After Docker is running, verify it's working:

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Test Docker is running
docker run hello-world
```

## Starting Docker

If Docker is installed but not running:

1. **Via Applications:**
   - Open Applications folder
   - Double-click Docker
   - Wait for it to start (whale icon appears in menu bar)

2. **Via Spotlight:**
   - Press `Cmd + Space`
   - Type "Docker"
   - Press Enter

3. **Via Terminal:**
   ```bash
   open /Applications/Docker.app
   ```

## Troubleshooting

### Docker Desktop won't start:
- Restart your Mac
- Check System Requirements (macOS 10.15 or newer)
- Free up disk space (Docker needs at least 4GB)

### Permission issues:
```bash
# Add your user to docker group (if needed)
sudo dscl . append /Groups/docker GroupMembership $USER
```

### Reset Docker:
- Open Docker Desktop
- Go to Settings (gear icon)
- Click "Troubleshoot"
- Click "Reset to factory defaults"

## Once Docker is Running

After Docker is successfully running (you see the whale icon in your menu bar), you can run the Royal Media setup:

```bash
# Navigate to project directory
cd /Users/anindasundarroy/Desktop/personal/royal-media

# Run the development setup script
./scripts/dev-setup.sh
```

## Alternative: Manual Setup Without Docker

If you prefer not to use Docker for databases, you can install MongoDB and Redis locally:

### Install MongoDB locally:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# MongoDB will be available at: mongodb://localhost:27017
```

### Install Redis locally:
```bash
# Using Homebrew
brew install redis
brew services start redis

# Redis will be available at: redis://localhost:6379
```

### Update environment variables:
Create a `.env` file in `apps/auth/`:
```bash
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/royal_media
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

Then run services manually:
```bash
# Terminal 1: Auth service
cd apps/auth && npm install && npm run dev

# Terminal 2: Frontend
cd apps/web && npm install && npm run dev
```