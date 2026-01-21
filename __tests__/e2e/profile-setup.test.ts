/**
 * プロフィール設定E2Eテスト
 * 初回登録 → プロフィール設定 → 保存の流れをテスト
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Supabaseクライアントのモック
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
    signUp: jest.fn(),
  },
};

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// next/navigationのモック
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/profile/setup",
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("プロフィール設定フロー E2E", () => {
  it("初回登録後、プロフィール設定ページでニックネームとアバターを設定できる", async () => {
    const mockUserId = "test-user-id";
    const mockEmail = "test@example.com";

    // Step 1: サインアップ
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          email: mockEmail,
          created_at: new Date().toISOString(),
        },
        session: {
          access_token: "test-token",
          refresh_token: "test-refresh-token",
        },
      },
      error: null,
    });

    const { AuthService } = await import("@/lib/services/auth");
    const signUpResult = await AuthService.signUp({
      email: mockEmail,
      password: "Password123",
    });

    expect(signUpResult.success).toBe(true);

    // Step 2: プロフィール設定
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // プロフィール未存在を確認
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" }, // Not found
          }),
        }),
      }),
    });

    const mockProfile = {
      user_id: mockUserId,
      nickname: "テストユーザー",
      avatar_id: "cat_01",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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

    const { createProfileAction } = await import("@/lib/actions/profile");
    const createResult = await createProfileAction({
      nickname: "テストユーザー",
      avatar_id: "cat_01",
    });

    expect(createResult.success).toBe(true);
    if (createResult.success) {
      expect(createResult.value.nickname).toBe("テストユーザー");
      expect(createResult.value.avatar_id).toBe("cat_01");
    }

    // Step 3: プロフィール確認
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
    const getResult = await getProfileAction();

    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.value?.nickname).toBe("テストユーザー");
      expect(getResult.value?.avatar_id).toBe("cat_01");
    }
  });

  it("ランダムニックネーム生成機能が正しく動作する", () => {
    const { ProfileService } = require("@/lib/services/profile");

    // 複数回実行してランダム性を確認
    const nicknames = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const nickname = ProfileService.generateRandomNickname();
      expect(nickname).toMatch(/^港の旅人\d{3}$/);
      nicknames.add(nickname);
    }

    // 高確率で異なるニックネームが生成される
    expect(nicknames.size).toBeGreaterThan(1);
  });

  it("バリデーションエラーが適切に処理される", async () => {
    const mockUserId = "test-user-id";

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const { createProfileAction } = await import("@/lib/actions/profile");

    // ニックネームが長すぎる場合
    const tooLongResult = await createProfileAction({
      nickname: "あいうえおかきくけこさしすせそ",
      avatar_id: "cat_01",
    });

    expect(tooLongResult.success).toBe(false);
    if (!tooLongResult.success) {
      expect(tooLongResult.error.type).toBe("NICKNAME_TOO_LONG");
    }

    // 無効なアバターID
    const invalidAvatarResult = await createProfileAction({
      nickname: "テスト",
      avatar_id: "invalid_avatar",
    });

    expect(invalidAvatarResult.success).toBe(false);
    if (!invalidAvatarResult.success) {
      expect(invalidAvatarResult.error.type).toBe("AVATAR_NOT_FOUND");
    }
  });

  it("プロフィール更新機能が正しく動作する", async () => {
    const mockUserId = "test-user-id";
    const mockProfile = {
      user_id: mockUserId,
      nickname: "更新後ユーザー",
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
    const updateResult = await updateProfileAction({
      nickname: "更新後ユーザー",
      avatar_id: "dog_01",
    });

    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.value.nickname).toBe("更新後ユーザー");
      expect(updateResult.value.avatar_id).toBe("dog_01");
    }
  });
});
