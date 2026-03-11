
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS open_time text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS close_time text NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS weekend_open_time text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS weekend_close_time text NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS working_days jsonb NOT NULL DEFAULT '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":true,"sun":false}'::jsonb;
