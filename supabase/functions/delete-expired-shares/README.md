# delete-expired-shares Supabase Function

## 概要

期限切れシェア（`expires_at < NOW()`）を自動的に削除するSupabase Functionです。削除前にユーザーへ応援数を含む通知を送信し、Realtime経由で`share:deleted`イベントをブロードキャストします。

## 機能

1. **期限切れシェアの検出と削除**
   - `shares`テーブルから`expires_at < NOW()`のレコードを取得
   - 削除前に各シェアの応援数を確認

2. **削除前の通知送信**
   - `reaction_count > 0`の場合: 「あなたの投稿は○○人に応援されました」
   - `reaction_count = 0`の場合: 「あなたの投稿が24時間経過したため削除されました」
   - `notification_settings.reaction_notification_mode`が`off`の場合は通知をスキップ

3. **Realtimeイベント配信**
   - Supabase Realtimeが自動的に`DELETE`イベントをブロードキャスト
   - クライアント側で`share:deleted`イベントを購読することでリアルタイム更新が可能

## 実行スケジュール

- **cron設定**: `0 * * * *`（1時間ごとに実行）
- cron設定は以下の方法で行います（config.tomlでは設定できません）

## 環境変数

- `SUPABASE_URL`: SupabaseプロジェクトURL
- `SUPABASE_SERVICE_ROLE_KEY`: サービスロールキー（RLSをバイパスするために必要）

## デプロイ方法

### 1. ローカルテスト

```bash
# Supabaseローカル環境を起動
supabase start

# 関数を手動実行
supabase functions serve delete-expired-shares

# 別ターミナルから関数を呼び出し
curl -X POST http://localhost:54321/functions/v1/delete-expired-shares \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. 本番環境デプロイ

```bash
# Supabaseにログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref YOUR_PROJECT_REF

# 関数をデプロイ
supabase functions deploy delete-expired-shares
```

### 3. cronジョブの設定

cronスケジュールは以下の方法で設定します：

#### 方法1: Supabase Dashboard（推奨）

1. [Supabase Dashboard](https://app.supabase.com)にアクセス
2. プロジェクトを選択
3. 左メニューから「Database」→「Extensions」
4. `pg_cron`拡張を有効化
5. SQL Editorで以下を実行：

```sql
-- 1時間ごとにdelete-expired-shares関数を実行
-- まず、サービスロールキーをSecure Vaultに保存（Dashboardから実行）
-- 次に、cronジョブをスケジュール
SELECT cron.schedule(
  'delete-expired-shares-hourly',
  '0 * * * *',  -- 毎時0分に実行
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-expired-shares',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- cronジョブの確認
SELECT * FROM cron.job;

-- cronジョブの削除（必要な場合）
-- SELECT cron.unschedule('delete-expired-shares-hourly');
```

**注意**: `YOUR_SERVICE_ROLE_KEY`は実際のサービスロールキーに置き換えてください。セキュリティ上、SQL内に直接記述せず、Supabase Vaultなどのセキュアな方法で管理することを推奨します。

#### 方法2: Vercel Cron（推奨・最もシンプル）

Next.jsアプリをVercelにデプロイしている場合、Vercel Cronが最も管理しやすい方法です。

**注意**: Vercel無料プラン（Hobby）では1つのcronジョブのみ許可されるため、すべてのcronタスクを統合エンドポイント(`/api/cron`)にまとめています。

**手順**:

1. `vercel.json`（すでに作成済み）:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. 環境変数を設定（Vercel Dashboard）:
   - `CRON_SECRET`: ランダムな秘密鍵（例: `openssl rand -base64 32`で生成）
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー

3. Vercelにデプロイ:
```bash
vercel --prod
```

4. Vercel Dashboardで確認:
   - プロジェクト → Settings → Crons
   - スケジュールされたジョブが表示される

**統合API Route**: `app/api/cron/route.ts`（すべてのcronタスクを1つにまとめて実行）

#### 方法3: GitHub Actions（代替案）

**GitHub Actions (.github/workflows/cron.yml)**
```yaml
name: Cron Tasks
on:
  schedule:
    - cron: '0 * * * *'  # 毎時0分に実行
jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron API
        run: |
          curl -X GET https://your-app.vercel.app/api/cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**注意**: GitHub Actionsのリポジトリ設定でシークレット(`CRON_SECRET`)を追加してください。

### 4. 環境変数の設定

```bash
# サービスロールキーを設定（Supabase Functionで使用）
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## テスト

統合テストは`__tests__/supabase/functions/delete-expired-shares.test.ts`にあります。

```bash
# テスト実行
npm test delete-expired-shares.test.ts
```

## モニタリング

- Supabase Dashboardの「Functions」セクションでログとメトリクスを確認
- エラー発生時は通知を設定（Webhook、Slack連携など）

## トラブルシューティング

### 削除されないシェアがある

- `expires_at`が正しく設定されているか確認
- RLSポリシーがサービスロールキーをバイパスしているか確認
- ログを確認してエラーメッセージをチェック

### 通知が送信されない

- `notification_settings`テーブルに設定が存在するか確認
- `reaction_notification_mode`が`off`になっていないか確認
- プッシュ通知の実装が完了しているか確認（TODO部分）

## TODO

- [ ] 実際のプッシュ通知送信実装（Web Push API統合）
- [ ] in-app通知テーブルの作成と通知レコードの保存
- [ ] エラー追跡（Sentry統合）
- [ ] パフォーマンスモニタリング（削除件数、実行時間）

## 関連ファイル

- `supabase/functions/delete-expired-shares/index.ts`: Supabase Function本体
- `app/api/cron/route.ts`: 統合cronエンドポイント（Vercel用）
- `vercel.json`: Vercel Cron設定
- `supabase/config.toml`: Supabase設定
- `__tests__/supabase/functions/delete-expired-shares.test.ts`: 統合テスト
- `.kiro/specs/mood-harbor-app/tasks.md`: タスク6.6の仕様
