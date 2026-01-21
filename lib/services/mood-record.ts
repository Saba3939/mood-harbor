import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MoodRecord,
  CreateRecordParams,
  UpdateRecordParams,
  RecordFilters,
  RecordError,
  Result,
} from '@/lib/types/mood-record';

/**
 * MoodRecordService
 * 気分記録のCRUD処理と関連データ管理を行うサービス
 */
export class MoodRecordService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 気分記録を作成する
   */
  async createRecord(
    params: CreateRecordParams
  ): Promise<Result<MoodRecord, RecordError>> {
    // バリデーション
    const validationError = this.validateCreateParams(params);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const { data, error } = await this.supabase
      .from('mood_records')
      .insert({
        user_id: params.user_id,
        mood_level: params.mood_level,
        reasons: params.reasons,
        question_id: params.question_id,
        answer_option: params.answer_option,
        memo: params.memo || null,
        time_of_day: params.time_of_day || null,
        weather: params.weather || null,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'RECORD_NOT_FOUND', record_id: '' },
      };
    }

    return {
      success: true,
      value: data as MoodRecord,
    };
  }

  /**
   * 記録を更新する
   */
  async updateRecord(
    recordId: string,
    updates: UpdateRecordParams
  ): Promise<Result<MoodRecord, RecordError>> {
    // バリデーション
    const validationError = this.validateUpdateParams(updates);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const updateData: Record<string, unknown> = {};
    if (updates.mood_level !== undefined)
      updateData.mood_level = updates.mood_level;
    if (updates.reasons !== undefined) updateData.reasons = updates.reasons;
    if (updates.answer_option !== undefined)
      updateData.answer_option = updates.answer_option;
    if (updates.memo !== undefined) updateData.memo = updates.memo;
    if (updates.time_of_day !== undefined)
      updateData.time_of_day = updates.time_of_day;
    if (updates.weather !== undefined) updateData.weather = updates.weather;

    const { data, error } = await this.supabase
      .from('mood_records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'RECORD_NOT_FOUND', record_id: recordId },
      };
    }

    return {
      success: true,
      value: data as MoodRecord,
    };
  }

  /**
   * 指定したIDの記録を取得する
   */
  async getRecord(
    recordId: string
  ): Promise<Result<MoodRecord | null, RecordError>> {
    const { data, error } = await this.supabase
      .from('mood_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'RECORD_NOT_FOUND', record_id: recordId },
      };
    }

    return {
      success: true,
      value: data as MoodRecord,
    };
  }

  /**
   * ユーザーの記録を取得する（フィルター付き）
   */
  async getRecordsByUser(
    userId: string,
    filters?: RecordFilters
  ): Promise<Result<MoodRecord[], RecordError>> {
    let query = this.supabase
      .from('mood_records')
      .select('*')
      .eq('user_id', userId);

    // 日付フィルター適用
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters?.mood_levels && filters.mood_levels.length > 0) {
      query = query.in('mood_level', filters.mood_levels);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return {
        success: false,
        error: { type: 'RECORD_NOT_FOUND', record_id: userId },
      };
    }

    return {
      success: true,
      value: (data || []) as MoodRecord[],
    };
  }

  /**
   * 記録を削除する
   */
  async deleteRecord(recordId: string): Promise<Result<void, RecordError>> {
    const { error } = await this.supabase
      .from('mood_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      return {
        success: false,
        error: { type: 'RECORD_NOT_FOUND', record_id: recordId },
      };
    }

    return {
      success: true,
      value: undefined,
    };
  }

  /**
   * 作成パラメータのバリデーション
   * @private
   */
  private validateCreateParams(
    params: CreateRecordParams
  ): RecordError | null {
    // mood_levelのバリデーション（1-5）
    if (params.mood_level < 1 || params.mood_level > 5) {
      return { type: 'INVALID_MOOD_LEVEL', level: params.mood_level };
    }

    // reasonsの最大数チェック（最大2つ）
    if (params.reasons.length > 2) {
      return { type: 'TOO_MANY_REASONS', max: 2 };
    }

    // memoの文字数チェック（最大10文字）
    if (params.memo && params.memo.length > 10) {
      return { type: 'MEMO_TOO_LONG', max: 10 };
    }

    return null;
  }

  /**
   * 更新パラメータのバリデーション
   * @private
   */
  private validateUpdateParams(
    updates: UpdateRecordParams
  ): RecordError | null {
    // mood_levelのバリデーション（1-5）
    if (
      updates.mood_level !== undefined &&
      (updates.mood_level < 1 || updates.mood_level > 5)
    ) {
      return { type: 'INVALID_MOOD_LEVEL', level: updates.mood_level };
    }

    // reasonsの最大数チェック（最大2つ）
    if (updates.reasons !== undefined && updates.reasons.length > 2) {
      return { type: 'TOO_MANY_REASONS', max: 2 };
    }

    // memoの文字数チェック（最大10文字）
    if (updates.memo !== undefined && updates.memo.length > 10) {
      return { type: 'MEMO_TOO_LONG', max: 10 };
    }

    return null;
  }
}
