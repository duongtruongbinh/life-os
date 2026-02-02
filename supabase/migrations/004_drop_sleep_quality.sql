-- Remove sleep_quality column (feature removed)
alter table daily_logs drop column if exists sleep_quality;
