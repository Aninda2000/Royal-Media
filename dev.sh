#!/bin/bash

# Royal Media Development Script
# Starts all microservices and the frontend

set -e

echo "🚀 Starting Royal Media Development Environment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed - MongoDB and Redis will need to be running separately"
    fi
    
    print_success "Dependencies check completed"
}

# Start MongoDB and Redis with Docker
start_databases() {
    print_status "Starting databases..."
    
    if command -v docker &> /dev/null; then
        # Start MongoDB
        if ! docker ps | grep -q "royal-media-mongo"; then
            print_status "Starting MongoDB container..."
            docker run -d \
                --name royal-media-mongo \
                -p 27017:27017 \
                -e MONGO_INITDB_ROOT_USERNAME=admin \
                -e MONGO_INITDB_ROOT_PASSWORD=password \
                mongo:latest
        else
            print_status "MongoDB container already running"
        fi
        
        # Start Redis
        if ! docker ps | grep -q "royal-media-redis"; then
            print_status "Starting Redis container..."
            docker run -d \
                --name royal-media-redis \
                -p 6379:6379 \
                redis:alpine
        else
            print_status "Redis container already running"
        fi
        
        print_success "Databases started"
    else
        print_warning "Please ensure MongoDB and Redis are running on their default ports"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Auth service dependencies
    if [ -d "apps/auth" ]; then
        print_status "Installing auth service dependencies..."
        cd apps/auth
        npm install
        cd ../..
    fi
    
    # Posts service dependencies
    if [ -d "apps/posts" ]; then
        print_status "Installing posts service dependencies..."
        cd apps/posts
        npm install
        cd ../..
    fi
    
    # Web app dependencies
    if [ -d "apps/web" ]; then
        print_status "Installing web app dependencies..."
        cd apps/web
        npm install
        cd ../..
    fi
    
    print_success "Dependencies installed"
}

# Build services
build_services() {
    print_status "Building services..."
    
    # Build auth service
    if [ -d "apps/auth" ]; then
        print_status "Building auth service..."
        cd apps/auth
        npm run build
        cd ../..
    fi
    
    # Build posts service
    if [ -d "apps/posts" ]; then
        print_status "Building posts service..."
        cd apps/posts
        npm run build
        cd ../..
    fi
    
    print_success "Services built"
}

# Seed database
seed_database() {
    print_status "Seeding database..."
    
    if [ -d "apps/posts" ]; then
        cd apps/posts
        npm run seed
        cd ../..
        print_success "Database seeded"
    else
        print_warning "Posts service not found, skipping database seeding"
    fi
}

# Start services in background
start_services() {
    print_status "Starting services..."
    
    # Create logs directory
    mkdir -p logs
    
    # Start auth service
    if [ -d "apps/auth" ]; then
        print_status "Starting auth service on port 3001..."
        cd apps/auth
        npm start > ../../logs/auth.log 2>&1 &
        AUTH_PID=$!
        echo $AUTH_PID > ../../logs/auth.pid
        cd ../..
        sleep 2
    fi
    
    # Start posts service
    if [ -d "apps/posts" ]; then
        print_status "Starting posts service on port 3002..."
        cd apps/posts
        npm start > ../../logs/posts.log 2>&1 &
        POSTS_PID=$!
        echo $POSTS_PID > ../../logs/posts.pid
        cd ../..
        sleep 2
    fi
    
    # Start web app
    if [ -d "apps/web" ]; then
        print_status "Starting web application on port 3000..."
        cd apps/web
        npm run dev > ../../logs/web.log 2>&1 &
        WEB_PID=$!
        echo $WEB_PID > ../../logs/web.pid
        cd ../..
    fi
    
    print_success "Services started"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    sleep 5
    
    # Check auth service
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Auth service is healthy"
    else
        print_error "Auth service health check failed"
    fi
    
    # Check posts service
    if curl -s http://localhost:3002/health > /dev/null; then
        print_success "Posts service is healthy"
    else
        print_error "Posts service health check failed"
    fi
    
    # Check web app
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Web application is healthy"
    else
        print_error "Web application health check failed"
    fi
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    
    if [ -f "logs/auth.pid" ]; then
        kill $(cat logs/auth.pid) 2>/dev/null || true
        rm logs/auth.pid
    fi
    
    if [ -f "logs/posts.pid" ]; then
        kill $(cat logs/posts.pid) 2>/dev/null || true
        rm logs/posts.pid
    fi
    
    if [ -f "logs/web.pid" ]; then
        kill $(cat logs/web.pid) 2>/dev/null || true
        rm logs/web.pid
    fi
    
    print_success "Services stopped"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    stop_services
    
    if command -v docker &> /dev/null; then
        docker stop royal-media-mongo royal-media-redis 2>/dev/null || true
        docker rm royal-media-mongo royal-media-redis 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Royal Media Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (default)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  build     Build all services"
    echo "  seed      Seed the database"
    echo "  logs      Show service logs"
    echo "  status    Show service status"
    echo "  clean     Stop services and clean up"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start all services"
    echo "  $0 logs     # Show logs"
    echo "  $0 clean    # Stop and cleanup"
}

# Show logs
show_logs() {
    print_status "Service logs:"
    echo ""
    
    if [ -f "logs/auth.log" ]; then
        echo "=== Auth Service Logs ==="
        tail -n 20 logs/auth.log
        echo ""
    fi
    
    if [ -f "logs/posts.log" ]; then
        echo "=== Posts Service Logs ==="
        tail -n 20 logs/posts.log
        echo ""
    fi
    
    if [ -f "logs/web.log" ]; then
        echo "=== Web Application Logs ==="
        tail -n 20 logs/web.log
        echo ""
    fi
}

# Show status
show_status() {
    print_status "Service status:"
    echo ""
    
    # Check if services are running
    if [ -f "logs/auth.pid" ] && kill -0 $(cat logs/auth.pid) 2>/dev/null; then
        print_success "Auth service is running (PID: $(cat logs/auth.pid))"
    else
        print_error "Auth service is not running"
    fi
    
    if [ -f "logs/posts.pid" ] && kill -0 $(cat logs/posts.pid) 2>/dev/null; then
        print_success "Posts service is running (PID: $(cat logs/posts.pid))"
    else
        print_error "Posts service is not running"
    fi
    
    if [ -f "logs/web.pid" ] && kill -0 $(cat logs/web.pid) 2>/dev/null; then
        print_success "Web application is running (PID: $(cat logs/web.pid))"
    else
        print_error "Web application is not running"
    fi
}

# Handle interrupt signal
trap cleanup INT

# Main script logic
case "${1:-start}" in
    "start")
        check_dependencies
        start_databases
        install_dependencies
        build_services
        seed_database
        start_services
        health_check
        
        echo ""
        print_success "Royal Media is now running!"
        echo ""
        echo "🌐 Web Application: http://localhost:3000"
        echo "🔐 Auth Service: http://localhost:3001"
        echo "📝 Posts Service: http://localhost:3002"
        echo ""
        echo "Press Ctrl+C to stop all services"
        echo ""
        
        # Keep script running
        while true; do
            sleep 1
        done
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        start_services
        health_check
        ;;
    "build")
        build_services
        ;;
    "seed")
        seed_database
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        cleanup
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac