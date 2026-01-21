/**
 * ShareService
 * シェア投稿の作成と管理を行うサービス
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Share,
  CreateShareParams,
  ShareError,
  Result,
} from '@/lib/types/share';
import { isValidShareType, isValidFeeling } from '@/lib/types/share';
import DOMPurify from 'isomorphic-dompurify';
import { broadcastShareCreated, broadcastShareDeleted } from '@/lib/utils/realtime';

export class ShareService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * シェアを作成する
   * XSS対策としてメッセージをサニタイゼーション
   * expires_atはcreated_atから24時間後に自動設定
   */
  async createShare(
    params: CreateShareParams
  ): Promise<Result<Share, ShareError>> {
    // バリデーション
    const validationError = this.validateCreateParams(params);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // メッセージのサニタイゼーション（XSS対策）
    const sanitizedMessage = params.message
      ? DOMPurify.sanitize(params.message, { ALLOWED_TAGS: [] })
      : null;

    // expires_at を created_at + 24時間で設定
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('shares')
      .insert({
        user_id: params.user_id,
        mood_record_id: params.mood_record_id,
        share_type: params.share_type,
        feeling: params.feeling,
        message: sanitizedMessage,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'SHARE_NOT_FOUND', share_id: '' },
      };
    }

    // Supabase Realtimeでshare:createdイベントをブロードキャスト
    await broadcastShareCreated(this.supabase, {
      share_id: data.id,
      user_id: data.user_id,
      share_type: data.share_type,
    });

    return {
      success: true,
      value: data as Share,
    };
  }

  /**
   * 指定したIDのシェアを取得する
   */
  async getShare(shareId: string): Promise<Result<Share | null, ShareError>> {
    const { data, error } = await this.supabase
      .from('shares')
      .select('*')
      .eq('id', shareId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'SHARE_NOT_FOUND', share_id: shareId },
      };
    }

    return {
      success: true,
      value: data as Share,
    };
  }

  /**
   * シェアを削除する
   */
  async deleteShare(
    shareId: string,
    userId: string
  ): Promise<Result<void, ShareError>> {
    const { error } = await this.supabase
      .from('shares')
      .delete()
      .eq('id', shareId)
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        error: { type: 'SHARE_NOT_FOUND', share_id: shareId },
      };
    }

    // Supabase Realtimeでshare:deletedイベントをブロードキャスト
    await broadcastShareDeleted(this.supabase, { share_id: shareId });

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
    params: CreateShareParams
  ): ShareError | null {
    // share_typeのバリデーション
    if (!isValidShareType(params.share_type)) {
      return { type: 'INVALID_SHARE_TYPE', share_type: params.share_type };
    }

    // feelingのバリデーション（share_typeに対応する選択肢かチェック）
    if (!isValidFeeling(params.feeling, params.share_type)) {
      return {
        type: 'INVALID_FEELING',
        feeling: params.feeling,
        share_type: params.share_type,
      };
    }

    // messageの文字数チェック（最大10文字）
    if (params.message && params.message.length > 10) {
      return { type: 'MESSAGE_TOO_LONG', max: 10 };
    }

    return null;
  }
}
