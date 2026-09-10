"""
API REFERENCE GUIDE
Airfare Price Index (APIx) REST API

Base URL: http://localhost:5000
API Docs: http://localhost:5000/docs (interactive Swagger UI)

All endpoints return JSON responses with appropriate HTTP status codes.
"""

=============================================================================
1. HEALTH CHECK
=============================================================================

GET /health

Check API and database connectivity.

Response (200 OK):
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2024-09-10T10:30:00Z"
}

Example:
$ curl http://localhost:5000/health


=============================================================================
2. OFFICIAL CPI DATA
=============================================================================

GET /cpi/official

Fetch official Transport & Communication CPI from MoSPI.

Query Parameters:
(none)

Response (200 OK):
{
  "status": "ok",
  "source": "MoSPI CPI API",
  "sub_group": "Transport and Communication",
  "data": [
    {
      "period": "2024-01",
      "index_value": 112.5,
      "inflation_rate": 3.2
    },
    ...
  ],
  "fetched_at": "2024-09-10T10:30:00Z"
}

Example:
$ curl http://localhost:5000/cpi/official


=============================================================================
3. FARE QUOTES - GET ALL
=============================================================================

GET /fares

Retrieve fare quotes with optional filtering.

Query Parameters:
- origin (optional): IATA code of origin city (e.g., DEL)
- destination (optional): IATA code of destination city (e.g., BOM)
- limit (optional, default=100, max=1000): Max records to return
- offset (optional, default=0): Offset for pagination

Response (200 OK):
[
  {
    "id": 1,
    "origin": "DEL",
    "destination": "BOM",
    "carrier": "6E",
    "source_site": "goindigo",
    "departure_date": "2024-09-17",
    "advance_purchase_days": 7,
    "fare_class": "ECONOMY",
    "base_fare": 3200.0,
    "taxes_fees": 800.0,
    "total_fare": 4000.0,
    "is_available": true
  },
  ...
]

Examples:
$ curl http://localhost:5000/fares
$ curl http://localhost:5000/fares?origin=DEL
$ curl http://localhost:5000/fares?origin=DEL&destination=BOM&limit=50
$ curl http://localhost:5000/fares?limit=100&offset=100


=============================================================================
4. FARE QUOTES - BY ROUTE
=============================================================================

GET /fares/route/{origin}/{destination}

Get fare quotes for a specific route.

Path Parameters:
- origin: IATA code (e.g., DEL)
- destination: IATA code (e.g., BOM)

Query Parameters:
- days (optional, default=7, max=90): Last N days of data

Response (200 OK):
[
  {
    "id": 1,
    "origin": "DEL",
    "destination": "BOM",
    "carrier": "6E",
    "total_fare": 4000.0,
    ...
  },
  ...
]

Examples:
$ curl http://localhost:5000/fares/route/DEL/BOM
$ curl http://localhost:5000/fares/route/DEL/BOM?days=30


=============================================================================
5. AIRFARE PRICE INDEX
=============================================================================

GET /index

Calculate and return the current Airfare Price Index.

Query Parameters:
- base_period (optional, default=2024-01): Base period (YYYY-MM)

Response (200 OK):
{
  "national_index": 115.2,
  "base_period": "2024-01",
  "current_period": "2024-09",
  "route_indices": {
    "DEL-BOM": 112.5,
    "DEL-BLR": 118.3,
    "BOM-BLR": 114.8,
    ...
  },
  "airline_indices": {
    "6E": 114.2,
    "AI": 116.8,
    "SG": 112.5,
    ...
  },
  "timestamp": "2024-09-10T10:30:00Z"
}

Interpretation:
- national_index = 115.2 means fares are 15.2% higher than base period
- route_indices show price changes per route
- airline_indices show price changes per airline
- Base = 100.0

Examples:
$ curl http://localhost:5000/index
$ curl http://localhost:5000/index?base_period=2024-06


=============================================================================
6. ROUTE STATISTICS
=============================================================================

GET /route-stats/{origin}/{destination}

Get statistical summary for a route.

Path Parameters:
- origin: IATA code
- destination: IATA code

Response (200 OK):
{
  "route": "DEL-BOM",
  "min_fare": 3200,
  "max_fare": 8500,
  "mean_fare": 5234.5,
  "median_fare": 5100,
  "std_dev": 1234.5,
  "sample_size": 45,
  "update_count": 12
}

Interpretation:
- min_fare: Lowest price found
- max_fare: Highest price found
- mean_fare: Average price
- median_fare: Middle value (50th percentile)
- std_dev: Standard deviation (price volatility)
- sample_size: Number of quotes in last 7 days
- update_count: Number of times prices were updated

Examples:
$ curl http://localhost:5000/route-stats/DEL/BOM
$ curl http://localhost:5000/route-stats/BOM/BLR


=============================================================================
7. AIRLINE STATISTICS
=============================================================================

GET /airline-stats/{carrier}

Get statistical summary for an airline.

Path Parameters:
- carrier: 2-letter IATA carrier code (e.g., 6E for IndiGo)

Response (200 OK):
{
  "carrier": "6E",
  "mean_fare": 4234.5,
  "median_fare": 4100,
  "min_fare": 3200,
  "max_fare": 6500,
  "std_dev": 934.5,
  "sample_count": 120,
  "route_count": 8,
  "routes": ["DEL-BOM", "DEL-BLR", "BOM-BLR", ...],
  "period_days": 7
}

Examples:
$ curl http://localhost:5000/airline-stats/6E
$ curl http://localhost:5000/airline-stats/AI
$ curl http://localhost:5000/airline-stats/SG

Carrier Codes:
- 6E = IndiGo
- AI = Air India
- SG = SpiceJet
- G8 = GoAir (Go First)
- IX = Air India Express
- UK = Vistara
- 9W = Jet Airways
- NQ = NeoGeo


=============================================================================
8. ACTIVE ROUTES
=============================================================================

GET /routes

Get list of all active routes with recent data.

Query Parameters:
(none)

Response (200 OK):
[
  {
    "origin": "DEL",
    "destination": "BOM",
    "quote_count": 245
  },
  {
    "origin": "DEL",
    "destination": "BLR",
    "quote_count": 189
  },
  ...
]

Sorted by quote count (most active routes first).

Example:
$ curl http://localhost:5000/routes


=============================================================================
9. TRIGGER SCRAPING
=============================================================================

POST /scrape/{scraper_type}

Manually trigger a scraping job.

Path Parameters:
- scraper_type: "indigo" or "goibibo"

Query Parameters:
- origin (optional, default=DEL): Origin IATA code
- destination (optional, default=BOM): Destination IATA code
- days_ahead (optional, default=7, range=1-90): Days ahead to scrape

Response (200 OK):
{
  "status": "success",
  "scraper": "indigo",
  "route": "DEL-BOM",
  "quotes_extracted": 12,
  "timestamp": "2024-09-10T10:30:00Z"
}

Examples:
$ curl -X POST http://localhost:5000/scrape/indigo
$ curl -X POST http://localhost:5000/scrape/goibibo?origin=BOM&destination=BLR
$ curl -X POST http://localhost:5000/scrape/indigo?days_ahead=14


=============================================================================
HTTP STATUS CODES
=============================================================================

200 OK
- Request successful, data returned

400 Bad Request
- Invalid query parameters or request format
- Common: Invalid date format, invalid IATA code

404 Not Found
- Route or airline not found in database

409 Conflict
- Data conflict (e.g., scraper already running)
- Example: "MoSPI CPI API reported no data found"

500 Internal Server Error
- Server error (check logs)
- Example: Database connection error

503 Service Unavailable
- Service temporarily unavailable


=============================================================================
ERROR RESPONSES
=============================================================================

{
  "detail": "Error message describing what went wrong"
}

Examples:
- "No data found for route DEL-XYZ"
- "Invalid MoSPI CPI request parameters"
- "Scraping failed: Connection timeout"


=============================================================================
COMMON USAGE PATTERNS
=============================================================================

1. Real-time Price Monitoring
   GET /fares/route/{origin}/{destination}?days=1

2. Price Comparison Across Airlines
   GET /airline-stats/{carrier}
   GET /route-stats/{origin}/{destination}

3. Historical Trend Analysis
   GET /fares/route/{origin}/{destination}?days=30
   (Then aggregate by date in client)

4. Market Index Dashboard
   GET /index
   GET /cpi/official
   (Combine for comparison)

5. Route Selection for Operations
   GET /routes
   (Identify most active/profitable routes)

6. Data Collection
   POST /scrape/{scraper_type}
   GET /fares?limit=1000&offset=0
   (Pagination if more than 1000 records)

7. Anomaly Detection
   GET /route-stats/{origin}/{destination}
   (Check std_dev for volatility)
   (Check min_fare and max_fare range)

8. CPI Validation
   GET /index
   GET /cpi/official
   (Compare APIx with official CPI)


=============================================================================
RATE LIMITING
=============================================================================

Current implementation: No rate limiting on API endpoints
(Suitable for internal use and controlled access)

For public API, consider:
1. IP-based rate limiting
2. API key-based rate limiting
3. Per-user quota management
4. Burst protection

See production deployment guide for recommendations.


=============================================================================
AUTHENTICATION
=============================================================================

Current implementation: No authentication
(Assumes internal network or controlled access)

For production:
1. Use API keys
2. Implement JWT tokens
3. Use OAuth2 for third-party access
4. Add role-based access control


=============================================================================
PAGINATION
=============================================================================

For endpoints that return large result sets:

First page:
$ curl http://localhost:5000/fares?limit=100&offset=0

Next page:
$ curl http://localhost:5000/fares?limit=100&offset=100

Previous page:
$ curl http://localhost:5000/fares?limit=100&offset=0

Note: Maximum limit is 1000 records per request


=============================================================================
RESPONSE TIME TARGETS
=============================================================================

Health Check:       < 10ms
Get Fares:          < 100ms (for 1000 records)
Index Calculation:  < 500ms
Route Statistics:   < 100ms
Airline Statistics: < 200ms


=============================================================================
DATA TYPES & FORMATS
=============================================================================

Dates: ISO 8601 format (YYYY-MM-DD)
  Example: "2024-09-10"

DateTimes: ISO 8601 format with timezone
  Example: "2024-09-10T10:30:00Z"

Money: Float (Indian Rupees)
  Example: 4500.0

Codes:
- IATA codes: 3-letter uppercase (DEL, BOM, BLR, etc.)
- Carrier codes: 2-letter uppercase (6E, AI, SG, etc.)


=============================================================================
TESTING THE API
=============================================================================

Using curl:
$ curl http://localhost:5000/health

Using Python:
import requests
response = requests.get('http://localhost:5000/fares/route/DEL/BOM')
data = response.json()
print(data)

Using JavaScript/Node.js:
fetch('http://localhost:5000/index')
  .then(r => r.json())
  .then(data => console.log(data))

Using Postman:
1. Import API documentation from /docs
2. Set base URL to http://localhost:5000
3. Create requests and save to collections


=============================================================================
USEFUL IATA AIRPORT CODES
=============================================================================

Major Indian Airports:
- DEL: Indira Gandhi International, New Delhi
- BOM: Bombay (Mumbai) Indira Gandhi
- BLR: Kempegowda International, Bangalore
- CCU: Netaji Subhas Chandra Bose, Kolkata
- HYD: Rajiv Gandhi International, Hyderabad
- MAA: Chennai International
- COK: Cochin International
- AMD: Sardar Vallabhbhai Patel, Ahmedabad
- DXB: Dubai International (for comparison)
- SIN: Singapore Changi (for comparison)


=============================================================================
SUPPORT & DEBUGGING
=============================================================================

1. API Documentation:
   http://localhost:5000/docs

2. Interactive API Testing:
   http://localhost:5000/redoc

3. Check Logs:
   docker-compose logs api

4. Health Status:
   curl http://localhost:5000/health

5. See API Source:
   main.py (lines 100-250)

6. Run Tests:
   pytest tests/test_full_suite.py -v

For more help, see README.md, DEPLOYMENT.md, or QUICKSTART.md
"""
