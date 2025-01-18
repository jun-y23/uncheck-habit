create or replace function public.calculate_habit_statistics()
returns void
language plpgsql
security definer
set search_path = public
set timezone = 'Asia/Tokyo'  -- タイムゾーンを明示的に設定
as $$
declare
  current_jst date;  -- 日本時間の日付を保持する変数
begin
    -- 日本時間の現在日付を取得
    current_jst := (current_timestamp at time zone 'Asia/Tokyo')::date;

    -- 古い統計を削除（日本時間ベース）
    delete from public.habit_daily_statistics
    where calculated_at < current_jst - interval '1 day';

    -- 新しい統計を挿入
    insert into public.habit_daily_statistics (
        habit_id,
        calculated_at,
        total_days,
        achieved_days,
        achievement_rate
    )
    with habit_stats as (
        select 
            h.id as habit_id,
            current_jst - h.start_date + 1 as total_days,
            count(hl.id) filter (where hl.status = 'achieved') as achieved_days
        from public.habits h
        left join public.habit_logs hl on h.id = hl.habit_id 
            and hl.date between h.start_date and current_jst
        where not h.is_archived
            and h.start_date <= current_jst
        group by h.id, h.start_date
    )
    select 
        habit_id,
        current_jst,  -- current_dateの代わりにcurrent_jstを使用
        total_days,
        achieved_days,
        case 
            when total_days > 0 then 
                round((achieved_days::numeric / total_days) * 100, 2)
            else 0 
        end as achievement_rate
    from habit_stats
    on conflict (habit_id, calculated_at) 
    do update set
        total_days = excluded.total_days,
        achieved_days = excluded.achieved_days,
        achievement_rate = excluded.achievement_rate;

    -- ログ記録
    insert into batch.execution_logs (
        function_name,
        success,
        error_message
    ) values (
        'calculate_habit_statistics',
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
        'calculate_habit_statistics',
        false,
        sqlerrm
    );
    raise;
end;
$$;