/**
 * AuthStore: Zustandを使用した認証状態管理
 * Supabase Auth SDKのセッション変更イベントをリッスンし状態を同期
 *
 * セッション永続化:
 * - Supabase Auth SDKが自動的にlocalStorageにセッションを保存
 * - リフレッシュトークンによる自動セッション更新をサポート
 * - ページリロード時もセッションが維持される
 */

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { AuthService } from "@/lib/services/auth";
import type { User, Session } from "@supabase/supabase-js";
import type { AuthError, SignUpParams, SignInParams, OAuthProvider } from "@/lib/services/auth";

/**
 * 認証状態の型定義
 */
export type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
};

/**
 * 認証アクションの型定義
 */
export type AuthStoreActions = {
  signUp: (params: SignUpParams) => Promise<void>;
  signIn: (params: SignInParams) => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
};

/**
 * AuthStore: 認証状態とアクションを管理
 *
 * セッション変更イベントのリッスン:
 * - Supabase Auth SDKの onAuthStateChange を使用
 * - SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED などのイベントを監視
 * - イベント発生時に自動的にストアを更新
 */
export const useAuthStore = create<AuthState & AuthStoreActions>((set, get) => {
  // Supabase Auth のセッション変更イベントをリッスン
  if (typeof window !== "undefined") {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session: session ?? null,
      });
    });
  }

  return {
    // 初期状態
    user: null,
    session: null,
    isLoading: false,
    error: null,

    /**
     * サインアップ
     */
    signUp: async (params: SignUpParams) => {
      set({ isLoading: true, error: null });

      const result = await AuthService.signUp(params);

      if (result.success) {
        set({
          user: result.value,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isLoading: false,
          error: result.error,
        });
      }
    },

    /**
     * サインイン
     */
    signIn: async (params: SignInParams) => {
      set({ isLoading: true, error: null });

      const result = await AuthService.signIn(params);

      if (result.success) {
        set({
          user: result.value.user,
          session: result.value,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          session: null,
          isLoading: false,
          error: result.error,
        });
      }
    },

    /**
     * OAuth認証
     */
    signInWithOAuth: async (provider: OAuthProvider) => {
      set({ isLoading: true, error: null });

      const result = await AuthService.signInWithOAuth(provider);

      if (result.success) {
        set({
          user: result.value.user,
          session: result.value,
          isLoading: false,
          error: null,
        });
      } else {
        // OAuthの場合、リダイレクトが発生するため、エラーのみ設定
        set({
          isLoading: false,
          error: result.error,
        });
      }
    },

    /**
     * サインアウト
     */
    signOut: async () => {
      set({ isLoading: true, error: null });

      const result = await AuthService.signOut();

      if (result.success) {
        set({
          user: null,
          session: null,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.error,
        });
      }
    },

    /**
     * セッションをリフレッシュ
     */
    refreshSession: async () => {
      set({ isLoading: true, error: null });

      const result = await AuthService.getCurrentUser();

      if (result.success) {
        set({
          user: result.value,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          session: null,
          isLoading: false,
          error: result.error,
        });
      }
    },

    /**
     * エラーをクリア
     */
    clearError: () => {
      set({ error: null });
    },
  };
});
