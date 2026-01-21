# 24時間後の自動削除機能（ハイブリッド方式）

## 概要

シェア投稿は24時間後に自動的に削除されます。この機能はハイブリッド方式で実装されており、ユーザーに即時のフィードバックを提供しながら、Vercel無料プランの制限内で動作します。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    ハイブリッド方式                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  フロントエンド（リアルタイム）                               │
│  ├── expires_at をチェックして期限切れ投稿を非表示           │
│  ├── 1分ごとに自動更新                                       │
│  └── ユーザーには即座に消えて見える                          │
│                                                             │
│  バックエンド（1日1回）                                      │
│  ├── Vercel Cron (0 0 * * *) で毎日0時に実行                │
│  ├── DBから期限切れレコードを実際に削除                      │
│  └── 削除前に通知を送信                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Vercel無料プランの制限

| 項目 | 制限 |
|------|------|
| cronジョブ数 | 最大2つ |
| 実行頻度 | **1日1回が最大** |
| メモリ | 1024 MB |

そのため、毎時実行ではなく**1日1回**のクリーンアップ + **フロントエンドでの即時非表示**を組み合わせています。

## 実装ファイル

### フロントエンド

| ファイル | 役割 |
|----------|------|
| `lib/utils/share-expiry.ts` | 期限切れチェックのユーティリティ関数 |
| `app/harbor/page.tsx` | ハーバーフィードで期限切れ投稿をフィルタリング |
| `app/harbor/components/PostCard.tsx` | 残り時間の表示 |

### バックエンド

| ファイル | 役割 |
|----------|------|
| `app/api/cron/route.ts` | 統合cronエンドポイント（1日1回実行） |
| `vercel.json` | Vercel Cron設定（`0 0 * * *`） |
| `supabase/functions/delete-expired-shares/index.ts` | Supabase Function（代替案） |

## 機能詳細

### 1. フロントエンドでの期限切れチェック

```typescript
// lib/utils/share-expiry.ts
export function isShareExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}

export function filterValidHarborPosts(posts: HarborPost[]): HarborPost[] {
  return posts.filter((post) => !isShareExpired(post.share.expires_at));
}
```

- 投稿取得時に期限切れをフィルタリング
- 1分ごとに自動で期限切れ投稿を非表示
- Realtime新着投稿も期限切れチェック

### 2. 残り時間の表示

PostCardに「残り○時間」を表示：

```
🐱 ニックネーム
5分前 • 残り23時間
```

### 3. バックエンドでの削除（1日1回）

毎日0時にDBから期限切れレコードを削除：

- 削除前に通知を送信（「あなたの投稿は○○人に応援されました」）
- 通知設定がOFFの場合はスキップ

## 環境変数

```bash
# .env.local
CRON_SECRET=your-cron-secret  # openssl rand -base64 32 で生成
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## デプロイ

### Vercel

1. `vercel.json`はすでに設定済み
2. 環境変数をVercel Dashboardで設定
3. デプロイ: `vercel --prod`

### 確認

- Vercel Dashboard → Settings → Crons
- 毎日0時にジョブが実行される

## テスト

```bash
# ローカルでcronエンドポイントをテスト
curl -X GET http://localhost:3000/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 関連ファイル

- `lib/utils/share-expiry.ts`: 期限切れユーティリティ
- `app/harbor/page.tsx`: ハーバーフィード
- `app/harbor/components/PostCard.tsx`: 投稿カード
- `app/api/cron/route.ts`: 統合cronエンドポイント
- `vercel.json`: Vercel Cron設定
- `__tests__/supabase/functions/delete-expired-shares.test.ts`: テスト

## TODO

- [ ] 実際のプッシュ通知送信実装（Web Push API統合）
- [ ] in-app通知テーブルの作成と通知レコードの保存
