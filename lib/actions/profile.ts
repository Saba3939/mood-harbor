/**
 * プロフィールServer Actions
 * プロフィールテーブルへのCRUD操作
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  ProfileService,
  type Profile,
  type CreateProfileParams,
  type UpdateProfileParams,
  type ProfileError,
  type Result,
} from "@/lib/services/profile";

/**
 * XSS対策: ユーザー入力のサニタイゼーション
 * 基本的なHTMLエスケープを実施
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * プロフィール作成Action
 */
export async function createProfileAction(params: {
  nickname: string;
  avatar_id: string;
}): Promise<Result<Profile, ProfileError>> {
  try {
    // バリデーション
    const nicknameValidation = ProfileService.validateNickname(params.nickname);
    if (!nicknameValidation.success) {
      return nicknameValidation;
    }

    const avatarValidation = ProfileService.validateAvatarId(params.avatar_id);
    if (!avatarValidation.success) {
      return avatarValidation;
    }

    // サニタイゼーション
    const sanitizedNickname = sanitizeInput(params.nickname);

    // 現在のユーザーを取得
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "User not authenticated",
        },
      };
    }

    // プロフィール作成
    const profileData: Database["public"]["Tables"]["profiles"]["Insert"] = {
      user_id: user.id,
      nickname: sanitizedNickname,
      avatar_id: params.avatar_id,
    };

    const { data, error } = await supabase
      .from("profiles")
      // @ts-ignore - Supabase型推論の問題、実行時は正常に動作
      .insert(profileData)
      .select()
      .single();

    if (error) {
      // 重複エラー（プロフィール既存在）をチェック
      if (error.code === "23505") {
        return {
          success: false,
          error: {
            type: "PROFILE_ALREADY_EXISTS",
            user_id: user.id,
          },
        };
      }

      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: error.message,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "Profile data not returned",
        },
      };
    }

    return { success: true, value: data };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        message: String(error),
      },
    };
  }
}

/**
 * プロフィール更新Action
 */
export async function updateProfileAction(
  updates: UpdateProfileParams
): Promise<Result<Profile, ProfileError>> {
  try {
    // バリデーション
    if (updates.nickname !== undefined) {
      const nicknameValidation = ProfileService.validateNickname(
        updates.nickname
      );
      if (!nicknameValidation.success) {
        return nicknameValidation;
      }
    }

    if (updates.avatar_id !== undefined) {
      const avatarValidation = ProfileService.validateAvatarId(
        updates.avatar_id
      );
      if (!avatarValidation.success) {
        return avatarValidation;
      }
    }

    // サニタイゼーション
    const sanitizedUpdates: UpdateProfileParams = {};
    if (updates.nickname !== undefined) {
      sanitizedUpdates.nickname = sanitizeInput(updates.nickname);
    }
    if (updates.avatar_id !== undefined) {
      sanitizedUpdates.avatar_id = updates.avatar_id;
    }

    // 現在のユーザーを取得
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "User not authenticated",
        },
      };
    }

    // updated_atを自動更新
    const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {
      ...sanitizedUpdates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      // @ts-ignore - Supabase型推論の問題、実行時は正常に動作
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: error.message,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        error: {
          type: "PROFILE_NOT_FOUND",
          user_id: user.id,
        },
      };
    }

    return { success: true, value: data };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        message: String(error),
      },
    };
  }
}

/**
 * プロフィール取得Action
 * 現在のユーザーのプロフィールを取得
 */
export async function getProfileAction(): Promise<
  Result<Profile | null, ProfileError>
> {
  try {
    // 現在のユーザーを取得
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "User not authenticated",
        },
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select()
      .eq("user_id", user.id)
      .single();

    if (error) {
      // プロフィールが存在しない場合はnullを返す
      if (error.code === "PGRST116") {
        return { success: true, value: null };
      }

      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: error.message,
        },
      };
    }

    return { success: true, value: data };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        message: String(error),
      },
    };
  }
}
