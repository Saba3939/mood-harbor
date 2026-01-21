/**
 * Supabase 設定ユーティリティ
 * 環境変数の検証とSupabase接続確認
 */

/**
 * 必須環境変数の検証
 * @throws {Error} 環境変数が設定されていない場合
 */
export function validateEnv() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env.local file."
    );
  }
}

/**
 * Supabase URL取得
 */
export function getSupabaseUrl(): string {
  validateEnv();
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

/**
 * Supabase Anon Key取得
 */
export function getSupabaseAnonKey(): string {
  validateEnv();
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

/**
 * Supabase Service Role Key取得（サーバーサイドのみ）
 * @throws {Error} 環境変数が設定されていない場合
 */
export function getSupabaseServiceRoleKey(): string {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. This should only be used on the server side."
    );
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * OAuth設定
 */
export const OAUTH_CONFIG = {
  providers: {
    google: {
      enabled: true,
      // SupabaseダッシュボードでGoogle OAuthを有効化する必要がある
      scopes: "email profile",
    },
  },
  // リダイレクトURL（環境に応じて変更）
  redirectUrl:
    process.env.NODE_ENV === "production"
      ? "https://mood-harbor.vercel.app/auth/callback"
      : "http://localhost:3000/auth/callback",
};

/**
 * セキュリティ設定
 */
export const SECURITY_CONFIG = {
  // HTTPS通信強制（本番環境）
  forceHttps: process.env.NODE_ENV === "production",

  // Cookie設定
  cookie: {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },

  // パスワード要件
  password: {
    minLength: 8,
    requireNumbers: true,
    requireLetters: true,
  },
};
