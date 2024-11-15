-- habitsテーブルのポリシー
DO $$ 
BEGIN
    -- 既存のポリシーを削除（同名のポリシーがある場合）
    DROP POLICY IF EXISTS "Service role can do all" ON public.habits;
    
    -- サービスロール用の新しいポリシーを作成
    CREATE POLICY "Service role can do all" ON public.habits
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;

-- habit_logsテーブルのポリシー
DO $$ 
BEGIN
    -- 既存のポリシーを削除（同名のポリシーがある場合）
    DROP POLICY IF EXISTS "Service role can do all" ON public.habit_logs;
    
    -- サービスロール用の新しいポリシーを作成
    CREATE POLICY "Service role can do all" ON public.habit_logs
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
END $$;
