-- Create a database function that triggers the scheduled campaign processing
CREATE OR REPLACE FUNCTION public.trigger_scheduled_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  supabase_url text := current_setting('app.settings.supabase_url', true);
  service_key text := current_setting('app.settings.service_role_key', true);
BEGIN
  -- This function will be called by pg_cron
  -- The actual processing happens in the edge function
  PERFORM
    net.http_post(
      url := 'https://sgdkyvllifjrgpogsssq.supabase.co/functions/v1/process-scheduled-campaigns',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-campaigns',
  '* * * * *',
  $$SELECT net.http_post(
    url := 'https://sgdkyvllifjrgpogsssq.supabase.co/functions/v1/process-scheduled-campaigns',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id$$
);