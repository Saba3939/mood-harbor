/**
 * Supabase クライアント作成ユーティリティ
 * クライアントサイドとサーバーサイドの両方でSupabaseクライアントを提供
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * ブラウザ用Supabaseクライアントを作成
 * クライアントコンポーネントとClient Hooksで使用
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
