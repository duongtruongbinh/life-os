-- Add completed_at to track WHEN a task was finished
alter table tasks add column if not exists completed_at timestamptz;

-- Backfill: For existing completed tasks, set completed_at to created_at (best guess)
update tasks set completed_at = created_at where is_completed = true and completed_at is null;
