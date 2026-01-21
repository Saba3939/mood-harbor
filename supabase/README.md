# Supabase Database Setup

このディレクトリにはMood Harborアプリケーションのデータベーススキーマとマイグレーションが含まれています。

## ディレクトリ構成

```
supabase/
├── config.toml                    # Supabase設定ファイル
├── migrations/                    # データベースマイグレーション
│   ├── 20260114000001_initial_schema.sql    # 初期スキーマ
│   └── 20260114000002_rls_policies.sql      # RLSポリシー
└── README.md                      # このファイル
```

## セットアップ手順

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
# または
brew install supabase/tap/supabase
```

### 2. Supabaseプロジェクトの初期化

既存のSupabaseプロジェクトがある場合:

```bash
# Supabaseプロジェクトにリンク
supabase link --project-ref your-project-ref

# プロジェクトの資格情報を確認
supabase status
```

新規プロジェクトの場合:

```bash
# Supabaseダッシュボードで新規プロジェクトを作成
# https://app.supabase.com/

# プロジェクトIDを取得してリンク
supabase link --project-ref your-project-ref
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、Supabase接続情報を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Supabaseダッシュボードの「Settings」→「API」から取得できます。

### 4. マイグレーションの実行

```bash
# ローカルでマイグレーションをテスト
supabase db reset

# 本番環境にマイグレーションを適用
supabase db push
```

### 5. マイグレーション内容の確認

#### 20260114000001_initial_schema.sql

以下のテーブルを作成:
- `profiles`: ユーザープロフィール
- `mood_records`: 気分記録
- `daily_questions`: 日替わり質問マスター
- `shares`: ハーバー投稿
- `reactions`: 応援（スタンプ）
- `notification_settings`: 通知設定

各テーブルには適切なインデックスと外部キー制約が設定されています。

#### 20260114000002_rls_policies.sql

Row Level Security (RLS)ポリシーを適用:
- ユーザーは自分のデータのみアクセス可能
- シェア投稿は認証済みユーザー全員が閲覧可能（有効期限内）
- 日替わり質問は認証済みユーザー全員が閲覧可能

## ローカル開発

ローカルでSupabaseを起動:

```bash
# Dockerが必要です
supabase start

# 以下のURLでアクセス可能
# - API URL: http://localhost:54321
# - Studio: http://localhost:54323
# - PostgreSQL: postgresql://postgres:postgres@localhost:54322/postgres
```

ローカル環境の停止:

```bash
supabase stop
```

## マイグレーションの追加

新しいマイグレーションを作成:

```bash
supabase migration new migration_name

# 生成されたファイルにSQLを記述
# supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql
```

## テストデータの投入

日替わり質問のマスターデータを投入する場合:

```bash
# マイグレーションファイルを作成
supabase migration new seed_daily_questions

# SQLでINSERT文を記述
```

## トラブルシューティング

### マイグレーションエラー

```bash
# マイグレーション履歴を確認
supabase migration list

# 特定のマイグレーションまでロールバック
supabase db reset --version 20260114000001
```

### RLSポリシーのテスト

```sql
-- 認証済みユーザーとしてテスト
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';

-- クエリを実行
SELECT * FROM profiles WHERE user_id = 'user-uuid';

-- ロールをリセット
RESET ROLE;
```

## 本番環境へのデプロイ

1. Supabaseダッシュボードでプロジェクトを作成
2. `.env.local`に本番環境の資格情報を設定
3. マイグレーションを適用: `supabase db push`
4. Google OAuth認証を有効化（Supabaseダッシュボード → Authentication → Providers）
5. 許可されたリダイレクトURLを設定（Settings → Auth → URL Configuration）

## セキュリティ考慮事項

- **RLS**: すべてのテーブルでRow Level Securityが有効化されています
- **認証**: Supabase Authによる認証必須
- **HTTPS**: 本番環境では必ずHTTPS通信を使用
- **環境変数**: `.env.local`をGitにコミットしないこと（`.gitignore`に追加済み）

## 参考資料

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
