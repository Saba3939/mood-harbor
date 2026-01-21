/**
 * 認証フロー E2Eテスト
 * サインアップ → ログイン → ログアウトの完全なフローをテスト
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { AuthService } from "@/lib/services/auth";
import type { User, Session } from "@supabase/supabase-js";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("認証フロー E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("完全な認証フロー: サインアップ → ログイン → ログアウト", async () => {
    const testEmail = "e2e-test@example.com";
    const testPassword = "Password123";

    // モックユーザーとセッション
    const mockUser: User = {
      id: "e2e-user-id",
      email: testEmail,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    } as User;

    const mockSession: Session = {
      access_token: "e2e-access-token",
      refresh_token: "e2e-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: mockUser,
    } as Session;

    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase as any
    );

    // ステップ1: サインアップ
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const signUpResult = await AuthService.signUp({
      email: testEmail,
      password: testPassword,
    });

    expect(signUpResult.success).toBe(true);
    if (signUpResult.success) {
      expect(signUpResult.value.email).toBe(testEmail);
      expect(signUpResult.value.id).toBe("e2e-user-id");
    }
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
    });

    // ステップ2: ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const signInResult = await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    expect(signInResult.success).toBe(true);
    if (signInResult.success) {
      expect(signInResult.value.user.email).toBe(testEmail);
      expect(signInResult.value.access_token).toBe("e2e-access-token");
    }
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
    });

    // ステップ3: ユーザー情報取得
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const getCurrentUserResult = await AuthService.getCurrentUser();

    expect(getCurrentUserResult.success).toBe(true);
    if (getCurrentUserResult.success) {
      expect(getCurrentUserResult.value?.email).toBe(testEmail);
      expect(getCurrentUserResult.value?.id).toBe("e2e-user-id");
    }
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();

    // ステップ4: ログアウト
    mockSupabase.auth.signOut.mockResolvedValueOnce({
      error: null,
    });

    const signOutResult = await AuthService.signOut();

    expect(signOutResult.success).toBe(true);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();

    // ステップ5: ログアウト後のユーザー情報取得（nullを返すべき）
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const afterSignOutResult = await AuthService.getCurrentUser();

    expect(afterSignOutResult.success).toBe(true);
    if (afterSignOutResult.success) {
      expect(afterSignOutResult.value).toBeNull();
    }
  });

  it("無効なパスワードでサインアップが失敗する", async () => {
    const signUpResult = await AuthService.signUp({
      email: "test@example.com",
      password: "weak", // 弱いパスワード
    });

    expect(signUpResult.success).toBe(false);
    if (!signUpResult.success) {
      expect(signUpResult.error.type).toBe("WEAK_PASSWORD");
    }
  });

  it("既存のメールアドレスでサインアップが失敗する", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "User already registered" },
        }),
      },
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase as any
    );

    const signUpResult = await AuthService.signUp({
      email: "existing@example.com",
      password: "Password123",
    });

    expect(signUpResult.success).toBe(false);
    if (!signUpResult.success) {
      expect(signUpResult.error.type).toBe("EMAIL_ALREADY_EXISTS");
    }
  });

  it("無効な認証情報でログインが失敗する", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: null },
          error: { message: "Invalid login credentials" },
        }),
      },
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase as any
    );

    const signInResult = await AuthService.signIn({
      email: "test@example.com",
      password: "WrongPassword123",
    });

    expect(signInResult.success).toBe(false);
    if (!signInResult.success) {
      expect(signInResult.error.type).toBe("INVALID_CREDENTIALS");
    }
  });

  it("ネットワークエラーが適切に処理される", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Failed to fetch" },
        }),
      },
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase as any
    );

    const signUpResult = await AuthService.signUp({
      email: "test@example.com",
      password: "Password123",
    });

    expect(signUpResult.success).toBe(false);
    if (!signUpResult.success) {
      expect(signUpResult.error.type).toBe("NETWORK_ERROR");
    }
  });

  it("OAuth認証フローが開始される", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({
          data: { url: "https://accounts.google.com/oauth", provider: "google" },
          error: null,
        }),
      },
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase as any
    );

    const oauthResult = await AuthService.signInWithOAuth("google");

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.stringContaining("/auth/callback"),
      },
    });

    // OAuth フローは外部リダイレクトのため、この時点では成功判定できない
    // 実装側では UNKNOWN_ERROR を返すが、signInWithOAuth が呼ばれたことを確認
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled();
  });

  it("連続したサインイン試行が正常に処理される", async () => {
    const testEmail = "concurrent@example.com";
    const testPassword = "Password123";

    const mockSession: Session = {
      access_token: "concurrent-access-token",
      refresh_token: "concurrent-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "concurrent-user-id",
        email: testEmail,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      } as User,
    } as Session;

    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
      },
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase as any
    );

    // 複数回ログイン試行
    const signInResult1 = await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    const signInResult2 = await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    expect(signInResult1.success).toBe(true);
    expect(signInResult2.success).toBe(true);
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
  });
});
