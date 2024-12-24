create or replace function public.delete_user_data()
returns void
language plpgsql
security definer
as $$
declare
  _user_id uuid;
begin
  -- 現在のユーザーIDを取得
  _user_id := auth.uid();
  
  -- habitテーブルに関連する統計データを削除
  delete from public.habit_daily_statistics
  where habit_id in (
    select id from public.habits where user_id = _user_id
  );
  
  -- habitテーブルに関連するログを削除
  delete from public.habit_logs
  where habit_id in (
    select id from public.habits where user_id = _user_id
  );
  
  -- ユーザーの習慣データを削除
  delete from public.habits
  where user_id = _user_id;
  
  -- authユーザーを無効化
  update auth.users
  set raw_app_meta_data = 
    jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{disabled}',
      'true'
    )
  where id = _user_id;
end;
$$;

-- 実行権限を付与
grant execute on function public.delete_user_data to authenticated;