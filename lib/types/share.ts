/**
 * シェア機能の型定義
 */

/**
 * シェアの種類
 */
export type ShareType = 'support_needed' | 'joy_share' | 'achievement';

/**
 * 気持ち（ShareTypeごとに異なる選択肢）
 */
export type Feeling = string;

/**
 * シェア作成パラメータ
 */
export type CreateShareParams = {
  user_id: string;
  mood_record_id: string;
  share_type: ShareType;
  feeling: Feeling;
  message?: string; // 最大10文字
};

/**
 * シェアエンティティ
 */
export type Share = {
  id: string;
  user_id: string;
  mood_record_id: string;
  share_type: ShareType;
  feeling: Feeling;
  message: string | null;
  reaction_count: number;
  created_at: string;
  expires_at: string; // created_at + 24時間
};

/**
 * シェアエラー
 */
export type ShareError =
  | { type: 'MESSAGE_TOO_LONG'; max: number }
  | { type: 'PRIVACY_SETTINGS_DISABLED' }
  | { type: 'SHARE_NOT_FOUND'; share_id: string }
  | { type: 'UNAUTHORIZED_DELETE' }
  | { type: 'INVALID_SHARE_TYPE'; share_type: string }
  | { type: 'INVALID_FEELING'; feeling: string; share_type: ShareType };

/**
 * Result型（成功または失敗）
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * シェア種類ごとの気持ち選択肢
 */
export const SHARE_TYPE_FEELINGS: Record<ShareType, string[]> = {
  support_needed: ['とても辛い', '疲れた', '不安', 'モヤモヤする'],
  joy_share: ['すごく嬉しい!', '良いことがあった', '幸せ', '充実してる'],
  achievement: ['やり切った!', '勉強頑張った', '体動かした', '目標達成'],
};

/**
 * シェア種類の検証
 */
export function isValidShareType(value: string): value is ShareType {
  return ['support_needed', 'joy_share', 'achievement'].includes(value);
}

/**
 * 気持ちの検証（シェア種類に応じた選択肢かチェック）
 */
export function isValidFeeling(
  feeling: string,
  shareType: ShareType
): boolean {
  return SHARE_TYPE_FEELINGS[shareType].includes(feeling);
}
