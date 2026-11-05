-- Isolated public test checkouts, never real entitlements. No photos or plaintext capabilities.
CREATE TABLE IF NOT EXISTS railway_payment_stage.public_demo_checkouts (
 request_hash TEXT PRIMARY KEY, input_hash TEXT NOT NULL,
 subject_id TEXT UNIQUE NOT NULL REFERENCES railway_payment_stage.subjects(id),
 kind TEXT NOT NULL CHECK(kind IN ('print','gift')), order_id TEXT UNIQUE,
 created_at BIGINT NOT NULL, return_token_hash TEXT, return_expires_at BIGINT
);
CREATE INDEX IF NOT EXISTS public_demo_created_at ON railway_payment_stage.public_demo_checkouts(created_at);
