
-- QueueFlow Development Manager Account
-- Run this only for local development.

-- Enable password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create one test manager
INSERT INTO managers (
    name,
    email,
    password_hash
)
VALUES (
    'QueueFlow Manager',
    'manager@queueflow.com',
    crypt('QueueFlow@123', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;

-- Verify the manager was created
SELECT
    id,
    name,
    email,
    created_at
FROM managers
WHERE email = 'manager@queueflow.com';
s