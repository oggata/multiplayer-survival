-- Neonデータベースのテーブル作成スクリプト
-- このスクリプトをNeonのSQLエディタで実行してください

-- game_resultsテーブルの作成
CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    survival_time BIGINT NOT NULL, -- ミリ秒単位の生存時間
    survival_time_formatted VARCHAR(100) NOT NULL, -- フォーマット済み生存時間
    killed_enemies INTEGER DEFAULT 0, -- 倒した敵数
    score INTEGER DEFAULT 0, -- スコア
    insert_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_score ON game_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_results_survival_time ON game_results(survival_time DESC);
CREATE INDEX IF NOT EXISTS idx_game_results_insert_time ON game_results(insert_time DESC);

-- ユーザー別の最高スコアを取得するビューの作成（オプション）
CREATE OR REPLACE VIEW user_best_scores AS
SELECT DISTINCT ON (user_id)
    user_id,
    user_name,
    survival_time,
    survival_time_formatted,
    killed_enemies,
    score,
    insert_time
FROM game_results
ORDER BY user_id, score DESC, survival_time DESC;

-- 統計情報を取得するビューの作成（オプション）
CREATE OR REPLACE VIEW game_statistics AS
SELECT 
    COUNT(*) as total_games,
    COUNT(DISTINCT user_id) as unique_players,
    AVG(survival_time) as avg_survival_time,
    MAX(survival_time) as max_survival_time,
    AVG(killed_enemies) as avg_killed_enemies,
    MAX(killed_enemies) as max_killed_enemies,
    AVG(score) as avg_score,
    MAX(score) as max_score
FROM game_results;

-- コメントの追加
COMMENT ON TABLE game_results IS 'ゲーム結果を保存するテーブル';
COMMENT ON COLUMN game_results.user_id IS 'ユーザーID（一意）';
COMMENT ON COLUMN game_results.user_name IS 'ユーザー名';
COMMENT ON COLUMN game_results.survival_time IS '生存時間（ミリ秒）';
COMMENT ON COLUMN game_results.survival_time_formatted IS 'フォーマット済み生存時間';
COMMENT ON COLUMN game_results.killed_enemies IS '倒した敵数';
COMMENT ON COLUMN game_results.score IS 'スコア（生存時間 + 敵撃破ボーナス）';
COMMENT ON COLUMN game_results.insert_time IS 'レコード作成日時';
COMMENT ON COLUMN game_results.update_time IS 'レコード更新日時'; 