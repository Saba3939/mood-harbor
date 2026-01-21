/**
 * AuthService ユニットテスト
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  AuthService,
  validatePasswordStrength,
  type SignUpParams,
  type SignInParams,
} from "@/lib/services/auth";
import type { User, Session } from "@supabase/supabase-js";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("validatePasswordStrength", () => {
  it("8文字未満のパスワードを拒否する", () => {
    const result = validatePasswordStrength("Pass1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("WEAK_PASSWORD");
    }
  });

  it("数字を含まないパスワードを拒否する", () => {
    const result = validatePasswordStrength("Password");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("WEAK_PASSWORD");
    }
  });

  it("文字を含まないパスワードを拒否する", () => {
    const result = validatePasswordStrength("12345678");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("WEAK_PASSWORD");
    }
  });

  it("8文字以上で英数字混在のパスワードを受け入れる", () => {
    const result = validatePasswordStrength("Password123");
    expect(result.success).toBe(true);
  });
});

describe("AuthService.signUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("有効なパラメータでユーザーを作成する", async () => {
    const mockUser: User = {
      id: "user-id-123",
      email: "test@example.com",
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    } as User;

    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const params: SignUpParams = {
      email: "test@example.com",
      password: "Password123",
    };

    const result = await AuthService.signUp(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe("user-id-123");
      expect(result.value.email).toBe("test@example.com");
    }
  });

  it("弱いパスワードでエラーを返す", async () => {
    const params: SignUpParams = {
      email: "test@example.com",
      password: "weak",
    };

    const result = await AuthService.signUp(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("WEAK_PASSWORD");
    }
  });

  it("既存メールアドレスでエラーを返す", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "User already registered" },
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const params: SignUpParams = {
      email: "existing@example.com",
      password: "Password123",
    };

    const result = await AuthService.signUp(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("EMAIL_ALREADY_EXISTS");
    }
  });

  it("ネットワークエラーを処理する", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Failed to fetch" },
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const params: SignUpParams = {
      email: "test@example.com",
      password: "Password123",
    };

    const result = await AuthService.signUp(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("NETWORK_ERROR");
    }
  });
});

describe("AuthService.signIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("有効な認証情報でログインする", async () => {
    const mockSession: Session = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "user-id-123",
        email: "test@example.com",
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
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const params: SignInParams = {
      email: "test@example.com",
      password: "Password123",
    };

    const result = await AuthService.signIn(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.access_token).toBe("access-token-123");
      expect(result.value.user.email).toBe("test@example.com");
    }
  });

  it("無効な認証情報でエラーを返す", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: null },
          error: { message: "Invalid login credentials" },
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const params: SignInParams = {
      email: "test@example.com",
      password: "WrongPassword123",
    };

    const result = await AuthService.signIn(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("INVALID_CREDENTIALS");
    }
  });
});

describe("AuthService.signOut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にログアウトする", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const result = await AuthService.signOut();

    expect(result.success).toBe(true);
  });

  it("ログアウトエラーを処理する", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: { message: "Network error" },
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const result = await AuthService.signOut();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("UNKNOWN_ERROR");
    }
  });
});

describe("AuthService.getCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("現在のユーザーを取得する", async () => {
    const mockUser: User = {
      id: "user-id-123",
      email: "test@example.com",
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    } as User;

    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const result = await AuthService.getCurrentUser();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value?.id).toBe("user-id-123");
      expect(result.value?.email).toBe("test@example.com");
    }
  });

  it("ユーザーが存在しない場合nullを返す", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const result = await AuthService.getCurrentUser();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeNull();
    }
  });
});

describe("AuthService.deleteAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("サーバーサイド実装が必要なエラーを返す", async () => {
    const mockUser: User = {
      id: "user-id-123",
      email: "test@example.com",
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    } as User;

    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const result = await AuthService.deleteAccount("user-id-123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("UNKNOWN_ERROR");
      expect(result.error.message).toContain("server-side");
    }
  });

  it("ユーザーミスマッチエラーを返す", async () => {
    const mockUser: User = {
      id: "different-user-id",
      email: "different@example.com",
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    } as User;

    const { createClient } = await import("@/lib/supabase/client");
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabase as any);

    const result = await AuthService.deleteAccount("user-id-123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("UNKNOWN_ERROR");
      expect(result.error.message).toContain("user mismatch");
    }
  });
});
