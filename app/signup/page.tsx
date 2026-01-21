"use client";

/**
 * サインアップページ
 * メールアドレス/パスワード登録とGoogle OAuth認証をサポート
 * パスワード強度リアルタイム検証機能付き
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getAuthErrorMessage } from "@/lib/utils/auth-messages";
import { getPasswordStrength } from "@/lib/utils/password-strength";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithOAuth, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    await signUp({ email, password });

    // サインアップ成功時はプロフィール設定ページへリダイレクト
    if (!error) {
      router.push("/profile/setup");
    }
  };

  const handleOAuthSignup = async () => {
    clearError();
    await signInWithOAuth("google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-800">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Mood Harbor
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            新しいアカウントを作成
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200"
          >
            {getAuthErrorMessage(error)}
          </div>
        )}

        {/* サインアップフォーム */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-4">
            {/* メールアドレス入力 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:placeholder-zinc-500 dark:disabled:bg-zinc-800"
                placeholder="your@example.com"
                aria-required="true"
                aria-invalid={error?.type === "EMAIL_ALREADY_EXISTS"}
              />
            </div>

            {/* パスワード入力 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:placeholder-zinc-500 dark:disabled:bg-zinc-800"
                placeholder="••••••••"
                aria-required="true"
                aria-invalid={error?.type === "WEAK_PASSWORD"}
                aria-describedby="password-strength"
              />

              {/* パスワード強度インジケーター */}
              {password && (
                <div className="mt-2" id="password-strength" role="status" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-700">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width:
                            passwordStrength.strength === "weak"
                              ? "33%"
                              : passwordStrength.strength === "medium"
                              ? "66%"
                              : "100%",
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.strength === "weak"
                          ? "text-red-600 dark:text-red-400"
                          : passwordStrength.strength === "medium"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    8文字以上、英数字を含めてください
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 新規登録ボタン */}
          <button
            type="submit"
            disabled={isLoading || !email || !password || passwordStrength.strength === "weak"}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-400 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-800"
            aria-busy={isLoading}
          >
            {isLoading ? "登録中..." : "新規登録"}
          </button>

          {/* 区切り線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300 dark:border-zinc-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                または
              </span>
            </div>
          </div>

          {/* Google OAuth連携ボタン */}
          <button
            type="button"
            onClick={handleOAuthSignup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-800"
            aria-busy={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleで登録
          </button>
        </form>

        {/* ログインリンク */}
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          既にアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
