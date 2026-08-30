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

CREATE INDEX IF NOT EXISTS idx_fare_quotes_source_site
    ON fare_quotes (source_site, scrape_timestamp DESC);
