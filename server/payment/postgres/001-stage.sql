-- Isolated STAGE schema only. Does not import or mutate any other project's data.
CREATE SCHEMA IF NOT EXISTS railway_payment_stage;
SET LOCAL search_path=railway_payment_stage,pg_catalog;
CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY CHECK(version=1));
CREATE TABLE IF NOT EXISTS subjects(id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, puzzles INTEGER NOT NULL CHECK(puzzles BETWEEN 0 AND 10));
    CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, name TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>=0), available INTEGER NOT NULL CHECK(available>=0), enabled INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id), product_id TEXT NOT NULL REFERENCES products(id), product_name TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'TWD', payment TEXT NOT NULL, reservation TEXT NOT NULL, pickup TEXT NOT NULL DEFAULT 'not_ready', refund TEXT NOT NULL DEFAULT 'none', expires_at BIGINT NOT NULL, created_at BIGINT NOT NULL, request_key TEXT NOT NULL, trade_no TEXT UNIQUE, UNIQUE(subject_id,request_key));
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_order ON orders(subject_id) WHERE reservation IN ('held','confirmed');
    CREATE TABLE IF NOT EXISTS claims(subject_id TEXT PRIMARY KEY REFERENCES subjects(id), order_id TEXT UNIQUE NOT NULL REFERENCES orders(id));
    CREATE TABLE IF NOT EXISTS query_attempts(order_id TEXT PRIMARY KEY REFERENCES orders(id), attempted_at BIGINT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(event_hash TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), kind TEXT NOT NULL, received_at BIGINT NOT NULL);
  
INSERT INTO schema_version(version) VALUES(1) ON CONFLICT DO NOTHING;
