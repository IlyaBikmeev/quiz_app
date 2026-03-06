-- Add started_at (moment of creation) and completed_at (null = attempt not completed)
ALTER TABLE attempts ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE attempts ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Backfill: treat current state as of migration
UPDATE attempts SET started_at = NOW() WHERE started_at IS NULL;
UPDATE attempts SET completed_at = NOW() WHERE completed = TRUE;

ALTER TABLE attempts ALTER COLUMN started_at SET NOT NULL;
ALTER TABLE attempts DROP COLUMN completed;
