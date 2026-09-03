-- F9 Pricing Engine Schema
-- Configurable, effective-dated pricing rates for WhatsApp message categories across countries.

CREATE TABLE IF NOT EXISTS whatsapp_pricing_rates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code      TEXT NOT NULL DEFAULT 'DEFAULT', -- ISO country code e.g. 'US', 'IN', 'GB', or 'DEFAULT'
  currency          TEXT NOT NULL DEFAULT 'USD',
  message_category  TEXT NOT NULL,                  -- 'MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE', 'UNKNOWN'
  rate              NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
  provider          TEXT NOT NULL DEFAULT 'META',
  effective_from    TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_pricing_rates_category_check
    CHECK (message_category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE', 'UNKNOWN')),
  CONSTRAINT whatsapp_pricing_rates_rate_check
    CHECK (rate >= 0)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_pricing_rates_lookup
  ON whatsapp_pricing_rates (country_code, message_category, effective_from DESC);

-- Seed baseline default rates (Meta typical tier approximations)
INSERT INTO whatsapp_pricing_rates (country_code, currency, message_category, rate, provider)
VALUES
  ('DEFAULT', 'USD', 'MARKETING', 0.0250, 'META'),
  ('DEFAULT', 'USD', 'UTILITY', 0.0150, 'META'),
  ('DEFAULT', 'USD', 'AUTHENTICATION', 0.0100, 'META'),
  ('DEFAULT', 'USD', 'SERVICE', 0.0050, 'META'),
  ('DEFAULT', 'USD', 'UNKNOWN', 0.0100, 'META')
ON CONFLICT DO NOTHING;
