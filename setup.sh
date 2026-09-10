#!/bin/bash
# Quick-start setup script for Airfare Price Index (APIx)

set -e  # Exit on error

echo "================================"
echo "Airfare Price Index (APIx) Setup"
echo "================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker from https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose"
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Review and edit if needed."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Starting services..."
echo ""

# Start services
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
echo ""
echo "================================"
echo "Services Status"
echo "================================"
echo ""

# Check API
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ API Server: http://localhost:5000"
    echo "   API Docs: http://localhost:5000/docs"
else
    echo "❌ API Server: Not responding"
fi

# Check Dashboard
echo "✅ Dashboard: http://localhost:8501"

# Check Database
if docker-compose exec -T postgres pg_isready -U apix_user > /dev/null 2>&1; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: Not responding"
fi

echo ""
echo "================================"
echo "Next Steps"
echo "================================"
echo ""
echo "1. View API Documentation:"
echo "   http://localhost:5000/docs"
echo ""
echo "2. Open Dashboard:"
echo "   http://localhost:8501"
echo ""
echo "3. Trigger a scrape:"
echo "   curl -X POST http://localhost:5000/scrape/indigo?origin=DEL&destination=BOM"
echo ""
echo "4. View collected fares:"
echo "   curl http://localhost:5000/fares"
echo ""
echo "5. Get current index:"
echo "   curl http://localhost:5000/index"
echo ""
echo "6. View logs:"
echo "   docker-compose logs -f api"
echo "   docker-compose logs -f dashboard"
echo ""
echo "7. Stop all services:"
echo "   docker-compose down"
echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
