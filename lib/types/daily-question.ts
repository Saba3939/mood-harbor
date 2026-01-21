/**
 * 日替わり質問のカテゴリー
 */
export type QuestionCategory =
  | 'connection' // 人とのつながり系
  | 'activity' // 活動系
  | 'achievement' // 達成感系
  | 'feeling' // 気持ち系
  | 'weekend' // 週末用質問
  | 'sunday'; // 日曜日用質問

/**
 * 日替わり質問
 */
export type DailyQuestion = {
  id: string;
  category: QuestionCategory;
  question_text: string;
  options: string[]; // 3-4個の選択肢
  created_at: string;
};

/**
 * 質問エラー型
 */
export type QuestionError =
  | { type: 'NO_QUESTION_FOR_TODAY' }
  | { type: 'QUESTION_NOT_FOUND'; question_id: string };

/**
 * Result型
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
