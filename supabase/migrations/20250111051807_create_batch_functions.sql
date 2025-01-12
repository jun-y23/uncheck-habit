-- calculate_habit_statistics関数を更新して未来の習慣を除外
create or replace function public.calculate_habit_statistics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- 古い統計を削除
    delete from public.habit_daily_statistics
    where calculated_at < current_date - interval '1 day';

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
            current_date - h.start_date + 1 as total_days,
            count(hl.id) filter (where hl.status = 'achieved') as achieved_days
        from public.habits h
        left join public.habit_logs hl on h.id = hl.habit_id 
            and hl.date between h.start_date and current_date
        where not h.is_archived
            and h.start_date <= current_date
        group by h.id, h.start_date
    )
    select 
        habit_id,
        current_date,
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

-- 関数の実行権限を設定
grant execute on function public.calculate_habit_statistics to postgres, service_role;