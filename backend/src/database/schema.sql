
-- ==========================================
-- CASE-INSENSITIVE QUEUE NAME PROTECTION
-- ==========================================

-- Prevent the same manager from creating
-- queue names that differ only in capitalization.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_queues_manager_name_ci
ON queues (manager_id, LOWER(name));

-- ==========================================
-- QUEUEFLOW DATABASE INTEGRITY RULES
-- STEP 24.10
-- ==========================================

-- 1. Prevent empty queue names

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'queues'::regclass
          AND conname = 'queues_name_valid'
    ) THEN
        ALTER TABLE queues
        ADD CONSTRAINT queues_name_valid
        CHECK (
            LENGTH(TRIM(name)) BETWEEN 3 AND 60
        ) NOT VALID;
    END IF;
END $$;


-- 2. Validate manager information

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'managers'::regclass
          AND conname = 'managers_details_valid'
    ) THEN
        ALTER TABLE managers
        ADD CONSTRAINT managers_details_valid
        CHECK (
            LENGTH(TRIM(name)) > 0
            AND LENGTH(TRIM(email)) > 0
            AND LENGTH(password_hash) > 0
        ) NOT VALID;
    END IF;
END $$;


-- 3. Enforce consistent token states

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'tokens'::regclass
          AND conname = 'tokens_status_consistency'
    ) THEN
        ALTER TABLE tokens
        ADD CONSTRAINT tokens_status_consistency
        CHECK (
            (
                status = 'waiting'
                AND position >= 1
                AND served_at IS NULL
                AND completed_at IS NULL
                AND cancelled_at IS NULL
            )
            OR
            (
                status = 'serving'
                AND position = 0
                AND served_at IS NOT NULL
                AND completed_at IS NULL
                AND cancelled_at IS NULL
            )
            OR
            (
                status = 'completed'
                AND position = 0
                AND served_at IS NOT NULL
                AND completed_at IS NOT NULL
                AND cancelled_at IS NULL
            )
            OR
            (
                status = 'cancelled'
                AND position = 0
                AND served_at IS NULL
                AND completed_at IS NULL
                AND cancelled_at IS NOT NULL
            )
        ) NOT VALID;
    END IF;
END $$;


-- 4. Check timestamp ordering

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'tokens'::regclass
          AND conname = 'tokens_timestamp_order'
    ) THEN
        ALTER TABLE tokens
        ADD CONSTRAINT tokens_timestamp_order
        CHECK (
            (served_at IS NULL OR served_at >= created_at)
            AND
            (completed_at IS NULL OR completed_at >= served_at)
            AND
            (cancelled_at IS NULL OR cancelled_at >= created_at)
        ) NOT VALID;
    END IF;
END $$;


-- 5. Prevent duplicate manager emails
-- regardless of capitalization

CREATE UNIQUE INDEX IF NOT EXISTS
idx_managers_email_ci
ON managers (LOWER(email));


-- 6. Validate existing rows against new rules

ALTER TABLE queues
VALIDATE CONSTRAINT queues_name_valid;

ALTER TABLE managers
VALIDATE CONSTRAINT managers_details_valid;

ALTER TABLE tokens
VALIDATE CONSTRAINT tokens_status_consistency;

ALTER TABLE tokens
VALIDATE CONSTRAINT tokens_timestamp_order;


-- ==========================================
-- END OF INTEGRITY MIGRATION
-- ==========================================
