/**
 * Supabase Realtimeユーティリティ
 * リアルタイム更新のための共通機能
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * ハーバーチャンネルのチャンネル名
 */
export const HARBOR_CHANNEL = 'harbor';

/**
 * Realtimeイベント名
 */
export const REALTIME_EVENTS = {
  SHARE_CREATED: 'share:created',
  SHARE_DELETED: 'share:deleted',
  REACTION_ADDED: 'reaction:added',
  REACTION_REMOVED: 'reaction:removed',
} as const;

/**
 * ハーバーチャンネルに購読する
 *
 * @example
 * ```ts
 * const channel = subscribeToHarbor(supabase, (payload) => {
 *   console.log('New share:', payload);
 * });
 *
 * // 購読解除
 * channel.unsubscribe();
 * ```
 */
export function subscribeToHarbor(
  supabase: SupabaseClient,
  onShareCreated?: (payload: unknown) => void,
  onShareDeleted?: (payload: unknown) => void
): RealtimeChannel {
  const channel = supabase.channel(HARBOR_CHANNEL);

  if (onShareCreated) {
    channel.on('broadcast', { event: REALTIME_EVENTS.SHARE_CREATED }, (payload) => {
      onShareCreated(payload);
    });
  }

  if (onShareDeleted) {
    channel.on('broadcast', { event: REALTIME_EVENTS.SHARE_DELETED }, (payload) => {
      onShareDeleted(payload);
    });
  }

  channel.subscribe();

  return channel;
}

/**
 * ハーバーチャンネルにシェア作成イベントをブロードキャストする
 *
 * @example
 * ```ts
 * await broadcastShareCreated(supabase, { share_id: '123', user_id: 'abc' });
 * ```
 */
export async function broadcastShareCreated(
  supabase: SupabaseClient,
  payload: { share_id: string; user_id: string; share_type: string }
): Promise<void> {
  const channel = supabase.channel(HARBOR_CHANNEL);
  await channel.send({
    type: 'broadcast',
    event: REALTIME_EVENTS.SHARE_CREATED,
    payload,
  });
}

/**
 * ハーバーチャンネルにシェア削除イベントをブロードキャストする
 */
export async function broadcastShareDeleted(
  supabase: SupabaseClient,
  payload: { share_id: string }
): Promise<void> {
  const channel = supabase.channel(HARBOR_CHANNEL);
  await channel.send({
    type: 'broadcast',
    event: REALTIME_EVENTS.SHARE_DELETED,
    payload,
  });
}

/**
 * ハーバーチャンネルに応援追加イベントをブロードキャストする
 *
 * @example
 * ```ts
 * await broadcastReactionAdded(supabase, {
 *   reaction_id: '123',
 *   share_id: 'abc',
 *   user_id: 'xyz',
 *   stamp_type: '応援してる！'
 * });
 * ```
 */
export async function broadcastReactionAdded(
  supabase: SupabaseClient,
  payload: {
    reaction_id: string;
    share_id: string;
    user_id: string;
    stamp_type: string;
  }
): Promise<void> {
  const channel = supabase.channel(HARBOR_CHANNEL);
  await channel.send({
    type: 'broadcast',
    event: REALTIME_EVENTS.REACTION_ADDED,
    payload,
  });
}

/**
 * ハーバーチャンネルに応援削除イベントをブロードキャストする
 */
export async function broadcastReactionRemoved(
  supabase: SupabaseClient,
  payload: { reaction_id: string; share_id: string }
): Promise<void> {
  const channel = supabase.channel(HARBOR_CHANNEL);
  await channel.send({
    type: 'broadcast',
    event: REALTIME_EVENTS.REACTION_REMOVED,
    payload,
  });
}
