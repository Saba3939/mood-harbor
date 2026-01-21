/**
 * プロフィールServer Actionsのユニットテスト
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Supabaseクライアントのモック
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// テストの前にモックをリセット
beforeEach(() => {
  jest.clearAllMocks();
});

describe("createProfileAction", () => {
  it("有効なパラメータでプロフィールを作成する", async () => {
    // モックの設定
    const mockUserId = "test-user-id";
    const mockProfile = {
      user_id: mockUserId,
      nickname: "テストユーザー",
      avatar_id: "cat_01",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    // 動的インポート（モック後にインポート）
    const { createProfileAction } = await import("@/lib/actions/profile");

    const result = await createProfileAction({
      nickname: "テストユーザー",
      avatar_id: "cat_01",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.nickname).toBe("テストユーザー");
      expect(result.value.avatar_id).toBe("cat_01");
    }
  });

  it("ニックネームが10文字を超える場合、バリデーションエラーを返す", async () => {
    const { createProfileAction } = await import("@/lib/actions/profile");

    const result = await createProfileAction({
      nickname: "あいうえおかきくけこさ",
      avatar_id: "cat_01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("NICKNAME_TOO_LONG");
    }
  });

  it("無効なアバターIDの場合、バリデーションエラーを返す", async () => {
    const { createProfileAction } = await import("@/lib/actions/profile");

    const result = await createProfileAction({
      nickname: "テストユーザー",
      avatar_id: "invalid_avatar",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("AVATAR_NOT_FOUND");
    }
  });

  it("未認証ユーザーの場合、エラーを返す", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { createProfileAction } = await import("@/lib/actions/profile");

    const result = await createProfileAction({
      nickname: "テストユーザー",
      avatar_id: "cat_01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("UNKNOWN_ERROR");
    }
  });
});

describe("updateProfileAction", () => {
  it("有効なパラメータでプロフィールを更新する", async () => {
    const mockUserId = "test-user-id";
    const mockProfile = {
      user_id: mockUserId,
      nickname: "更新後",
      avatar_id: "dog_01",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { updateProfileAction } = await import("@/lib/actions/profile");

    const result = await updateProfileAction({
      nickname: "更新後",
      avatar_id: "dog_01",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.nickname).toBe("更新後");
      expect(result.value.avatar_id).toBe("dog_01");
    }
  });
});

describe("getProfileAction", () => {
  it("現在のユーザーのプロフィールを取得する", async () => {
    const mockUserId = "test-user-id";
    const mockProfile = {
      user_id: mockUserId,
      nickname: "テストユーザー",
      avatar_id: "cat_01",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const { getProfileAction } = await import("@/lib/actions/profile");

    const result = await getProfileAction();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value?.nickname).toBe("テストユーザー");
    }
  });

  it("プロフィールが存在しない場合、nullを返す", async () => {
    const mockUserId = "test-user-id";

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" }, // PostgreSQL "not found" error
          }),
        }),
      }),
    });

    const { getProfileAction } = await import("@/lib/actions/profile");

    const result = await getProfileAction();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeNull();
    }
  });
});
