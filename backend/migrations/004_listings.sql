CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    price           DECIMAL(12,2),
    currency        VARCHAR(3) NOT NULL DEFAULT 'RUB',
    type            VARCHAR(20) NOT NULL DEFAULT 'material', -- material | service | other
    region_id       UUID REFERENCES regions(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active | hidden | moderated
    contact_phone   VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_region_id ON listings(region_id);