/**
 * 気分レベル（1-5）
 * 1: とても疲れた, 2: 少し疲れた, 3: 普通, 4: 良い, 5: とても良い
 */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

/**
 * 理由カテゴリー
 */
export type ReasonCategory =
  | 'study_school' // 勉強・学校
  | 'relationships' // 人間関係
  | 'health' // 体調・健康
  | 'hobbies' // 趣味・遊び
  | 'work' // バイト・仕事
  | 'family' // 家族・家のこと
  | 'sleep' // 睡眠
  | 'no_reason'; // 特に理由なし

/**
 * 時間帯
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * 天気
 */
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'other';

/**
 * 記録作成パラメータ
 */
export type CreateRecordParams = {
  user_id: string;
  mood_level: MoodLevel;
  reasons: ReasonCategory[]; // 最大2つ
  question_id: string;
  answer_option: string;
  memo?: string; // 最大10文字
  time_of_day?: TimeOfDay;
  weather?: Weather;
};

/**
 * 記録更新パラメータ
 */
export type UpdateRecordParams = Partial<
  Omit<CreateRecordParams, 'user_id' | 'question_id'>
>;

/**
 * 気分記録
 */
export type MoodRecord = {
  id: string;
  user_id: string;
  mood_level: MoodLevel;
  reasons: ReasonCategory[];
  question_id: string;
  answer_option: string;
  memo: string | null;
  time_of_day: TimeOfDay | null;
  weather: Weather | null;
  created_at: string;
  updated_at: string;
};

/**
 * 記録フィルター
 */
export type RecordFilters = {
  start_date?: string;
  end_date?: string;
  mood_levels?: MoodLevel[];
};

/**
 * 記録エラー型
 */
export type RecordError =
  | { type: 'INVALID_MOOD_LEVEL'; level: number }
  | { type: 'TOO_MANY_REASONS'; max: number }
  | { type: 'MEMO_TOO_LONG'; max: number }
  | { type: 'RECORD_NOT_FOUND'; record_id: string };

/**
 * Result型
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
