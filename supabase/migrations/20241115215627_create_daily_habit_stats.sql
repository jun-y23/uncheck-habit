-- スーパーユーザー権限で実行する関数を作成
CREATE OR REPLACE FUNCTION install_extensions()
RETURNS VOID AS $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA cron;
END;
$$ LANGUAGE plpgsql;
SELECT install_extensions();

-- バッチ実行用のスキーマを作成
CREATE SCHEMA IF NOT EXISTS batch;

-- 必要な権限を付与
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA cron TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres, service_role;
GRANT USAGE ON SCHEMA batch TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA batch TO postgres, service_role;

-- バッチ実行ログテーブル
CREATE TABLE IF NOT EXISTS batch.execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    error_message TEXT
);

-- 統計情報テーブル
CREATE TABLE IF NOT EXISTS public.habit_daily_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    calculated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    total_days INTEGER NOT NULL,
    achieved_days INTEGER NOT NULL,
    achievement_rate NUMERIC(5,2) NOT NULL,
    UNIQUE(habit_id, calculated_at)
);

-- テーブルの権限を設定
ALTER TABLE public.habit_daily_statistics ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.habit_daily_statistics TO postgres, service_role;
GRANT SELECT ON public.habit_daily_statistics TO authenticated;

-- 統計計算関数
CREATE OR REPLACE FUNCTION public.calculate_habit_statistics()
RETURNS void AS $$
BEGIN
    -- 古い統計を削除
    DELETE FROM public.habit_daily_statistics
    WHERE calculated_at < CURRENT_DATE - INTERVAL '1 day';

    -- 新しい統計を挿入
    INSERT INTO public.habit_daily_statistics (
        habit_id,
        calculated_at,
        total_days,
        achieved_days,
        achievement_rate
    )
    WITH habit_stats AS (
        SELECT 
            h.id as habit_id,
            CURRENT_DATE - h.start_date + 1 as total_days,
            COUNT(hl.id) FILTER (WHERE hl.status = 'achieved') as achieved_days
        FROM public.habits h
        LEFT JOIN public.habit_logs hl ON h.id = hl.habit_id 
            AND hl.date BETWEEN h.start_date AND CURRENT_DATE
        WHERE NOT h.is_archived
        GROUP BY h.id, h.start_date
    )
    SELECT 
        habit_id,
        CURRENT_DATE,
        total_days,
        achieved_days,
        CASE 
            WHEN total_days > 0 THEN 
                ROUND((achieved_days::numeric / total_days) * 100, 2)
            ELSE 0 
        END as achievement_rate
    FROM habit_stats
    ON CONFLICT (habit_id, calculated_at) 
    DO UPDATE SET
        total_days = EXCLUDED.total_days,
        achieved_days = EXCLUDED.achieved_days,
        achievement_rate = EXCLUDED.achievement_rate;

    -- ログ記録
    INSERT INTO batch.execution_logs (
        function_name,
        success,
        error_message
    ) VALUES (
        'calculate_habit_statistics',
        true,
        NULL
    );

EXCEPTION WHEN OTHERS THEN
    -- エラーログを記録
    INSERT INTO batch.execution_logs (
        function_name,
        success,
        error_message
    ) VALUES (
        'calculate_habit_statistics',
        false,
        SQLERRM
    );
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の実行権限を設定
GRANT EXECUTE ON FUNCTION public.calculate_habit_statistics TO postgres, service_role;

-- cronジョブのスケジュール
SELECT cron.schedule(
    'daily-habit-stats',
    '0 2 * * *',
    $$
        SELECT public.calculate_habit_statistics();
    $$
);

-- RLSポリシー
CREATE POLICY "Users can view their own habit statistics" 
    ON public.habit_daily_statistics
    FOR SELECT
    TO authenticated
    USING (
        habit_id IN (
            SELECT id FROM public.habits 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all statistics" 
    ON public.habit_daily_statistics
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 統計ビュー
CREATE OR REPLACE VIEW public.habit_statistics_view AS
SELECT 
    h.id,
    h.name,
    h.start_date,
    h.user_id,
    h.is_archived,
    COALESCE(s.total_days, 0) as total_days,
    COALESCE(s.achieved_days, 0) as achieved_days,
    COALESCE(s.achievement_rate, 0) as achievement_rate,
    s.calculated_at
FROM public.habits h
LEFT JOIN public.habit_daily_statistics s 
    ON h.id = s.habit_id 
    AND s.calculated_at = CURRENT_DATE
WHERE NOT h.is_archived
AND auth.uid() = user_id;

-- ビューの権限設定
GRANT SELECT ON public.habit_statistics_view TO authenticated, service_role;