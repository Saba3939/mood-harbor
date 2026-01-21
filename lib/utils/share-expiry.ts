/**
 * シェア有効期限に関するユーティリティ
 */

import type { Share } from '@/lib/types/share';
import type { HarborPost } from '@/lib/types/harbor';

/**
 * シェアが期限切れかどうかをチェック
 * @param expiresAt - 有効期限（ISO 8601形式）
 * @returns 期限切れの場合true
 */
export function isShareExpired(expiresAt: string): boolean {
  const now = new Date();
  const expiry = new Date(expiresAt);
  return now > expiry;
}

/**
 * シェアの残り時間を取得（分単位）
 * @param expiresAt - 有効期限（ISO 8601形式）
 * @returns 残り時間（分）、期限切れの場合は0
 */
export function getShareRemainingMinutes(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const remainingMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.floor(remainingMs / (1000 * 60)));
}

/**
 * シェアの残り時間を人間が読める形式で取得
 * @param expiresAt - 有効期限（ISO 8601形式）
 * @returns 残り時間の文字列
 */
export function getShareRemainingTimeText(expiresAt: string): string {
  const remainingMinutes = getShareRemainingMinutes(expiresAt);

  if (remainingMinutes === 0) {
    return '期限切れ';
  }

  if (remainingMinutes < 60) {
    return `残り${remainingMinutes}分`;
  }

  const remainingHours = Math.floor(remainingMinutes / 60);
  if (remainingHours < 24) {
    return `残り${remainingHours}時間`;
  }

  const remainingDays = Math.floor(remainingHours / 24);
  return `残り${remainingDays}日`;
}

/**
 * 期限切れでないシェアのみをフィルタリング
 * @param shares - シェアの配列
 * @returns 有効なシェアの配列
 */
export function filterValidShares<T extends { expires_at: string }>(
  shares: T[]
): T[] {
  return shares.filter((share) => !isShareExpired(share.expires_at));
}

/**
 * 期限切れでないハーバー投稿のみをフィルタリング
 * @param posts - ハーバー投稿の配列
 * @returns 有効な投稿の配列
 */
export function filterValidHarborPosts(posts: HarborPost[]): HarborPost[] {
  return posts.filter((post) => !isShareExpired(post.share.expires_at));
}
