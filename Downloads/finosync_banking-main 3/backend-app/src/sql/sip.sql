CREATE TABLE IF NOT EXISTS sip_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fund_name VARCHAR(255) NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  sip_day INTEGER NOT NULL,                    -- 1–28
  frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  start_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sip_user ON sip_subscriptions(user_id);
