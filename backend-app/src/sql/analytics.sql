-- Monthly income / expense per user
SELECT
  date_trunc('month', created_at) AS month,
  SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END) AS expenses
FROM transactions
WHERE user_id = $1
GROUP BY month
ORDER BY month;
