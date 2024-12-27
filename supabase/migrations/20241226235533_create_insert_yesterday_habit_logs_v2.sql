create or replace function insert_yesterday_habit_logs()
returns void
language plpgsql
as $$
declare
  yesterday date;
begin
  yesterday := current_date;

  insert into habit_logs (
    habit_id,
    date,
    status,
    notes,
    created_at,
    updated_at
  )
  select 
    h.id,
    yesterday,
    'achieved',
    '',
    now(),
    now()
  from habits h
  where h.frequency_type = 'daily' 
    and h.is_archived = false
    and not exists (
      select 1 
      from habit_logs l 
      where l.habit_id = h.id 
        and l.date = yesterday
    );

  -- 統計の更新を追加
  perform public.calculate_habit_statistics();

  -- バッチ実行ログの記録を追加
  insert into batch.execution_logs (
    function_name,
    success,
    error_message
  ) values (
    'insert_yesterday_habit_logs',
    true,
    null
  );

exception when others then
  -- エラーログを記録
  insert into batch.execution_logs (
    function_name,
    success,
    error_message
  ) values (
    'insert_yesterday_habit_logs',
    false,
    SQLERRM
  );
  raise;
end;
$$;

-- 実行権限を付与
grant execute on function insert_yesterday_habit_logs to postgres;
grant execute on function insert_yesterday_habit_logs to service_role;

-- cronジョブのスケジュール
SELECT cron.schedule(
    'insert-yesterday-habit-log',
    '0 1 * * *',
    $$
        SELECT public.insert_yesterday_habit_logs();
    $$
);
