# Supabase Auth 設定ガイド

このドキュメントでは、Mood HarborアプリケーションのSupabase Auth設定手順を説明します。

## 前提条件

- Supabaseプロジェクトが作成済み（プロジェクトID: `msxvtrhedggyisvnjqva`）
- `.env.local`ファイルに環境変数が設定済み

## 1. Google OAuth Providerの有効化

### ステップ 1: Google Cloud Consoleでプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動

### ステップ 2: OAuth 2.0 クライアントIDの作成

1. 「認証情報を作成」→「OAuth クライアント ID」を選択
2. アプリケーションの種類: **Webアプリケーション**
3. 名前: `Mood Harbor`

4. **承認済みのJavaScript生成元**を追加（パスなし、末尾の「/」なし）:
   - 本番環境:
     ```
     https://msxvtrhedggyisvnjqva.supabase.co
     ```
   - 開発環境:
     ```
     http://localhost:3000
     ```

5. **承認済みのリダイレクトURI**を追加（パスを含む）:
   - 本番環境:
     ```
     https://msxvtrhedggyisvnjqva.supabase.co/auth/v1/callback
     ```
   - 開発環境:
     ```
     http://localhost:3000/auth/callback
     ```

6. 「作成」をクリック
7. クライアントIDとクライアントシークレットをコピー

### ステップ 3: Supabaseダッシュボードでの設定

1. [Supabaseダッシュボード](https://supabase.com/dashboard/project/msxvtrhedggyisvnjqva)にアクセス
2. **Authentication** → **Providers** に移動
3. **Google**を有効化
4. Google Cloud ConsoleでコピーしたクライアントIDとシークレットを貼り付け
5. **Authorized Client IDs**はデフォルトのまま
6. **Skip nonce checks**はオフのまま
7. **Save**をクリック

### 重要な注意事項

#### Google Cloud Console設定のポイント

- **承認済みのJavaScript生成元**（Authorized JavaScript origins）
  - ドメインのみを入力（パス不可、末尾の「/」不可）
  - 正しい例: `https://msxvtrhedggyisvnjqva.supabase.co`
  - 誤った例: `https://msxvtrhedggyisvnjqva.supabase.co/` ❌
  - 誤った例: `https://msxvtrhedggyisvnjqva.supabase.co/auth` ❌

- **承認済みのリダイレクトURI**（Authorized redirect URIs）
  - パスを含む完全なURLを入力
  - 正しい例: `https://msxvtrhedggyisvnjqva.supabase.co/auth/v1/callback`
  - 正しい例: `http://localhost:3000/auth/callback`

## 2. リダイレクトURLの許可設定

### Supabaseダッシュボード設定

1. **Authentication** → **URL Configuration** に移動
2. **Site URL**を設定:
   - 本番環境: `https://mood-harbor.vercel.app`（デプロイ後のURL）
   - 開発環境: `http://localhost:3000`
3. **Redirect URLs**に以下を追加:
   ```
   http://localhost:3000/**
   https://mood-harbor.vercel.app/**
   ```

## 3. HTTPS通信の強制設定

### Vercelでの自動設定

- Vercelにデプロイすると自動的にHTTPSが有効化されます
- HTTPリクエストは自動的にHTTPSにリダイレクトされます

### ローカル開発環境

- 開発環境ではHTTPを使用（`http://localhost:3000`）
- Supabase AuthはローカルホストのHTTPを許可

## 4. CSRF対策とSame-Site Cookie設定

### Supabase Auth SDK設定

Supabase Auth SDKは自動的に以下のセキュリティ機能を提供します:

- **CSRFトークン**: 各認証リクエストにトークンが含まれる
- **Same-Site Cookie**: デフォルトで`Lax`モードが設定される
- **Secure Cookie**: HTTPS環境では自動的に有効化

### Next.js Middleware設定

`middleware.ts`で以下のセキュリティ対策を実装済み:

- セッショントークンの自動リフレッシュ
- 未認証ユーザーのリダイレクト
- 公開パスの適切な許可設定

## 5. パスワードポリシーの設定

### Supabaseダッシュボード設定

1. **Authentication** → **Policies** に移動
2. **Minimum password length**: `8`文字に設定
3. **Password strength**: `weak`を許可しない設定

### クライアント側バリデーション

`lib/auth/validation.ts`でパスワード強度チェックを実装:

```typescript
// パスワード要件:
// - 8文字以上
// - 英字と数字を含む
```

## 6. セキュリティヘッダーの設定

### Content Security Policy (CSP)

`next.config.ts`に以下のヘッダーを追加することを推奨:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ];
}
```

## 7. 環境変数の検証

`.env.local`ファイルに以下の環境変数が設定されていることを確認:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://msxvtrhedggyisvnjqva.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 本番環境でのシークレット管理

- Vercelの環境変数設定で`SUPABASE_SERVICE_ROLE_KEY`を追加
- **重要**: Service Role Keyはサーバーサイドのみで使用し、クライアントに公開しない

## 8. 動作確認手順

### ローカル環境での確認

1. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

2. `http://localhost:3000/signup`にアクセス

3. メールアドレスとパスワードで登録を試行

4. Google OAuthボタンをクリックして認証フローを確認

5. 認証後に`/`にリダイレクトされることを確認

### エラーハンドリングの確認

- 無効な認証情報でログイン試行
- パスワード強度不足で登録試行
- 既存のメールアドレスで再登録試行

## トラブルシューティング

### Google OAuth認証が失敗する

- リダイレクトURIが正しく設定されているか確認
- クライアントIDとシークレットが正しいか確認
- Supabaseダッシュボードで`Google`プロバイダーが有効化されているか確認

### セッションが維持されない

- Cookieが正しく設定されているか確認（ブラウザのDevToolsで確認）
- Middlewareが正しく実行されているか確認
- `updateSession()`が適切に呼ばれているか確認

### HTTPSエラー

- ローカル開発環境では`http://localhost:3000`を使用
- 本番環境ではVercelが自動的にHTTPSを有効化
