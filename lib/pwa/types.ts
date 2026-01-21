/**
 * PWA関連の型定義
 */

/**
 * 気分レベル（1-5）
 */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

/**
 * 理由カテゴリー
 */
export type ReasonCategory =
  | "study_school"
  | "relationships"
  | "health"
  | "hobbies"
  | "work"
  | "family"
  | "sleep"
  | "no_reason";

/**
 * 時間帯
 */
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * 天気
 */
export type Weather = "sunny" | "cloudy" | "rainy" | "other";

/**
 * オフライン記録データ
 */
export type OfflineRecordData = {
  user_id: string;
  mood_level: MoodLevel;
  reasons: ReasonCategory[];
  question_id: string;
  answer_option: string;
  memo?: string;
  time_of_day?: TimeOfDay;
  weather?: Weather;
};

/**
 * オフライン記録（IndexedDB保存用）
 */
export type OfflineRecord = {
  temp_id: string;
  data: OfflineRecordData;
  created_at: string;
};

/**
 * ネットワークステータス
 */
export type NetworkStatus = "online" | "offline" | "unknown";

/**
 * 同期結果
 */
export type SyncResult = {
  synced_count: number;
  failed_count: number;
  errors: Array<{ temp_id: string; error: string }>;
};
