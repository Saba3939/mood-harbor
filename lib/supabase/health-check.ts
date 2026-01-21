/**
 * Supabase 接続ヘルスチェック
 * 環境変数とSupabase接続の検証
 */

import { createClient as createServerClient } from "./server";
import { validateEnv, getSupabaseUrl } from "./config";

/**
 * ヘルスチェック結果
 */
export interface HealthCheckResult {
  success: boolean;
  timestamp: string;
  checks: {
    envVars: {
      status: "ok" | "error";
      message: string;
    };
    supabaseConnection: {
      status: "ok" | "error";
      message: string;
    };
    authService: {
      status: "ok" | "error";
      message: string;
    };
  };
}

/**
 * Supabase接続のヘルスチェックを実行
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    success: false,
    timestamp: new Date().toISOString(),
    checks: {
      envVars: { status: "error", message: "" },
      supabaseConnection: { status: "error", message: "" },
      authService: { status: "error", message: "" },
    },
  };

  // 環境変数チェック
  try {
    validateEnv();
    result.checks.envVars = {
      status: "ok",
      message: `Connected to: ${getSupabaseUrl()}`,
    };
  } catch (error) {
    result.checks.envVars = {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unknown environment error",
    };
    return result;
  }

  // Supabase接続チェック
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("profiles").select("count");

    if (error && error.code !== "PGRST116") {
      // PGRST116は"relation does not exist"エラー（テーブル未作成時）で、接続自体は成功している
      throw error;
    }

    result.checks.supabaseConnection = {
      status: "ok",
      message: "Database connection successful",
    };
  } catch (error) {
    result.checks.supabaseConnection = {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unknown connection error",
    };
    return result;
  }

  // Auth Serviceチェック
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    result.checks.authService = {
      status: "ok",
      message: session
        ? `Session active for user: ${session.user.email}`
        : "No active session (this is normal)",
    };
  } catch (error) {
    result.checks.authService = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown auth error",
    };
    return result;
  }

  // すべてのチェックが成功
  result.success = Object.values(result.checks).every((c) => c.status === "ok");

  return result;
}
