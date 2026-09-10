"""
Deployment and setup instructions for the Airfare Price Index (APIx).

Quick Start with Docker Compose
================================

1. Prerequisites:
   - Docker and Docker Compose installed
   - Port 5000 (API), 8501 (Dashboard), 5432 (Database) available

2. Setup:
   cd /path/to/SIH_2K26
   cp .env.example .env
   # Edit .env with your configuration

3. Start all services:
   docker-compose up -d

4. Access the services:
   - API: http://localhost:5000
   - Dashboard: http://localhost:8501
   - API Docs: http://localhost:5000/docs

5. Run migrations (if needed):
   docker-compose exec api python -c "from db.session import create_database_session; create_database_session('postgresql+psycopg2://apix_user:apix_password@postgres:5432/apix')"

6. Trigger a scrape:
   docker-compose exec api python main.py --origin DEL --destination BOM --scraper all

7. Stop services:
   docker-compose down

Production Deployment
=====================

For production, consider:
1. Use environment-specific .env files
2. Enable SSL/TLS with reverse proxy (nginx/Caddy)
3. Use external PostgreSQL managed service (AWS RDS, Azure Database)
4. Configure backup strategy for database
5. Set up monitoring and logging (ELK stack, Prometheus)
6. Use Kubernetes for scaling (helm charts optional)

Local Development Setup
=======================

1. Create virtual environment:
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate

2. Install dependencies:
   pip install -r requirements.txt

3. Set up environment:
   cp .env.example .env
   # Edit .env with local database URL

4. Initialize database:
   python -c "from db.session import create_database_session; s = create_database_session('postgresql+psycopg2://user:pass@localhost:5432/apix')"

5. Run tests:
   pytest tests/ -v

6. Run API server:
   python main.py  # Runs as API server by default

7. Run dashboard:
   streamlit run dashboard/app.py

8. Run scraper manually:
   python main.py --origin DEL --destination BOM --scraper indigo

API Endpoints
=============

Health Check:
  GET /health

Official CPI Data:
  GET /cpi/official

Fare Quotes:
  GET /fares - Get all fares
  GET /fares/route/{origin}/{destination} - Get fares for route

Index:
  GET /index - Get airfare price index

Statistics:
  GET /route-stats/{origin}/{destination} - Route statistics
  GET /airline-stats/{carrier} - Airline statistics
  GET /routes - Active routes list

Scraping:
  POST /scrape/{scraper_type} - Trigger scrape

Database Schema
===============

Main tables:
- fare_quotes: Raw scraped fare data
- cpi_reference: Official MoSPI CPI data

See db/schema.sql for full schema.

Troubleshooting
===============

1. Database connection error:
   - Check DATABASE_URL environment variable
   - Verify PostgreSQL is running
   - Test with: psql postgresql://user:pass@host/dbname

2. Playwright timeouts:
   - Increase SCRAPE_TIMEOUT_SECONDS
   - Check network connectivity
   - Verify site is accessible

3. API not responding:
   - Check logs: docker-compose logs api
   - Verify port 5000 is not in use
   - Check database connection

4. Dashboard not loading:
   - Check logs: docker-compose logs dashboard
   - Verify API is running
   - Clear browser cache

Performance Tuning
==================

1. Database:
   - Create indices on frequently queried columns
   - Consider partitioning fare_quotes by date
   - Enable query caching in PostgreSQL

2. API:
   - Use Redis caching for index calculations
   - Implement async scraping with Celery
   - Add pagination to list endpoints

3. Scraping:
   - Use proxy rotation for bypass anti-scraping
   - Implement exponential backoff for retries
   - Cache Playwright browser instances

Monitoring
==========

Set up monitoring for:
1. API response times
2. Scraper success/failure rates
3. Database query performance
4. Data quality metrics
5. Anomaly detection alerts

Use Prometheus + Grafana for visualization.
"""
