-- src/sql/investments.sql

-- Create table if not exists
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_investments_user_id
  ON investments(user_id);

CREATE INDEX IF NOT EXISTS idx_investments_account_id
  ON investments(account_id);

-----------------------------------------------------
-- ⭐ This is the query used by the API
-----------------------------------------------------

SELECT 
  id,
  user_id,
  account_id,
  type,
  product_name,
  category,
  risk_level,
  amount_invested,
  current_value,
  cagr_3y,
  status,
  started_on,
  created_at,
  updated_at
FROM investments
WHERE user_id = $1
ORDER BY created_at DESC;
