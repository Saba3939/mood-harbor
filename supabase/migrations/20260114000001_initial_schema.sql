-- Mood Harbor - Initial Database Schema
-- このマイグレーションはプロジェクトの基本データベーススキーマを構築します

-- profiles テーブル
-- ユーザープロフィール情報を管理
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(10) NOT NULL,
  avatar_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_nickname ON profiles(nickname);

COMMENT ON TABLE profiles IS 'ユーザープロフィール情報';
COMMENT ON COLUMN profiles.user_id IS 'auth.usersテーブルへの外部キー';
COMMENT ON COLUMN profiles.nickname IS 'ニックネーム（最大10文字）';
COMMENT ON COLUMN profiles.avatar_id IS 'アバターID（プリセット選択）';

-- daily_questions テーブル
-- 日替わり質問のマスターデータ
CREATE TABLE daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL CHECK (array_length(options, 1) >= 3 AND array_length(options, 1) <= 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_questions_category ON daily_questions(category);

COMMENT ON TABLE daily_questions IS '日替わり質問マスターデータ';
COMMENT ON COLUMN daily_questions.category IS '質問カテゴリー（connection, activity, achievement, feeling, weekend, sunday）';
COMMENT ON COLUMN daily_questions.question_text IS '質問テキスト';
COMMENT ON COLUMN daily_questions.options IS '選択肢（3-4個）';

-- mood_records テーブル
-- ユーザーの気分記録を保存
CREATE TABLE mood_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_level INT NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
  reasons TEXT[] NOT NULL CHECK (array_length(reasons, 1) <= 2),
  question_id UUID NOT NULL REFERENCES daily_questions(id),
  answer_option VARCHAR(100) NOT NULL,
  memo VARCHAR(10),
  time_of_day VARCHAR(20),
  weather VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mood_records_user_id ON mood_records(user_id);
CREATE INDEX idx_mood_records_created_at ON mood_records(created_at DESC);
CREATE INDEX idx_mood_records_user_created ON mood_records(user_id, created_at DESC);

COMMENT ON TABLE mood_records IS 'ユーザーの気分記録';
COMMENT ON COLUMN mood_records.mood_level IS '気分レベル（1: とても疲れた 〜 5: とても良い）';
COMMENT ON COLUMN mood_records.reasons IS '理由カテゴリー（最大2つ）';
COMMENT ON COLUMN mood_records.question_id IS '日替わり質問への参照';
COMMENT ON COLUMN mood_records.answer_option IS '質問への回答';
COMMENT ON COLUMN mood_records.memo IS 'メモ（最大10文字、オプション）';
COMMENT ON COLUMN mood_records.time_of_day IS '時間帯（morning, afternoon, evening, night）';
COMMENT ON COLUMN mood_records.weather IS '天気（sunny, cloudy, rainy, other）';

-- shares テーブル
-- ハーバーへのシェア投稿
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_record_id UUID NOT NULL REFERENCES mood_records(id) ON DELETE CASCADE,
  share_type VARCHAR(50) NOT NULL,
  feeling VARCHAR(50) NOT NULL,
  message VARCHAR(10),
  reaction_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_shares_share_type ON shares(share_type);
CREATE INDEX idx_shares_expires_at ON shares(expires_at);
CREATE INDEX idx_shares_created_at ON shares(created_at DESC);
CREATE INDEX idx_shares_user_id ON shares(user_id);

COMMENT ON TABLE shares IS 'ハーバーへのシェア投稿';
COMMENT ON COLUMN shares.share_type IS 'シェアタイプ（support_needed, joy_share, achievement）';
COMMENT ON COLUMN shares.feeling IS '気持ちの選択（シェアタイプごとに異なる）';
COMMENT ON COLUMN shares.message IS '一言メッセージ（最大10文字、オプション）';
COMMENT ON COLUMN shares.reaction_count IS '応援数（キャッシュ値）';
COMMENT ON COLUMN shares.expires_at IS '有効期限（created_at + 24時間）';

-- reactions テーブル
-- シェア投稿への応援
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  stamp_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, share_id)
);

CREATE INDEX idx_reactions_share_id ON reactions(share_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_created_at ON reactions(created_at DESC);

COMMENT ON TABLE reactions IS 'シェア投稿への応援（スタンプ）';
COMMENT ON COLUMN reactions.stamp_type IS 'スタンプタイプ（シェアタイプごとに異なる6種類）';
COMMENT ON CONSTRAINT reactions_user_id_share_id_key ON reactions IS '1ユーザーが同じ投稿に複数回応援できない制約';

-- notification_settings テーブル
-- ユーザーの通知設定
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  record_reminder_enabled BOOLEAN DEFAULT TRUE,
  record_reminder_time TIME DEFAULT '21:00',
  reaction_notification_mode VARCHAR(20) DEFAULT 'realtime' CHECK (reaction_notification_mode IN ('realtime', 'summary', 'off')),
  quiet_mode_enabled BOOLEAN DEFAULT FALSE,
  quiet_mode_start TIME,
  quiet_mode_end TIME,
  pause_until TIMESTAMPTZ
);

COMMENT ON TABLE notification_settings IS 'ユーザーの通知設定';
COMMENT ON COLUMN notification_settings.record_reminder_enabled IS '記録リマインダーの有効化';
COMMENT ON COLUMN notification_settings.record_reminder_time IS '記録リマインダーの時刻（デフォルト21:00）';
COMMENT ON COLUMN notification_settings.reaction_notification_mode IS '応援通知モード（realtime, summary, off）';
COMMENT ON COLUMN notification_settings.quiet_mode_enabled IS 'おやすみモードの有効化';
COMMENT ON COLUMN notification_settings.quiet_mode_start IS 'おやすみモード開始時刻';
COMMENT ON COLUMN notification_settings.quiet_mode_end IS 'おやすみモード終了時刻';
COMMENT ON COLUMN notification_settings.pause_until IS '通知一時停止期限';

-- updated_atカラムの自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profilesテーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- mood_recordsテーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_mood_records_updated_at
  BEFORE UPDATE ON mood_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- reactions追加時にsharesのreaction_countを自動更新する関数
CREATE OR REPLACE FUNCTION increment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shares
  SET reaction_count = reaction_count + 1
  WHERE id = NEW.share_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- reactions削除時にsharesのreaction_countを自動更新する関数
CREATE OR REPLACE FUNCTION decrement_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shares
  SET reaction_count = reaction_count - 1
  WHERE id = OLD.share_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- reactionsテーブルのreaction_count自動更新トリガー（追加時）
CREATE TRIGGER increment_share_reaction_count
  AFTER INSERT ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_reaction_count();

-- reactionsテーブルのreaction_count自動更新トリガー（削除時）
CREATE TRIGGER decrement_share_reaction_count
  AFTER DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION decrement_reaction_count();
