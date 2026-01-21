/**
 * Supabase サーバーサイドクライアント
 * Server Components、Server Actions、Middlewareで使用
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * サーバーサイド用Supabaseクライアントを作成
 * Server ComponentsとServer Actionsで使用
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentからset()を呼ぶとエラーになる場合がある
            // middlewareまたはServer Actionで呼び出す必要がある
          }
        },
      },
    }
  );
}
