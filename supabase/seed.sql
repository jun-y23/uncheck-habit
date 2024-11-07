-- habitテンプレートの投入
INSERT INTO public.habit_templates (name, default_frequency_type) 
VALUES
    ('ランニング', 'daily'),
    ('読書', 'daily'),
    ('瞑想', 'daily'),
    ('散歩', 'daily'),
    ('ヨガ', 'daily'),
    ('水分補給', 'daily'),
    ('朝食を食べる', 'daily'),
    ('早寝早起き', 'daily'),
    ('勉強', 'daily'),
    ('ストレッチ', 'daily')
ON CONFLICT (id) DO NOTHING;
