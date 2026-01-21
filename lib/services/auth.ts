/**
 * 認証サービス
 * ユーザー登録、ログイン、OAuth認証、アカウント削除を管理
 */

import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Result型: 成功または失敗を型安全に表現
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * サインアップパラメータ
 */
export type SignUpParams = {
  email: string;
  password: string;
};

/**
 * サインインパラメータ
 */
export type SignInParams = {
  email: string;
  password: string;
};

/**
 * OAuthプロバイダー
 */
export type OAuthProvider = "google";

/**
 * 認証エラー型
 */
export type AuthError =
  | { type: "INVALID_CREDENTIALS" }
  | { type: "EMAIL_ALREADY_EXISTS" }
  | { type: "WEAK_PASSWORD" }
  | { type: "NETWORK_ERROR" }
  | { type: "USER_NOT_FOUND" }
  | { type: "SESSION_EXPIRED" }
  | { type: "UNKNOWN_ERROR"; message: string };

/**
 * パスワード強度バリデーション
 * 8文字以上、英数字混在が必要
 */
export function validatePasswordStrength(password: string): Result<void, AuthError> {
  if (password.length < 8) {
    return {
      success: false,
      error: { type: "WEAK_PASSWORD" },
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      success: false,
      error: { type: "WEAK_PASSWORD" },
    };
  }

  return { success: true, value: undefined };
}

/**
 * Supabaseエラーを AuthError にマッピング
 */
function mapSupabaseError(error: unknown): AuthError {
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; status?: number };

    // 一般的なSupabaseエラーメッセージをマッピング
    if (err.message?.includes("Invalid login credentials")) {
      return { type: "INVALID_CREDENTIALS" };
    }
    if (err.message?.includes("User already registered")) {
      return { type: "EMAIL_ALREADY_EXISTS" };
    }
    if (err.message?.includes("Password should be")) {
      return { type: "WEAK_PASSWORD" };
    }
    if (err.message?.includes("Failed to fetch") || err.message?.includes("network")) {
      return { type: "NETWORK_ERROR" };
    }
    if (err.message?.includes("User not found")) {
      return { type: "USER_NOT_FOUND" };
    }

    return { type: "UNKNOWN_ERROR", message: err.message || "Unknown error" };
  }

  return { type: "UNKNOWN_ERROR", message: String(error) };
}

/**
 * AuthService: 認証関連の処理を一元管理
 */
export const AuthService = {
  /**
   * ユーザー登録
   */
  async signUp(params: SignUpParams): Promise<Result<User, AuthError>> {
    // クライアント側パスワード強度チェック
    const passwordValidation = validatePasswordStrength(params.password);
    if (!passwordValidation.success) {
      return passwordValidation;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      if (!data.user) {
        return {
          success: false,
          error: { type: "UNKNOWN_ERROR", message: "User data not returned" },
        };
      }

      return { success: true, value: data.user };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  },

  /**
   * ログイン
   */
  async signIn(params: SignInParams): Promise<Result<Session, AuthError>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      if (!data.session) {
        return {
          success: false,
          error: { type: "UNKNOWN_ERROR", message: "Session not returned" },
        };
      }

      return { success: true, value: data.session };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  },

  /**
   * OAuth認証
   */
  async signInWithOAuth(provider: OAuthProvider): Promise<Result<Session, AuthError>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      // OAuthの場合、即座にセッションは返されないため、
      // リダイレクト後のコールバックで処理される
      // ここでは成功を返すが、実際のセッションはコールバック後に取得
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "OAuth flow initiated, session will be available after redirect",
        },
      };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  },

  /**
   * ログアウト
   */
  async signOut(): Promise<Result<void, AuthError>> {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      return { success: true, value: undefined };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  },

  /**
   * 現在のユーザーを取得
   */
  async getCurrentUser(): Promise<Result<User | null, AuthError>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      return { success: true, value: data.user };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  },

  /**
   * アカウント削除
   * Supabase Authのアカウントを削除（CASCADE削除により関連データも削除）
   */
  async deleteAccount(userId: string): Promise<Result<void, AuthError>> {
    try {
      const supabase = createClient();

      // 現在のユーザーが削除対象のユーザーであることを確認
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user || currentUser.user.id !== userId) {
        return {
          success: false,
          error: {
            type: "UNKNOWN_ERROR",
            message: "Cannot delete account: user mismatch",
          },
        };
      }

      // Supabase Admin APIを使用してユーザーを削除
      // 注意: これはクライアントサイドでは直接実行できないため、
      // Server Actionまたはバックエンドエンドポイント経由で実行する必要がある
      // ここでは型定義のみ提供
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "Account deletion must be performed via server-side API",
        },
      };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  },
};
