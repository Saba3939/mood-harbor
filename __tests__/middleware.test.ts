/**
 * Middlewareのテスト
 * 認証チェックとリダイレクトロジックの検証
 *
 * @jest-environment node
 */

// Next.jsのRequest/Responseグローバルをモック
global.Request = class Request {
  constructor(public input: string | URL, public init?: RequestInit) {}
} as any;

global.Response = class Response {
  constructor(public body?: BodyInit | null, public init?: ResponseInit) {}
  static redirect(url: string | URL, status?: number) {
    return new Response(null, {
      status: status || 302,
      headers: { location: url.toString() },
    });
  }
  get headers() {
    return new Map([["location", this.init?.headers?.toString() || ""]]);
  }
} as any;

import { NextRequest, NextResponse } from "next/server";
import { middleware } from "@/middleware";

// Supabase middleware関数のモック
jest.mock("@/lib/supabase/middleware", () => ({
  updateSession: jest.fn(),
}));

import { updateSession } from "@/lib/supabase/middleware";

const mockUpdateSession = updateSession as jest.MockedFunction<
  typeof updateSession
>;

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("静的パスの処理", () => {
    const staticPaths = [
      "/privacy-policy",
      "/manifest.json",
      "/icons/icon-192.png",
      "/_next/static/test.js",
      "/favicon.ico",
    ];

    staticPaths.forEach((path) => {
      it(`${path} は認証チェックをスキップ`, async () => {
        const request = new NextRequest(
          new URL(`http://localhost:3000${path}`)
        );
        const mockResponse = NextResponse.next();

        mockUpdateSession.mockResolvedValue({
          supabaseResponse: mockResponse,
          user: null,
        });

        const response = await middleware(request);

        expect(response).toBe(mockResponse);
      });
    });
  });

  describe("認証ページのアクセス", () => {
    it("/login は未認証ユーザーにアクセスを許可", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/login"));
      const mockResponse = NextResponse.next();

      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      });

      const response = await middleware(request);

      expect(response).toBe(mockResponse);
    });

    it("/signup は未認証ユーザーにアクセスを許可", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/signup"));
      const mockResponse = NextResponse.next();

      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      });

      const response = await middleware(request);

      expect(response).toBe(mockResponse);
    });
  });

  describe("未認証ユーザーのリダイレクト", () => {
    it("未認証ユーザーが保護されたパスにアクセスすると /login へリダイレクト", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/dashboard"));
      const mockResponse = NextResponse.next();

      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      });

      const response = await middleware(request);

      expect(response.status).toBe(302); // Next.js Response.redirect uses 302
      expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    });

  });

  describe("認証済みユーザーのリダイレクト", () => {
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      created_at: "2024-01-01T00:00:00Z",
    };

    it("認証済みユーザーが /login にアクセスすると / へリダイレクト", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/login"));
      const mockResponse = NextResponse.next();

      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      });

      const response = await middleware(request);

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("認証済みユーザーが /signup にアクセスすると / へリダイレクト", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/signup"));
      const mockResponse = NextResponse.next();

      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      });

      const response = await middleware(request);

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("認証済みユーザーが保護されたパスにアクセスするとそのまま通過", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/dashboard"));
      const mockResponse = NextResponse.next();

      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      });

      const response = await middleware(request);

      expect(response).toBe(mockResponse);
    });
  });
});
