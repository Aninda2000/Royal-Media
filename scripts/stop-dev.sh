#!/bin/bash
echo "🛑 Stopping Royal Media development environment..."

# Kill processes
if kill 6351 2>/dev/null; then
    echo "✅ Auth service stopped (PID: 6351)"
else
    echo "⚠️  Auth service not running or already stopped"
fi

if kill 6374 2>/dev/null; then
    echo "✅ Frontend stopped (PID: 6374)"
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
