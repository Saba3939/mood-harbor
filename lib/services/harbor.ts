/**
 * HarborService
 * ハーバー（タイムライン）のフィード取得とリアルタイム購読
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type {
  HarborFilters,
  HarborPost,
  HarborError,
  Result,
  HarborSubscriptionCallback,
} from '@/lib/types/harbor';
import type { Share } from '@/lib/types/share';
import { HARBOR_CHANNEL, REALTIME_EVENTS } from '@/lib/utils/realtime';

export class HarborService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * ハーバーフィードを取得する
   * - share_type別にフィルタリング
   * - 24時間以内の投稿のみ（expires_at > NOW()）
   * - sort_byに応じてソート
   * - ページネーション対応
   */
  async getFeed(
    filters: HarborFilters
  ): Promise<Result<HarborPost[], HarborError>> {
    const {
      share_type,
      time_of_day,
      sort_by = 'newest',
      limit = 20,
      offset = 0,
    } = filters;

    // limitは1-100に制限
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    // ベースクエリ: sharesとprofilesとmood_recordsをJOIN
    let query = this.supabase
      .from('shares')
      .select(
        `
        *,
        profiles:user_id (
          nickname,
          avatar_id
        ),
        mood_records:mood_record_id (
          time_of_day
        )
      `
      )
      .eq('share_type', share_type)
      .gt('expires_at', new Date().toISOString());

    // 時間帯フィルターを適用（mood_recordsのtime_of_dayでフィルター）
    if (time_of_day) {
      query = query.eq('mood_records.time_of_day', time_of_day);
    }

    // ソート順を設定
    if (sort_by === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort_by === 'most_reactions') {
      query = query.order('reaction_count', { ascending: false });
    }

    // ページネーション
    query = query.range(offset, offset + safeLimit - 1);

    const { data, error } = await query;

    if (error || !data) {
      return {
        success: false,
        error: { type: 'INVALID_FILTERS' },
      };
    }

    // HarborPost形式に変換
    const posts: HarborPost[] = await Promise.all(
      data.map(async (row) => {
        // 型アサーション: Supabaseのselect結果をShare + profiles構造として扱う
        const share = row as unknown as Share & {
          profiles: { nickname: string; avatar_id: string };
        };

        // TODO: 現在のユーザーが応援済みかチェック（将来的に実装）
        const userReacted = false;

        return {
          share: {
            id: share.id,
            user_id: share.user_id,
            mood_record_id: share.mood_record_id,
            share_type: share.share_type,
            feeling: share.feeling,
            message: share.message,
            reaction_count: share.reaction_count,
            created_at: share.created_at,
            expires_at: share.expires_at,
          },
          user: {
            nickname: share.profiles.nickname,
            avatar_id: share.profiles.avatar_id,
          },
          reactions: {
            count: share.reaction_count,
            user_reacted: userReacted,
          },
        };
      })
    );

    return {
      success: true,
      value: posts,
    };
  }

  /**
   * ハーバーフィードのリアルタイム更新を購読する
   * - share:created: 新規シェア投稿
   * - reaction:added: 応援追加
   * - reaction:removed: 応援削除
   *
   * @returns unsubscribe関数
   */
  subscribeToFeed(
    shareType: string,
    callback: HarborSubscriptionCallback
  ): () => void {
    const channel = this.supabase.channel(HARBOR_CHANNEL);

    // share:createdイベントを購読
    channel.on(
      'broadcast',
      { event: REALTIME_EVENTS.SHARE_CREATED },
      async (payload) => {
        // share_typeが一致する場合のみコールバック実行
        if (payload.payload.share_type === shareType) {
          // 新規投稿の詳細を取得してコールバック実行
          const shareId = payload.payload.share_id;
          const result = await this.getPostByShareId(shareId);
          if (result.success && result.value) {
            callback(result.value);
          }
        }
      }
    );

    // reaction:addedイベントを購読
    channel.on(
      'broadcast',
      { event: REALTIME_EVENTS.REACTION_ADDED },
      async (payload) => {
        // 応援が追加された投稿を更新
        const shareId = payload.payload.share_id;
        const result = await this.getPostByShareId(shareId);
        if (result.success && result.value) {
          callback(result.value);
        }
      }
    );

    // reaction:removedイベントを購読
    channel.on(
      'broadcast',
      { event: REALTIME_EVENTS.REACTION_REMOVED },
      async (payload) => {
        // 応援が削除された投稿を更新
        const shareId = payload.payload.share_id;
        const result = await this.getPostByShareId(shareId);
        if (result.success && result.value) {
          callback(result.value);
        }
      }
    );

    channel.subscribe();

    // unsubscribe関数を返す
    return () => {
      channel.unsubscribe();
    };
  }

  /**
   * 指定したshare_idの投稿を取得する（内部ヘルパー）
   * @private
   */
  private async getPostByShareId(
    shareId: string
  ): Promise<Result<HarborPost | null, HarborError>> {
    const { data, error } = await this.supabase
      .from('shares')
      .select(
        `
        *,
        profiles:user_id (
          nickname,
          avatar_id
        )
      `
      )
      .eq('id', shareId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: { type: 'INVALID_FILTERS' },
      };
    }

    // 型アサーション
    const share = data as unknown as Share & {
      profiles: { nickname: string; avatar_id: string };
    };

    // TODO: 現在のユーザーが応援済みかチェック
    const userReacted = false;

    const post: HarborPost = {
      share: {
        id: share.id,
        user_id: share.user_id,
        mood_record_id: share.mood_record_id,
        share_type: share.share_type,
        feeling: share.feeling,
        message: share.message,
        reaction_count: share.reaction_count,
        created_at: share.created_at,
        expires_at: share.expires_at,
      },
      user: {
        nickname: share.profiles.nickname,
        avatar_id: share.profiles.avatar_id,
      },
      reactions: {
        count: share.reaction_count,
        user_reacted: userReacted,
      },
    };

    return {
      success: true,
      value: post,
    };
  }
}
