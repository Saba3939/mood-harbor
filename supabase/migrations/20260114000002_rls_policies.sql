-- Mood Harbor - Row Level Security (RLS) Policies
-- このマイグレーションはすべてのテーブルにRow Level Securityポリシーを適用します

-- RLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- profiles テーブルのRLSポリシー
-- ========================================

-- ユーザーは自分のプロフィールのみ読み取り可能
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- mood_records テーブルのRLSポリシー
-- ========================================

-- ユーザーは自分の気分記録のみ読み取り可能
CREATE POLICY "Users can view their own mood records"
  ON mood_records FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の気分記録のみ作成可能
CREATE POLICY "Users can create their own mood records"
  ON mood_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の気分記録のみ更新可能
CREATE POLICY "Users can update their own mood records"
  ON mood_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の気分記録のみ削除可能
CREATE POLICY "Users can delete their own mood records"
  ON mood_records FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- daily_questions テーブルのRLSポリシー
-- ========================================

-- すべての認証済みユーザーが日替わり質問を読み取り可能
CREATE POLICY "Authenticated users can view daily questions"
  ON daily_questions FOR SELECT
  TO authenticated
  USING (true);

-- 日替わり質問の作成・更新・削除は管理者のみ（将来的に実装）
-- 現時点ではマイグレーションで直接データ投入

-- ========================================
-- shares テーブルのRLSポリシー
-- ========================================

-- ユーザーは自分のシェアのみ読み取り可能（プライバシー設定確認用）
CREATE POLICY "Users can view their own shares"
  ON shares FOR SELECT
  USING (auth.uid() = user_id);

-- 認証済みユーザーは公開されたシェアを読み取り可能
-- プライバシー設定で「公開しない」を選択していないユーザーのシェアのみ表示
CREATE POLICY "Authenticated users can view public shares"
  ON shares FOR SELECT
  TO authenticated
  USING (
    -- 有効期限内のシェアのみ表示
    expires_at > NOW()
    AND
    -- プライバシー設定で「公開しない」を選択していないユーザーのシェア
    -- （将来的にprivacy_settingsテーブルと連携）
    true
  );

-- ユーザーは自分のシェアのみ作成可能
CREATE POLICY "Users can create their own shares"
  ON shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のシェアのみ削除可能
CREATE POLICY "Users can delete their own shares"
  ON shares FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- reactions テーブルのRLSポリシー
-- ========================================

-- ユーザーは自分の応援のみ読み取り可能
CREATE POLICY "Users can view their own reactions"
  ON reactions FOR SELECT
  USING (auth.uid() = user_id);

-- 認証済みユーザーは応援を読み取り可能（投稿者が応援一覧を確認するため）
CREATE POLICY "Authenticated users can view reactions on shares"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    -- 自分の投稿への応援を表示
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.id = reactions.share_id
      AND shares.user_id = auth.uid()
    )
  );

-- ユーザーは応援を作成可能（自己応援チェックはアプリケーション層で実施）
CREATE POLICY "Users can create reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の応援のみ削除可能（30秒以内の取り消し）
CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- notification_settings テーブルのRLSポリシー
-- ========================================

-- ユーザーは自分の通知設定のみ読み取り可能
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の通知設定のみ作成可能
CREATE POLICY "Users can create their own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の通知設定のみ更新可能
CREATE POLICY "Users can update their own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の通知設定のみ削除可能
CREATE POLICY "Users can delete their own notification settings"
  ON notification_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- プライバシー設定用のヘルパー関数（将来的に拡張）
-- ========================================

-- ユーザーが投稿を公開しているかチェックする関数
-- 将来的にprivacy_settingsテーブルと連携
CREATE OR REPLACE FUNCTION is_user_sharing_enabled(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 現時点ではすべてのユーザーが公開設定
  -- 将来的にprivacy_settingsテーブルから取得
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_user_sharing_enabled IS 'ユーザーがシェア機能を有効化しているかチェック（将来的に拡張）';
