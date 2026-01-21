import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DailyQuestion,
  QuestionCategory,
  QuestionError,
  Result,
} from '@/lib/types/daily-question';

/**
 * DailyQuestionService
 * 日替わり質問の取得と管理を行うサービス
 */
export class DailyQuestionService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 今日の質問を取得する
   * 曜日に応じて適切なカテゴリーの質問を返す
   * - 金曜・土曜: weekend
   * - 日曜: sunday
   * - 平日: connection, activity, achievement, feeling のローテーション
   */
  async getTodayQuestion(): Promise<Result<DailyQuestion, QuestionError>> {
    const category = this.getCategoryForToday();

    const { data, error } = await this.supabase
      .from('daily_questions')
      .select('*')
      .eq('category', category)
      .limit(1)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'NO_QUESTION_FOR_TODAY' },
      };
    }

    return {
      success: true,
      value: data as DailyQuestion,
    };
  }

  /**
   * 指定したIDの質問を取得する
   */
  async getQuestionById(
    questionId: string
  ): Promise<Result<DailyQuestion | null, QuestionError>> {
    const { data, error } = await this.supabase
      .from('daily_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'QUESTION_NOT_FOUND', question_id: questionId },
      };
    }

    return {
      success: true,
      value: data as DailyQuestion,
    };
  }

  /**
   * 今日の曜日に応じたカテゴリーを取得する
   * @private
   */
  private getCategoryForToday(): QuestionCategory {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0(日) - 6(土)

    // 金曜(5)または土曜(6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 'weekend';
    }

    // 日曜(0)
    if (dayOfWeek === 0) {
      return 'sunday';
    }

    // 平日(1-4): 月-木
    // カテゴリーをローテーション
    const weekdayCategories: QuestionCategory[] = [
      'connection',
      'activity',
      'achievement',
      'feeling',
    ];

    // 月曜=0, 火曜=1, 水曜=2, 木曜=3
    const weekdayIndex = dayOfWeek - 1;
    return weekdayCategories[weekdayIndex % weekdayCategories.length];
  }
}
