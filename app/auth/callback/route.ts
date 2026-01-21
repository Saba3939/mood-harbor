/**
 * OAuth認証のコールバックハンドラー
 * Google OAuth認証後のリダイレクトを処理
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ホームページまたはプロフィール設定ページへリダイレクト
  // 新規ユーザーの場合はプロフィール設定ページへ
  return NextResponse.redirect(requestUrl.origin);
}
