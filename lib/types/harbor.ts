/**
 * ハーバー（タイムライン）機能の型定義
 */

import type { Share, ShareType } from './share';
import type { TimeOfDay } from './mood-record';

/**
 * Result型（成功または失敗）
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * ハーバーフィルター
 */
export type HarborFilters = {
  share_type: ShareType;
  time_of_day?: TimeOfDay;
  sort_by?: 'newest' | 'most_reactions';
  limit?: number;
  offset?: number;
};

/**
 * ハーバー投稿（シェア + ユーザー情報 + 応援情報）
 */
export type HarborPost = {
  share: Share;
  user: {
    nickname: string;
    avatar_id: string;
  };
  reactions: {
    count: number;
    user_reacted: boolean;
  };
};

/**
 * ハーバーエラー
 */
export type HarborError = { type: 'INVALID_FILTERS' };

/**
 * Realtime購読用のコールバック型
 */
export type HarborSubscriptionCallback = (post: HarborPost) => void;
