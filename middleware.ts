/**
 * Next.js Middleware - 認証チェックとルート保護
 * 全リクエストで実行され、認証状態に基づいてリダイレクトを処理
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * 認証チェックをスキップする静的パス
 */
const STATIC_PATHS = [
  "/privacy-policy",
  "/manifest.json",
  "/icons",
  "/_next",
  "/favicon.ico",
  "/api/auth",
];

/**
 * Middleware実行ロジック
 * - 未認証ユーザーを /login へリダイレクト（公開ページを除く）
 * - 認証済みユーザーの /login, /signup アクセスを / へリダイレクト
 * - セッショントークンの自動リフレッシュ
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 静的パスは認証チェックをスキップ
  const isStaticPath = STATIC_PATHS.some((path) => pathname.startsWith(path));

  if (isStaticPath) {
    return supabaseResponse;
  }

  // 認証済みユーザーが /login または /signup にアクセスした場合は / へリダイレクト
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return Response.redirect(url);
  }

  // 未認証ユーザーを /login へリダイレクト（/login, /signup以外）
  if (!user && pathname !== "/login" && pathname !== "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return Response.redirect(url);
  }

  return supabaseResponse;
}

/**
 * Middlewareを実行するパスのマッチング設定
 * Edge Runtimeで実行され、すべてのパスで認証チェックを行う
 */
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public フォルダ内のファイル (images, manifest.json など)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
