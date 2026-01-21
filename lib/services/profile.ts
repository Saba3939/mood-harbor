/**
 * プロフィールサービス
 * ユーザープロフィール情報の管理
 */

import type { Database } from "@/lib/supabase/database.types";

/**
 * Result型: 成功または失敗を型安全に表現
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * プロフィール型
 */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * プロフィール作成パラメータ
 */
export type CreateProfileParams = Database["public"]["Tables"]["profiles"]["Insert"];

/**
 * プロフィール更新パラメータ
 */
export type UpdateProfileParams = Partial<
  Omit<CreateProfileParams, "user_id">
>;

/**
 * プロフィールエラー型
 */
export type ProfileError =
  | { type: "NICKNAME_TOO_LONG"; max: number }
  | { type: "NICKNAME_EMPTY" }
  | { type: "AVATAR_NOT_FOUND"; avatar_id: string }
  | { type: "PROFILE_NOT_FOUND"; user_id: string }
  | { type: "PROFILE_ALREADY_EXISTS"; user_id: string }
  | { type: "UNKNOWN_ERROR"; message: string };

/**
 * アバターカテゴリー
 */
export const AVATAR_CATEGORIES = {
  animals: "動物",
  plants: "植物",
  foods: "食べ物",
  weather: "天気",
  objects: "もの",
} as const;

export type AvatarCategory = keyof typeof AVATAR_CATEGORIES;

/**
 * アバターID一覧（30種類以上）
 */
export const AVATAR_IDS = [
  // 動物 (8種類)
  "cat_01",
  "dog_01",
  "rabbit_01",
  "bear_01",
  "fox_01",
  "panda_01",
  "penguin_01",
  "owl_01",
  // 植物 (8種類)
  "flower_01",
  "tree_01",
  "cactus_01",
  "mushroom_01",
  "leaf_01",
  "rose_01",
  "sunflower_01",
  "tulip_01",
  // 食べ物 (8種類)
  "apple_01",
  "bread_01",
  "cake_01",
  "coffee_01",
  "donut_01",
  "ice_cream_01",
  "pizza_01",
  "sushi_01",
  // 天気 (4種類)
  "sun_01",
  "cloud_01",
  "rain_01",
  "snow_01",
  // もの (4種類)
  "book_01",
  "music_01",
  "star_01",
  "heart_01",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

/**
 * アバターIDをカテゴリー別に分類
 */
export const AVATARS_BY_CATEGORY: Record<AvatarCategory, readonly AvatarId[]> =
  {
    animals: [
      "cat_01",
      "dog_01",
      "rabbit_01",
      "bear_01",
      "fox_01",
      "panda_01",
      "penguin_01",
      "owl_01",
    ],
    plants: [
      "flower_01",
      "tree_01",
      "cactus_01",
      "mushroom_01",
      "leaf_01",
      "rose_01",
      "sunflower_01",
      "tulip_01",
    ],
    foods: [
      "apple_01",
      "bread_01",
      "cake_01",
      "coffee_01",
      "donut_01",
      "ice_cream_01",
      "pizza_01",
      "sushi_01",
    ],
    weather: ["sun_01", "cloud_01", "rain_01", "snow_01"],
    objects: ["book_01", "music_01", "star_01", "heart_01"],
  };

/**
 * ProfileService: プロフィール関連の処理を一元管理
 */
export const ProfileService = {
  /**
   * ランダムニックネーム生成
   * 形式: 「港の旅人」+ 3桁の数字（001-999）
   */
  generateRandomNickname(): string {
    const number = Math.floor(Math.random() * 999) + 1;
    const paddedNumber = String(number).padStart(3, "0");
    return `港の旅人${paddedNumber}`;
  },

  /**
   * ニックネームバリデーション
   * 10文字以内、空でないこと
   */
  validateNickname(nickname: string): Result<void, ProfileError> {
    if (nickname.length === 0) {
      return {
        success: false,
        error: { type: "NICKNAME_EMPTY" },
      };
    }

    if (nickname.length > 10) {
      return {
        success: false,
        error: { type: "NICKNAME_TOO_LONG", max: 10 },
      };
    }

    return { success: true, value: undefined };
  },

  /**
   * アバターIDバリデーション
   * ホワイトリストに含まれるか確認
   */
  validateAvatarId(avatarId: string): Result<void, ProfileError> {
    if (!AVATAR_IDS.includes(avatarId as AvatarId)) {
      return {
        success: false,
        error: { type: "AVATAR_NOT_FOUND", avatar_id: avatarId },
      };
    }

    return { success: true, value: undefined };
  },
};
