-- Add target_sleep_hours to user_settings
alter table user_settings add column if not exists target_sleep_hours int default 8;
