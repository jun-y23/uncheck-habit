select cron.unschedule('insert-yesterday-habit-log');

select cron.schedule(
    'insert-yesterday-habit-log',
    '0 16 * * *',  -- UTC 16:00 = JST 01:00
    $$
        select public.insert_yesterday_habit_logs();
    $$
);