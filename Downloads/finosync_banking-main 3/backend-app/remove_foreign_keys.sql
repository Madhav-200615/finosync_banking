-- Remove foreign key constraints
-- Run this in pgAdmin on finosync database

ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey;
ALTER TABLE sip_subscriptions DROP CONSTRAINT IF EXISTS sip_subscriptions_user_id_fkey;

-- Verify constraints removed
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('investments', 'sip_subscriptions')
AND tc.constraint_type = 'FOREIGN KEY';
