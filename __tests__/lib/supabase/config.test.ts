/**
 * Supabase設定のテスト
 */

import {
  validateEnv,
  getSupabaseUrl,
  getSupabaseAnonKey,
  OAUTH_CONFIG,
  SECURITY_CONFIG,
} from "@/lib/supabase/config";

describe("Supabase Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("validateEnv", () => {
    it("環境変数が設定されている場合、エラーをスローしない", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL =
        "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      expect(() => validateEnv()).not.toThrow();
    });

    it("NEXT_PUBLIC_SUPABASE_URLが未設定の場合、エラーをスロー", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      expect(() => validateEnv()).toThrow(/Missing required environment variables/);
    });

    it("NEXT_PUBLIC_SUPABASE_ANON_KEYが未設定の場合、エラーをスロー", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL =
        "https://test.supabase.co";
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => validateEnv()).toThrow(/Missing required environment variables/);
    });
  });

  describe("getSupabaseUrl", () => {
    it("正しいSupabase URLを返す", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL =
        "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      expect(getSupabaseUrl()).toBe("https://test.supabase.co");
    });
  });

  describe("getSupabaseAnonKey", () => {
    it("正しいAnon Keyを返す", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL =
        "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      expect(getSupabaseAnonKey()).toBe("test-anon-key");
    });
  });

  describe("OAUTH_CONFIG", () => {
    it("Google OAuthが有効化されている", () => {
      expect(OAUTH_CONFIG.providers.google.enabled).toBe(true);
    });

    it("開発環境ではlocalhostにリダイレクト", () => {
      process.env.NODE_ENV = "development";
      // 注意: 動的インポートが必要な場合は、別途モック
      expect(OAUTH_CONFIG.redirectUrl).toContain("localhost");
    });
  });

  describe("SECURITY_CONFIG", () => {
    it("パスワードは最低8文字", () => {
      expect(SECURITY_CONFIG.password.minLength).toBe(8);
    });

    it("パスワードに数字と文字が必須", () => {
      expect(SECURITY_CONFIG.password.requireNumbers).toBe(true);
      expect(SECURITY_CONFIG.password.requireLetters).toBe(true);
    });

    it("開発環境ではHTTPSを強制しない", () => {
      // テスト実行時はNODE_ENV=testのため、forceHttpsはfalse
      expect(SECURITY_CONFIG.forceHttps).toBe(false);
    });

    it("開発環境ではSecure cookieを無効化", () => {
      // テスト実行時はNODE_ENV=testのため、cookie.secureはfalse
      expect(SECURITY_CONFIG.cookie.secure).toBe(false);
    });
  });
});
