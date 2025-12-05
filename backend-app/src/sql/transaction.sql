CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  type VARCHAR(10) NOT NULL,        -- 'credit' or 'debit'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
