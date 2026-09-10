-- Core Fare Quotes Table
CREATE TABLE IF NOT EXISTS fare_quotes (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    carrier VARCHAR(50) NOT NULL,
    source_site VARCHAR(50) NOT NULL,
    scrape_timestamp TIMESTAMPTZ NOT NULL,
    departure_date DATE NOT NULL,
    advance_purchase_days INTEGER NOT NULL,
    fare_class VARCHAR(30),
    base_fare NUMERIC(12,2),
    taxes_fees NUMERIC(12,2),
    total_fare NUMERIC(12,2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fare_quotes_route_date
    ON fare_quotes (origin, destination, departure_date);

CREATE INDEX IF NOT EXISTS idx_fare_quotes_route_carrier_date
    ON fare_quotes (origin, destination, carrier, departure_date);

CREATE INDEX IF NOT EXISTS idx_fare_quotes_advance_days
    ON fare_quotes (advance_purchase_days);

CREATE INDEX IF NOT EXISTS idx_fare_quotes_source_site
    ON fare_quotes (source_site, scrape_timestamp DESC);

-- Official CPI Reference Table
CREATE TABLE IF NOT EXISTS cpi_reference (
    id SERIAL PRIMARY KEY,
    period VARCHAR(30) NOT NULL,
    sub_group VARCHAR(80) NOT NULL DEFAULT 'Transport and Communication',
    index_value NUMERIC(8,2),
    inflation_rate NUMERIC(8,2),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(80) NOT NULL DEFAULT 'MoSPI CPI API'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cpi_reference_period_subgroup
    ON cpi_reference (period, sub_group);

-- Historical Airfare Price Index Table
CREATE TABLE IF NOT EXISTS index_history (
    id SERIAL PRIMARY KEY,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    base_period VARCHAR(30) NOT NULL DEFAULT '2024-01',
    current_period VARCHAR(30) NOT NULL,
    national_index NUMERIC(8,2) NOT NULL,
    coverage_percent NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    routes_covered INTEGER NOT NULL DEFAULT 0,
    total_routes_in_basket INTEGER NOT NULL DEFAULT 5,
    route_indices_json TEXT,
    airline_indices_json TEXT,
    methodology VARCHAR(100) NOT NULL DEFAULT 'Weighted Jevons / Laspeyres'
);

CREATE INDEX IF NOT EXISTS idx_index_history_calculated_at
    ON index_history (calculated_at DESC);

-- Price Anomaly & Surge Records Table
CREATE TABLE IF NOT EXISTS anomaly_records (
    id SERIAL PRIMARY KEY,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    route VARCHAR(20) NOT NULL,
    carrier VARCHAR(50),
    fare NUMERIC(12,2) NOT NULL,
    baseline_fare NUMERIC(12,2) NOT NULL,
    spike_percent NUMERIC(8,2) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    anomaly_type VARCHAR(50) NOT NULL DEFAULT 'PRICE_SURGE',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_anomaly_records_route_detected
    ON anomaly_records (route, detected_at DESC);

-- Scraper Job Audit Log Table
CREATE TABLE IF NOT EXISTS scraper_job_logs (
    id SERIAL PRIMARY KEY,
    scraper_name VARCHAR(80) NOT NULL,
    route VARCHAR(20) NOT NULL,
    advance_days INTEGER NOT NULL DEFAULT 7,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    quotes_collected INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scraper_job_logs_status_started
    ON scraper_job_logs (status, started_at DESC);
