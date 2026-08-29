# SIH26056 — Real-time Airfare Price Index for India
### Automated Web Scraping of Airline & OTA Portals for Augmentation of the Consumer Price Index (CPI)

| | |
|---|---|
| **PS Code** | SIH26056 |
| **Track** | Software |
| **Theme** | Travel & Tourism |
| **Sponsoring Ministry** | Ministry of Statistics and Programme Implementation (MoSPI) |
| **Prize** | ₹1,00,000 |
| **Deadline** | 20 September 2026 |

---

## 1. Background

The Consumer Price Index (CPI) is India's official measure of retail inflation, published monthly by MoSPI. It's built from a fixed "basket" of goods and services weighted by how much an average household spends on each — and **air travel fares** sit inside the Transport & Communication sub-group.

The trouble is *how* that airfare number currently gets into the basket. It's collected periodically (essentially a snapshot), while real airfares are one of the most volatile prices in the entire economy — they change by the hour based on:

- Seat inventory depletion (fewer seats left → higher price)
- Days-to-departure (last-minute vs. advance booking)
- Day-of-week and time-of-day demand patterns
- Fuel surcharges, festive/holiday demand spikes
- Route-specific competition (monopoly routes vs. high-competition metro routes)
- Dynamic algorithmic pricing run by airlines and OTAs themselves

A single monthly snapshot can badly misrepresent what consumers are actually paying, which distorts the accuracy of the Transport component of CPI — and CPI accuracy matters enormously, since it drives RBI's repo-rate decisions, wage/pension indexation, and government inflation-linked payouts.

Globally, statistical agencies have grappled with this exact issue. The US Bureau of Labor Statistics solved it decades ago with a method worth learning from directly: <cite index="5-1,5-2">web-based pricing lets the CPI track a defined trip month-to-month by assigning each price quote a fixed specification — a fixed advance-reservation window and a fixed day of the week — so a "seven-week advance, Tuesday" trip is priced the same way every month, more accurately emulating how consumers actually book airfare, with all applicable taxes, fuel surcharges, and baggage fees included.</cite> India currently has an experimental **Air Services Price Index** effort at the Office of the Economic Adviser too, but nothing automated, real-time, or scraping-driven exists yet.

**This is the gap SIH26056 asks you to fill: an automated, continuous, statistically rigorous fare-collection and indexing system.**

---

## 2. Problem Statement (restated precisely)

> Design and build a system that automatically scrapes real-time airfare data from Indian airline websites and OTA platforms across a representative sample of routes, cleans and normalizes this data, computes a statistically valid **Airfare Price Index (API)** using an appropriate index-number methodology, and exposes this index (with historical trends, route-level breakdowns, and anomaly flags) in a form that can augment or validate MoSPI's Transport CPI sub-index.

The three things a good solution must nail:
1. **Reliable, continuous data collection** despite anti-scraping defenses, dynamic pages, and rate limits.
2. **A methodologically sound index** — not just "average of scraped prices," because raw averages are badly biased by route mix, booking-class mix, and time-to-departure.
3. **A usable output layer** — dashboards, APIs, and reports that a statistician at MoSPI could actually trust and use.

---

## 3. Objectives

- Build an automated scraper fleet covering major Indian airlines (IndiGo, Air India, Air India Express, SpiceJet, Akasa Air, Vistara/merged AI) and OTAs (MakeMyTrip, Yatra, Cleartrip, ixigo, EaseMyTrip, Skyscanner).
- Define a **fixed representative route-and-specification basket** (e.g., top 40–50 city-pairs by passenger volume, priced at fixed advance-booking windows: 1 day, 1 week, 4 weeks, 8 weeks ahead).
- Collect fares at a defined frequency (e.g., every 4–6 hours) for each basket item.
- Clean, deduplicate, and normalize fares (include/exclude taxes and fees consistently).
- Compute a weighted index (e.g., Laspeyres or Fisher index) with a defined base period, updated in near real time.
- Detect and flag anomalies (fare glitches, scraper failures, extreme outliers) automatically.
- Visualize the index — national level, route level, and airline level — on a dashboard.
- Expose the index through an API so MoSPI (or any downstream consumer) can pull it for validation against manual CPI collection.
- Ensure the whole pipeline is legally mindful, resilient, and scalable.

---

## 4. Why raw scraped averages are the wrong approach (important insight)

A common mistake teams make: scrape a bunch of prices and average them daily. This produces a number that moves for the wrong reasons — e.g., if today more high-value routes (like Mumbai–Delhi) got scraped than short routes, the "average" jumps even though no individual fare actually changed. This is called **composition bias**, and it's exactly the trap that real CPI methodology exists to avoid.

The fix, mirroring international best practice: **hold the basket fixed.** Track the *same* set of route + travel-class + advance-booking-window combinations every cycle, and build a proper index number (price relative to a base period, weighted by that route's estimated passenger volume/expenditure share) rather than a simple average. This is the single most important design decision in the whole project — get it right and your solution is genuinely publishable-grade; get it wrong and it's just a fare-tracker with a fancy name.

---

## 5. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCE LAYER                        │
│  Airline sites (IndiGo, Air India, SpiceJet, Akasa...)          │
│  OTA sites/APIs (MakeMyTrip, Yatra, Cleartrip, ixigo, Skyscanner)│
└───────────────────────────┬───────────────────────────────────--┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                      SCRAPING / INGESTION LAYER                │
│  Scrapy / Playwright / Selenium workers, scheduled via         │
│  Airflow/Celery, rotating proxies, headless browser pool       │
└───────────────────────────┬─────────────────────────────────---┘
                             │ raw JSON/HTML
┌────────────────────────────▼──────────────────────────────────┐
│                    DATA CLEANING & VALIDATION                  │
│  Parse fares, normalize currency/taxes, dedupe, outlier         │
│  detection (IQR/Z-score/Isolation Forest), schema validation    │
└───────────────────────────┬─────────────────────────────────---┘
                             │ clean records
┌────────────────────────────▼──────────────────────────────────┐
│                    DATA WAREHOUSE (TIME-SERIES)                │
│  PostgreSQL/TimescaleDB or ClickHouse — fare_quotes table       │
│  keyed by route, airline, booking_date, travel_date, class      │
└───────────────────────────┬─────────────────────────────────---┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    INDEX COMPUTATION ENGINE                    │
│  Fixed-basket weighting, Laspeyres/Fisher index calculation,    │
│  base-period rebasing, seasonal adjustment, imputation for      │
│  missing quotes                                                 │
└───────────────────────────┬─────────────────────────────────---┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│              API LAYER + DASHBOARD + ALERTING                  │
│  REST/GraphQL API, React/Next.js dashboard, anomaly alerts,     │
│  MoSPI-compatible export (CSV/JSON matching CPI schema)         │
└──────────────────────────────────────────────────────────────-─┘
```

---

## 6. End-to-End Workflow

1. **Define the fare basket** — pick ~40–50 top city-pairs (by DGCA passenger traffic data), each priced at fixed advance-booking windows (1, 7, 28, 56 days) and a fixed travel day-of-week pattern, in Economy class.
2. **Scheduled scraping** — a job scheduler (Airflow/Celery/cron) triggers scraper workers every N hours to fetch current fares for every basket item across every airline/OTA.
3. **Scraper execution** — headless browsers (Playwright) or HTTP+API calls hit each site, extract fare, taxes, fare class, seats-left indicator (if shown), and timestamp.
4. **Raw storage** — dump raw HTML/JSON to object storage (S3/MinIO) for auditability and reprocessing if parsing logic needs to change later.
5. **Parsing & normalization** — structured extraction into a common schema: `{route, airline, source, travel_date, booking_date, days_to_departure, fare_base, taxes, total_fare, class, scraped_at}`.
6. **Validation & cleaning** — drop malformed records, flag statistical outliers, deduplicate near-identical quotes from the same source within a short time window.
7. **Load into time-series DB** — append to the fare_quotes table, partitioned by date for query efficiency.
8. **Index calculation** — nightly/hourly batch job computes the weighted price relative for each basket item vs. base period, aggregates into route-level, airline-level, and national indices using CPI-style weighting.
9. **Anomaly & outage detection** — if a source stops returning data or a route's index jumps implausibly, raise an alert (Slack/email) and flag the data point rather than silently including it.
10. **Publish** — push the day's index values to the API and dashboard; optionally export a MoSPI-schema file for cross-validation against manual CPI collection.
11. **Continuous feedback loop** — a data-quality dashboard for the team to check scraper health, coverage %, and missing-data rate daily.

---

## 7. Techniques & Technology Stack

### 7.1 Web Scraping
| Need | Tool/Technique |
|---|---|
| Static HTML pages | `requests` + `BeautifulSoup` |
| JS-heavy dynamic pages (most airline/OTA sites) | **Playwright** (preferred over Selenium — faster, better at handling modern SPA sites) |
| Large-scale structured crawling | **Scrapy** framework with custom spiders |
| Undetected browser automation | `playwright-stealth`, `undetected-chromedriver` |
| Rotating IPs to avoid blocks | Residential/rotating proxy pool (e.g., proxy provider APIs) |
| CAPTCHA handling | Avoid triggering it (rate-limit yourself, randomize headers/timing) rather than trying to break it |
| Scheduling at scale | **Apache Airflow** or **Celery + Redis** for distributed, retryable jobs |
| Some OTAs expose semi-public JSON APIs used by their own frontend | Prefer calling these directly (faster, more stable) over full-page scraping where feasible — inspect Network tab in browser devtools |

### 7.2 Data Engineering
- **Message queue**: Kafka or RabbitMQ to decouple scraper output from the processing pipeline (handles bursty load gracefully).
- **Storage**: TimescaleDB (Postgres extension, great for time-series + relational route metadata) or ClickHouse (very fast for large-scale analytical queries).
- **Raw archive**: S3-compatible object storage (MinIO if self-hosted) for reprocessing/audit.
- **ETL orchestration**: Airflow DAGs — one DAG per scrape cycle, one DAG for nightly index computation.

### 7.3 Statistics & Index Methodology
- **Index formula**: Laspeyres index (simplest, base-period-weighted) or Fisher Ideal Index (more robust, averages Laspeyres and Paasche) — this is genuinely the technical heart of the project and worth reading MoSPI's/BLS's index methodology docs for.
- **Weighting**: route weights derived from DGCA/AAI passenger traffic statistics (route market share as a proxy for expenditure share).
- **Missing-data imputation**: if a route/airline combo fails to scrape on a given cycle, impute using the last known relative price change of comparable routes rather than leaving a gap or wrongly excluding it.
- **Outlier/anomaly detection**: IQR-based filters, Z-score thresholds, or a lightweight Isolation Forest model to catch scraping errors (e.g., a ₹0 or ₹9,99,999 fare from a broken page parse) vs. genuine fare spikes.
- **Seasonal adjustment**: optional but valuable — X-13ARIMA-SEATS or simple moving-average deseasonalization so festival-season spikes don't get mistaken for structural inflation.

### 7.4 Backend & API
- Python (FastAPI or Django REST Framework) for the API layer.
- PostgreSQL for relational metadata (routes, airlines, weights).
- Redis for caching frequently-queried index values.

### 7.5 Frontend / Dashboard
- React or Next.js dashboard showing: national index trend line, route-level heatmap, airline comparison, data-quality/coverage panel.
- Charting: Recharts, D3.js, or Plotly.

### 7.6 DevOps
- Docker + Docker Compose (or Kubernetes for production scale) to containerize each scraper/service independently — important since different airline sites will need different scraping logic/update cadences.
- CI/CD (GitHub Actions) to auto-test scrapers against site-structure drift (airlines/OTAs redesign their sites often — scrapers *will* break, and you need fast detection).

---

## 8. Data Sources

**Airlines (direct):** IndiGo, Air India, Air India Express, SpiceJet, Akasa Air
**OTAs:** MakeMyTrip, Yatra, Cleartrip, ixigo, EaseMyTrip, Goibibo, Skyscanner (aggregator, useful for cross-validation)
**Reference/weighting data:** DGCA monthly domestic traffic statistics, AAI airport traffic data (both public, used to derive route weights)
**Validation baseline:** MoSPI's existing manually-collected CPI transport sub-index, and the experimental Air Services Price Index from the Office of the Economic Adviser — both useful for backtesting your index against.

---

## 9. Key Technical Challenges & Mitigations

| Challenge | Mitigation |
|---|---|
| Sites detect and block scrapers (rate limiting, bot detection, CAPTCHAs) | Respect robots.txt where possible, randomize request timing/headers, rotate proxies/user-agents, prefer official/semi-public APIs where they exist, cache aggressively to reduce request volume |
| Frequent site redesigns break parsers | Modular parser design (one parser class per source), automated daily smoke tests that alert on schema drift, visual regression checks |
| Composition bias in the index | Fixed basket + proper weighting (Section 4) — non-negotiable design principle |
| Legal/ToS considerations | Scrape only publicly visible pricing data (no login-gated content), keep request rates polite, consult airline/OTA ToS, consider reaching out for data-sharing partnerships as a stretch goal |
| Missing data from a blocked/down source | Statistical imputation + clear "data confidence" flag per index point rather than silently dropping |
| Fare volatility vs. genuine inflation signal | Aggregate over defined windows (e.g., weekly index points) and apply seasonal adjustment to separate noise from trend |
| Scale (many routes × many sources × many booking windows × multiple times/day) | Distributed task queue (Celery/Airflow), horizontal scraper scaling via containers |

---

## 10. Extra Features to Stand Out

- **Fare forecasting**: simple time-series model (Prophet/ARIMA) predicting near-term fare trends per route — useful add-on beyond the core index.
- **Consumer-facing fare alert tool**: "notify me when fares on this route drop below X" — makes the project demo-able and relatable to judges.
- **Regional/city-level CPI cross-tabs**: break the index down by originating city to mirror how MoSPI already segments CPI regionally.
- **Anomaly explainability**: when the index spikes, auto-generate a short explanation (e.g., "driven by 40% fare increase on DEL-BOM due to reduced seat availability") using the underlying route-level data.
- **Public open-data API**: expose a rate-limited public endpoint so researchers/journalists can query the index — strong "impact" talking point for judging.
- **Comparison with global airfare indices**: benchmark against BLS's US airfare CPI methodology to show international rigor.
- **Data-quality/coverage dashboard**: transparently show what % of the basket was successfully collected each cycle — this is what makes the tool trustworthy to a statistical agency.

---

## 11. Expected Outcomes / Impact

- A continuously updated, methodologically defensible **Airfare Price Index** for India, refreshed far more frequently than manual CPI collection.
- A tool MoSPI (or researchers, media, airlines, consumers) can use to see near-real-time transport-cost inflation instead of waiting for monthly releases.
- A reusable scraping + indexing framework that could, in principle, extend to other volatile-price categories in CPI (hotel rates, fuel prices, etc.) — worth mentioning in your pitch as future scope.
- Improved granularity for policymakers: route-level and city-level fare inflation visibility that the current aggregate CPI number doesn't provide.

---

## 12. Suggested Team Role Split (6-member team)

| Role | Focus |
|---|---|
| Scraping Lead | Playwright/Scrapy spiders, proxy management, anti-bot resilience |
| Data Engineer | Pipeline (Kafka/Airflow), database schema, cleaning/validation logic |
| Data Scientist / Statistician | Index methodology, weighting, imputation, anomaly detection |
| Backend Developer | API layer, auth, index computation service |
| Frontend Developer | Dashboard (React/Next.js), visualizations |
| DevOps / Presentation Lead | Docker/CI-CD, deployment, pitch deck, demo flow |

---

## 13. Suggested Demo Flow for SIH Judging

1. Show the live scraper dashboard collecting fares in real time (even a scaled-down basket of 5–10 routes is fine for demo).
2. Show the computed index trend line updating and compare it against a naive "simple average" to visually demonstrate why your weighted-index approach avoids composition bias.
3. Drill into a route-level anomaly and show the auto-flagging/explanation feature.
4. Show the public API responding with index data.
5. Close with the MoSPI-integration angle: how this could plug into or validate the existing CPI pipeline.

---

*Document prepared as a working reference for SIH26056 team ideation, SRS drafting, and pitch preparation.*
