/**
 * AuthStore のユニットテスト
 * Zustandを使用した認証状態管理のテスト
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthService } from "@/lib/services/auth";
import type { User, Session } from "@supabase/supabase-js";

// AuthServiceをモック
jest.mock("@/lib/services/auth");

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe("AuthStore", () => {
  // 各テスト前にストアをリセット
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.clearError();
      // ストアを初期状態にリセット
      useAuthStore.setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
    });
    jest.clearAllMocks();
  });

  describe("初期状態", () => {
    it("初期状態は未認証である", () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("signUp", () => {
    it("サインアップ成功時にユーザー情報を設定する", async () => {
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      };

      mockAuthService.signUp.mockResolvedValue({
        success: true,
        value: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("サインアップ失敗時にエラーを設定する", async () => {
      mockAuthService.signUp.mockResolvedValue({
        success: false,
        error: { type: "EMAIL_ALREADY_EXISTS" },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.error).toEqual({ type: "EMAIL_ALREADY_EXISTS" });
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("サインアップ中はisLoadingがtrueになる", async () => {
      mockAuthService.signUp.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  value: {} as User,
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.signUp({
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signIn", () => {
    it("サインイン成功時にユーザーとセッション情報を設定する", async () => {
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      };

      const mockSession: Session = {
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: mockUser,
        expires_in: 3600,
        expires_at: Date.now() + 3600 * 1000,
        token_type: "bearer",
      };

      mockAuthService.signIn.mockResolvedValue({
        success: true,
        value: mockSession,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("サインイン失敗時にエラーを設定する", async () => {
      mockAuthService.signIn.mockResolvedValue({
        success: false,
        error: { type: "INVALID_CREDENTIALS" },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn({
          email: "test@example.com",
          password: "wrongpassword",
        });
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
        expect(result.current.error).toEqual({ type: "INVALID_CREDENTIALS" });
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signInWithOAuth", () => {
    it("OAuth認証を開始する", async () => {
      mockAuthService.signInWithOAuth.mockResolvedValue({
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "OAuth flow initiated",
        },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signInWithOAuth("google");
      });

      expect(mockAuthService.signInWithOAuth).toHaveBeenCalledWith("google");
    });
  });

  describe("signOut", () => {
    it("サインアウト成功時に状態をクリアする", async () => {
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      };

      mockAuthService.signOut.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useAuthStore());

      // まず認証状態を設定
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          session: {} as Session,
        });
      });

      expect(result.current.user).toEqual(mockUser);

      // サインアウト実行
      await act(async () => {
        await result.current.signOut();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    it("サインアウト失敗時にエラーを設定する", async () => {
      mockAuthService.signOut.mockResolvedValue({
        success: false,
        error: { type: "NETWORK_ERROR" },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({ type: "NETWORK_ERROR" });
      });
    });
  });

  describe("refreshSession", () => {
    it("セッションをリフレッシュする", async () => {
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      };

      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        value: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshSession();
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("セッションが存在しない場合はnullを設定する", async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        value: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshSession();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });
  });

  describe("clearError", () => {
    it("エラーをクリアする", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          error: { type: "NETWORK_ERROR" },
        });
      });

      expect(result.current.error).toEqual({ type: "NETWORK_ERROR" });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
