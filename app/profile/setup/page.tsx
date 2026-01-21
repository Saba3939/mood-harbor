"use client";

/**
 * プロフィール設定ページ
 * 初回登録後にニックネームとアバターを設定
 * ランダム生成機能とカテゴリー分類表示
 */

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  ProfileService,
  AVATAR_IDS,
  AVATARS_BY_CATEGORY,
  AVATAR_CATEGORIES,
  type AvatarId,
  type AvatarCategory,
} from "@/lib/services/profile";
import {
  createProfileAction,
  getProfileAction,
} from "@/lib/actions/profile";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();

  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>("cat_01");
  const [selectedCategory, setSelectedCategory] =
    useState<AvatarCategory>("animals");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  const characterCount = nickname.length;
  const maxCharacters = 10;
  const isNicknameValid =
    nickname.length > 0 && nickname.length <= maxCharacters;

  // 既にプロフィールが存在する場合はホームへリダイレクト
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      try {
        const result = await getProfileAction();
        if (result.success && result.value) {
          // プロフィール既存在の場合はホームへリダイレクト
          router.push("/");
        }
      } catch (err) {
        console.error("プロフィール確認エラー:", err);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkExistingProfile();
  }, [user, router]);

  // ランダムニックネーム生成
  const handleRandomNickname = () => {
    const randomNickname = ProfileService.generateRandomNickname();
    setNickname(randomNickname);
  };

  // ランダムアバター選択
  const handleRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * AVATAR_IDS.length);
    setSelectedAvatar(AVATAR_IDS[randomIndex]);
  };

  // フォーム送信
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await createProfileAction({
        nickname,
        avatar_id: selectedAvatar,
      });

      if (!result.success) {
        // エラーメッセージのマッピング
        switch (result.error.type) {
          case "NICKNAME_TOO_LONG":
            setError(`ニックネームは${result.error.max}文字以内にしてください`);
            break;
          case "NICKNAME_EMPTY":
            setError("ニックネームを入力してください");
            break;
          case "AVATAR_NOT_FOUND":
            setError("無効なアバターが選択されています");
            break;
          case "PROFILE_ALREADY_EXISTS":
            setError("プロフィールは既に作成されています");
            break;
          default:
            setError("プロフィールの作成に失敗しました");
        }
        return;
      }

      // 成功時はホームページへリダイレクト
      router.push("/");
    } catch (err) {
      setError("予期しないエラーが発生しました");
      console.error("プロフィール作成エラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 認証チェック中またはプロフィール確認中
  if (authLoading || isCheckingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // 未認証の場合はログインページへリダイレクト
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-800">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            プロフィール設定
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            ニックネームとアバターを選んでください
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {/* プロフィール設定フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* ニックネーム入力 */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                ニックネーム
              </label>
              <span
                className={`text-xs ${
                  characterCount > maxCharacters
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                aria-live="polite"
              >
                {characterCount}/{maxCharacters}
              </span>
            </div>
            <div className="mt-1 flex gap-2">
              <input
                id="nickname"
                name="nickname"
                type="text"
                autoComplete="nickname"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
                maxLength={maxCharacters + 1}
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:placeholder-zinc-500 dark:disabled:bg-zinc-800"
                placeholder="例: 港の旅人001"
                aria-required="true"
                aria-invalid={!isNicknameValid && characterCount > 0}
              />
              <button
                type="button"
                onClick={handleRandomNickname}
                disabled={isLoading}
                className="shrink-0 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              >
                ランダム
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              10文字以内で入力してください
            </p>
          </div>

          {/* アバター選択 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                アバター
              </label>
              <button
                type="button"
                onClick={handleRandomAvatar}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-zinc-400 disabled:cursor-not-allowed"
              >
                ランダム選択
              </button>
            </div>

            {/* 選択中のアバタープレビュー */}
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-700">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl dark:bg-zinc-600"
                aria-label={`選択中のアバター: ${selectedAvatar}`}
              >
                {getAvatarEmoji(selectedAvatar)}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {nickname || "ニックネーム未設定"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedAvatar}
                </p>
              </div>
            </div>

            {/* カテゴリータブ */}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
              {(Object.keys(AVATAR_CATEGORIES) as AvatarCategory[]).map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    disabled={isLoading}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {AVATAR_CATEGORIES[category]}
                  </button>
                )
              )}
            </div>

            {/* アバターグリッド */}
            <div
              className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8"
              role="radiogroup"
              aria-label="アバター選択"
            >
              {AVATARS_BY_CATEGORY[selectedCategory].map((avatarId) => (
                <button
                  key={avatarId}
                  type="button"
                  onClick={() => setSelectedAvatar(avatarId)}
                  disabled={isLoading}
                  className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 text-3xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-800 ${
                    selectedAvatar === avatarId
                      ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                      : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-700"
                  }`}
                  role="radio"
                  aria-checked={selectedAvatar === avatarId}
                  aria-label={avatarId}
                >
                  {getAvatarEmoji(avatarId)}
                </button>
              ))}
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={isLoading || !isNicknameValid}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-400 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-800"
            aria-busy={isLoading}
          >
            {isLoading ? "保存中..." : "プロフィールを保存"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * アバターIDに対応する絵文字を返す
 * 実際のプロダクションでは画像ファイルを使用
 */
function getAvatarEmoji(avatarId: AvatarId): string {
  const emojiMap: Record<AvatarId, string> = {
    // 動物
    cat_01: "🐱",
    dog_01: "🐶",
    rabbit_01: "🐰",
    bear_01: "🐻",
    fox_01: "🦊",
    panda_01: "🐼",
    penguin_01: "🐧",
    owl_01: "🦉",
    // 植物
    flower_01: "🌸",
    tree_01: "🌳",
    cactus_01: "🌵",
    mushroom_01: "🍄",
    leaf_01: "🍃",
    rose_01: "🌹",
    sunflower_01: "🌻",
    tulip_01: "🌷",
    // 食べ物
    apple_01: "🍎",
    bread_01: "🍞",
    cake_01: "🍰",
    coffee_01: "☕",
    donut_01: "🍩",
    ice_cream_01: "🍦",
    pizza_01: "🍕",
    sushi_01: "🍣",
    // 天気
    sun_01: "☀️",
    cloud_01: "☁️",
    rain_01: "🌧️",
    snow_01: "❄️",
    // もの
    book_01: "📚",
    music_01: "🎵",
    star_01: "⭐",
    heart_01: "💙",
  };

  return emojiMap[avatarId] || "❓";
}
