"""
QUICK START GUIDE
=================

This guide will get you up and running with the Airfare Price Index (APIx) in 5 minutes.

Prerequisites
=============

1. Docker and Docker Compose installed
2. Python 3.11+ (for local development)
3. 15GB disk space for PostgreSQL and Docker images
4. Ports 5000, 8501, 5432 available

Option 1: Docker Compose (Recommended)
=======================================

1. Clone the repository:
   git clone <repo-url>
   cd SIH_2K26

2. Copy environment file:
   cp .env.example .env

3. Start all services:
   docker-compose up -d

4. Wait for services to start (30-60 seconds)

5. Access:
   - Dashboard: http://localhost:8501
   - API: http://localhost:5000
   - API Docs: http://localhost:5000/docs

6. Run the setup script (for convenience):
   chmod +x setup.sh
   ./setup.sh        # Linux/Mac
   setup.bat         # Windows

Option 2: Local Development
============================

1. Create virtual environment:
   python -m venv venv
   source venv/bin/activate    # Linux/Mac
   venv\\Scripts\\activate.bat # Windows

2. Install dependencies:
   pip install -r requirements.txt

3. Set up PostgreSQL locally or use Docker:
   docker run -d --name postgres \\
     -e POSTGRES_PASSWORD=password \\
     -p 5432:5432 \\
     postgres:15-alpine

4. Create .env file:
   cp .env.example .env
   # Edit DATABASE_URL to match your PostgreSQL setup

5. Run tests:
   pytest tests/ -v

6. Start API server:
   python main.py        # Runs on port 5000

7. Start dashboard (in another terminal):
   streamlit run dashboard/app.py    # Runs on port 8501

API Usage Examples
==================

1. Health Check:
   curl http://localhost:5000/health

2. Get Airfare Price Index:
   curl http://localhost:5000/index

3. Get Official CPI:
   curl http://localhost:5000/cpi/official

4. Get all fares:
   curl http://localhost:5000/fares

5. Get fares for specific route:
   curl http://localhost:5000/fares/route/DEL/BOM?days=7

6. Get route statistics:
   curl http://localhost:5000/route-stats/DEL/BOM

7. Get airline statistics:
   curl http://localhost:5000/airline-stats/6E

8. Trigger a scrape:
   curl -X POST \\
     http://localhost:5000/scrape/indigo?\\
     origin=DEL&destination=BOM&days_ahead=7

9. Get active routes:
   curl http://localhost:5000/routes

Dashboard Features
==================

1. National Index:
   - View current airfare price index
   - Compare to base period (2024-01)
   - See route and airline breakdowns

2. Route Analysis:
   - Select a route and view:
     * Min/max/mean/median fares
     * Fare trends over time
     * Airline comparison
     * Distribution histogram

3. Airline Analysis:
   - View airline statistics
   - Compare mean fares
   - See route coverage

4. Data Quality:
   - Quote collection metrics
   - Coverage by route
   - Daily quote trends

5. Anomalies:
   - Price spike detection
   - Anomaly alerts
   - Root cause investigation

Scraping Manual Trigger
=======================

Run a scraper from command line:

   # IndiGo scraper
   python main.py --origin DEL --destination BOM --scraper indigo

   # Goibibo scraper
   python main.py --origin DEL --destination BOM --scraper goibibo

   # Both scrapers
   python main.py --origin DEL --destination BOM --scraper all

   # Specific date
   python main.py --origin DEL --destination BOM --date 2024-09-20 --scraper indigo

Running Tests
=============

1. Run all tests:
   pytest tests/ -v

2. Run with coverage:
   pytest tests/ --cov=. --cov-report=html

3. Run specific test:
   pytest tests/test_full_suite.py::TestIndexCalculation -v

4. Run tests in Docker:
   docker-compose exec api pytest tests/ -v

Database Access
===============

Connect to PostgreSQL:

   docker-compose exec postgres psql -U apix_user -d apix

Common queries:

   # View all fare quotes
   SELECT * FROM fare_quotes LIMIT 10;

   # View index
   SELECT origin, destination, COUNT(*) as quote_count
   FROM fare_quotes
   GROUP BY origin, destination
   ORDER BY quote_count DESC;

   # View airlines
   SELECT carrier, COUNT(*) as quote_count
   FROM fare_quotes
   GROUP BY carrier;

Troubleshooting
===============

1. API not responding:
   docker-compose logs api
   docker-compose restart api

2. Dashboard not loading:
   docker-compose logs dashboard
   clear browser cache

3. Database connection error:
   docker-compose logs postgres
   docker-compose restart postgres
   # Check DATABASE_URL in .env

4. Permission denied on setup.sh:
   chmod +x setup.sh

5. Port already in use:
   docker-compose down
   # Free up ports and try again

Stopping Services
=================

   docker-compose down

To also remove data:
   docker-compose down -v

Performance Tips
================

1. Use redis cache layer:
   docker-compose --profile optional up -d redis

2. Increase database connections:
   Edit docker-compose.yml and adjust PostgreSQL settings

3. Scale API instances:
   docker-compose up -d --scale api=3

4. Use nginx as reverse proxy:
   Add nginx service to docker-compose.yml

Production Deployment
=====================

1. Use managed PostgreSQL service (AWS RDS, Azure Database)

2. Enable SSL/TLS certificates

3. Use environment-specific .env files

4. Set up monitoring and logging

5. Configure backup strategy

6. Use Kubernetes for scaling (optional)

See DEPLOYMENT.md for detailed production setup.

Project Documentation
=====================

- README.md: Project overview and problem statement
- DEPLOYMENT.md: Setup and deployment instructions  
- PROJECT_COMPLETION.md: Detailed completion checklist
- API docs: http://localhost:5000/docs (when running)
- Tests: tests/test_full_suite.py

Support
=======

If you encounter issues:

1. Check logs:
   docker-compose logs -f

2. Review DEPLOYMENT.md troubleshooting section

3. Check test suite for usage examples

4. Review API documentation at /docs endpoint

5. Read inline code comments for technical details

Next Steps
==========

1. ✅ Start services
2. ✅ Open dashboard
3. ✅ Trigger a scrape
4. ✅ View collected data
5. ✅ Check API endpoints
6. ✅ Review test suite
7. ✅ Customize settings

Happy indexing! 📊✈️
"""
