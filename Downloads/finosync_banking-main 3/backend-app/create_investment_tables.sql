-- Create investment-related tables for FastBank
-- Run with: psql -U postgres -d fastbank -f create_investment_tables.sql

-- 1. Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  risk_level VARCHAR(30),
  amount_invested NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  cagr_3y NUMERIC(5,2),
  status VARCHAR(30) DEFAULT 'ACTIVE',
  started_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_account_id ON investments(account_id);

-- 2. Create SIP subscriptions table
CREATE TABLE IF NOT EXISTS sip_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  sip_day INTEGER NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  start_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sip_user ON sip_subscriptions(user_id);

-- Display success message
SELECT 'Investment tables created successfully!' AS status;
