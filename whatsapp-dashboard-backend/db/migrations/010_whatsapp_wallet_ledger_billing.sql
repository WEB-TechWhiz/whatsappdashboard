-- F10 & F11: Wallet, Immutable Ledger, and Top-up Billing Schema

-- 1. Wallets Table: Maintains tenant monetary balance
CREATE TABLE IF NOT EXISTS whatsapp_wallets (
  workspace_id            UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  balance                 NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
  currency                TEXT NOT NULL DEFAULT 'USD',
  low_balance_threshold   NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
  auto_recharge_enabled   BOOLEAN NOT NULL DEFAULT false,
  auto_recharge_amount    NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_wallets_balance_non_negative CHECK (balance >= 0.0000)
);

-- 2. Ledger Table: Immutable log of financial transactions (No direct balance mutations allowed)
CREATE TABLE IF NOT EXISTS whatsapp_ledger (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  amount            NUMERIC(12, 4) NOT NULL, -- Positive for credits/topups, negative for debits
  balance_after     NUMERIC(12, 4) NOT NULL,
  entry_type        TEXT NOT NULL,          -- 'TOPUP', 'DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT'
  reference_id      TEXT,                   -- e.g. message_usage_id or billing_transaction_id
  reference_type    TEXT,                   -- 'MESSAGE_USAGE', 'PAYMENT_TRANSACTION', 'ADMIN_ADJUSTMENT'
  description       TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_ledger_type_check
    CHECK (entry_type IN ('TOPUP', 'DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT'))
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_ledger_workspace_time
  ON whatsapp_ledger (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_ledger_reference
  ON whatsapp_ledger (workspace_id, reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- 3. Billing Transactions Table: Idempotent payment gateway tracking
CREATE TABLE IF NOT EXISTS whatsapp_billing_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL DEFAULT 'RAZORPAY', -- 'RAZORPAY', 'STRIPE', 'MANUAL'
  provider_payment_id   TEXT UNIQUE,
  provider_order_id     TEXT,
  amount                NUMERIC(12, 2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'USD',
  status                TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING', 'COMPLETED', 'FAILED'
  raw_payload           JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_billing_status_check
    CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_billing_tx_workspace
  ON whatsapp_billing_transactions (workspace_id, created_at DESC);
