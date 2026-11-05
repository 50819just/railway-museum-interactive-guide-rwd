-- Additive, independent STAGE photo-payment data. No images, credentials, or raw callback bodies.
CREATE TABLE IF NOT EXISTS railway_payment_stage.print_slots (
 id TEXT PRIMARY KEY, starts_at BIGINT NOT NULL, capacity INTEGER NOT NULL CHECK(capacity>=0), available INTEGER NOT NULL CHECK(available>=0 AND available<=capacity)
);
CREATE TABLE IF NOT EXISTS railway_payment_stage.print_orders (
 id TEXT PRIMARY KEY CHECK(id ~ '^RP[A-Za-z0-9]{18}$'), subject_id TEXT NOT NULL REFERENCES railway_payment_stage.subjects(id),
 layout TEXT NOT NULL CHECK(layout IN ('polaroid','pair')), quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 3),
 slot_id TEXT NOT NULL REFERENCES railway_payment_stage.print_slots(id), product_name TEXT NOT NULL,
 amount INTEGER NOT NULL CHECK(amount>0), currency TEXT NOT NULL DEFAULT 'TWD' CHECK(currency='TWD'),
 payment TEXT NOT NULL DEFAULT 'pending' CHECK(payment IN ('pending','paid','failed')),
 reservation TEXT NOT NULL DEFAULT 'held' CHECK(reservation IN ('held','confirmed','cancelled','expired','failed','exception')),
 fulfillment TEXT NOT NULL DEFAULT 'not_sent' CHECK(fulfillment IN ('not_sent','blocked')),
 refund TEXT NOT NULL DEFAULT 'none' CHECK(refund IN ('none','requested','review_required')),
 expires_at BIGINT NOT NULL, created_at BIGINT NOT NULL, request_key TEXT NOT NULL, trade_no TEXT UNIQUE,
 return_token_hash TEXT, return_expires_at BIGINT, UNIQUE(subject_id,request_key)
);
CREATE TABLE IF NOT EXISTS railway_payment_stage.print_events (
 event_hash TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES railway_payment_stage.print_orders(id), kind TEXT NOT NULL, received_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS railway_payment_stage.print_query_attempts (
 order_id TEXT PRIMARY KEY REFERENCES railway_payment_stage.print_orders(id), attempted_at BIGINT NOT NULL
);
