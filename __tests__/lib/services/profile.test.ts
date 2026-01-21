/**
 * ProfileService ユニットテスト
 */

import { describe, it, expect, jest } from "@jest/globals";
import { ProfileService } from "@/lib/services/profile";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("ProfileService", () => {
  describe("generateRandomNickname", () => {
    it("「港の旅人」+ 3桁の数字形式のニックネームを生成する", () => {
      const nickname = ProfileService.generateRandomNickname();
      expect(nickname).toMatch(/^港の旅人\d{3}$/);
    });

    it("複数回呼び出すと異なるニックネームを生成する（高確率）", () => {
      const nickname1 = ProfileService.generateRandomNickname();
      const nickname2 = ProfileService.generateRandomNickname();
      // 1000分の1の確率で同じになる可能性があるため、絶対的なテストではない
      // 実用上は問題ない
      expect(nickname1).not.toBe(nickname2);
    });

    it("生成されたニックネームは10文字以内である", () => {
      const nickname = ProfileService.generateRandomNickname();
      expect(nickname.length).toBeLessThanOrEqual(10);
    });
  });

  describe("validateNickname", () => {
    it("有効なニックネーム（10文字以内）を受け入れる", () => {
      const result = ProfileService.validateNickname("太郎");
      expect(result.success).toBe(true);
    });

    it("10文字ちょうどのニックネームを受け入れる", () => {
      const result = ProfileService.validateNickname("あいうえおかきくけこ");
      expect(result.success).toBe(true);
    });

    it("10文字を超えるニックネームを拒否する", () => {
      const result = ProfileService.validateNickname("あいうえおかきくけこさ");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NICKNAME_TOO_LONG");
      }
    });

    it("空のニックネームを拒否する", () => {
      const result = ProfileService.validateNickname("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NICKNAME_EMPTY");
      }
    });
  });

  describe("validateAvatarId", () => {
    it("有効なアバターIDを受け入れる", () => {
      const result = ProfileService.validateAvatarId("cat_01");
      expect(result.success).toBe(true);
    });

    it("無効なアバターID（ホワイトリスト外）を拒否する", () => {
      const result = ProfileService.validateAvatarId("invalid_avatar");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("AVATAR_NOT_FOUND");
      }
    });

    it("空のアバターIDを拒否する", () => {
      const result = ProfileService.validateAvatarId("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("AVATAR_NOT_FOUND");
      }
    });
  });
});
