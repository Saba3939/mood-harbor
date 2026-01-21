/**
 * HarborServiceのユニットテスト
 * TDD: RED - まずテストを書いてから実装する
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HarborService } from '@/lib/services/harbor';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ShareType } from '@/lib/types/share';
import type { HarborFilters, HarborPost } from '@/lib/types/harbor';

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn(),
  channel: jest.fn(),
} as unknown as SupabaseClient;

describe('HarborService', () => {
  let service: HarborService;

  beforeEach(() => {
    service = new HarborService(mockSupabase);
    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('share_typeでフィルタリングして投稿を取得できる', async () => {
      const mockPosts = [
        {
          id: 'share-1',
          user_id: 'user-1',
          mood_record_id: 'record-1',
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: 'つらい',
          reaction_count: 3,
          created_at: '2026-01-19T10:00:00.000Z',
          expires_at: '2026-01-20T10:00:00.000Z',
          profiles: {
            nickname: 'テストユーザー1',
            avatar_id: 'cat_01',
          },
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockPosts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof jest.fn>).mockReturnValue(
        mockFrom()
      );

      const filters: HarborFilters = {
        share_type: 'support_needed',
        limit: 20,
        offset: 0,
      };

      const result = await service.getFeed(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].share.share_type).toBe('support_needed');
        expect(result.value[0].user.nickname).toBe('テストユーザー1');
      }
    });

    it('newest順でソートできる', async () => {
      const mockPosts = [
        {
          id: 'share-1',
          user_id: 'user-1',
          mood_record_id: 'record-1',
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: null,
          reaction_count: 0,
          created_at: '2026-01-19T12:00:00.000Z',
          expires_at: '2026-01-20T12:00:00.000Z',
          profiles: {
            nickname: 'テストユーザー1',
            avatar_id: 'cat_01',
          },
        },
        {
          id: 'share-2',
          user_id: 'user-2',
          mood_record_id: 'record-2',
          share_type: 'support_needed',
          feeling: '疲れた',
          message: null,
          reaction_count: 0,
          created_at: '2026-01-19T11:00:00.000Z',
          expires_at: '2026-01-20T11:00:00.000Z',
          profiles: {
            nickname: 'テストユーザー2',
            avatar_id: 'dog_01',
          },
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockPosts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof jest.fn>).mockReturnValue(
        mockFrom()
      );

      const filters: HarborFilters = {
        share_type: 'support_needed',
        sort_by: 'newest',
        limit: 20,
        offset: 0,
      };

      const result = await service.getFeed(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        // 新しい投稿が最初
        expect(result.value[0].share.id).toBe('share-1');
        expect(result.value[1].share.id).toBe('share-2');
      }
    });

    it('most_reactions順でソートできる', async () => {
      const mockPosts = [
        {
          id: 'share-1',
          user_id: 'user-1',
          mood_record_id: 'record-1',
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: null,
          reaction_count: 10,
          created_at: '2026-01-19T10:00:00.000Z',
          expires_at: '2026-01-20T10:00:00.000Z',
          profiles: {
            nickname: 'テストユーザー1',
            avatar_id: 'cat_01',
          },
        },
        {
          id: 'share-2',
          user_id: 'user-2',
          mood_record_id: 'record-2',
          share_type: 'support_needed',
          feeling: '疲れた',
          message: null,
          reaction_count: 3,
          created_at: '2026-01-19T11:00:00.000Z',
          expires_at: '2026-01-20T11:00:00.000Z',
          profiles: {
            nickname: 'テストユーザー2',
            avatar_id: 'dog_01',
          },
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockPosts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof jest.fn>).mockReturnValue(
        mockFrom()
      );

      const filters: HarborFilters = {
        share_type: 'support_needed',
        sort_by: 'most_reactions',
        limit: 20,
        offset: 0,
      };

      const result = await service.getFeed(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        // reaction_countが多い投稿が最初
        expect(result.value[0].share.reaction_count).toBe(10);
        expect(result.value[1].share.reaction_count).toBe(3);
      }
    });

    it('24時間以内の投稿のみを取得する', async () => {
      const now = new Date('2026-01-19T10:00:00.000Z');
      const mockPosts = [
        {
          id: 'share-1',
          user_id: 'user-1',
          mood_record_id: 'record-1',
          share_type: 'support_needed',
          feeling: 'とても辛い',
          message: null,
          reaction_count: 0,
          created_at: '2026-01-19T09:00:00.000Z',
          expires_at: '2026-01-20T09:00:00.000Z', // まだ有効
          profiles: {
            nickname: 'テストユーザー1',
            avatar_id: 'cat_01',
          },
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockPosts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof jest.fn>).mockReturnValue(
        mockFrom()
      );

      const filters: HarborFilters = {
        share_type: 'support_needed',
        limit: 20,
        offset: 0,
      };

      const result = await service.getFeed(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        // expires_atが未来の投稿のみ
        const expiresAt = new Date(result.value[0].share.expires_at);
        expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it('limitとoffsetでページネーションできる', async () => {
      const mockPosts = [
        {
          id: 'share-3',
          user_id: 'user-3',
          mood_record_id: 'record-3',
          share_type: 'support_needed',
          feeling: '不安',
          message: null,
          reaction_count: 0,
          created_at: '2026-01-19T08:00:00.000Z',
          expires_at: '2026-01-20T08:00:00.000Z',
          profiles: {
            nickname: 'テストユーザー3',
            avatar_id: 'rabbit_01',
          },
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockPosts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof jest.fn>).mockReturnValue(
        mockFrom()
      );

      const filters: HarborFilters = {
        share_type: 'support_needed',
        limit: 1,
        offset: 2,
      };

      const result = await service.getFeed(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].share.id).toBe('share-3');
      }
    });

    it('データベースエラー時にエラーを返す', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof jest.fn>).mockReturnValue(
        mockFrom()
      );

      const filters: HarborFilters = {
        share_type: 'support_needed',
        limit: 20,
        offset: 0,
      };

      const result = await service.getFeed(filters);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FILTERS');
      }
    });
  });

  describe('subscribeToFeed', () => {
    it('Realtimeチャンネルに購読できる', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn(),
      };

      (mockSupabase.channel as ReturnType<typeof jest.fn>).mockReturnValue(
        mockChannel
      );

      const callback = jest.fn();
      const unsubscribe = service.subscribeToFeed('support_needed', callback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('harbor');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('新規シェア作成イベントを受信できる', () => {
      const mockChannel = {
        on: jest.fn((type: string, config: unknown, callback: (payload: unknown) => void) => {
          // share:createdイベントをシミュレート
          if (type === 'broadcast') {
            setTimeout(() => {
              callback({
                payload: {
                  share_id: 'share-1',
                  user_id: 'user-1',
                  share_type: 'support_needed',
                },
              });
            }, 0);
          }
          return mockChannel;
        }),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn(),
      };

      (mockSupabase.channel as ReturnType<typeof jest.fn>).mockReturnValue(
        mockChannel
      );

      const callback = jest.fn();
      service.subscribeToFeed('support_needed', callback);

      // イベントが発火されるまで待機
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
              payload: expect.objectContaining({
                share_id: 'share-1',
                share_type: 'support_needed',
              }),
            })
          );
          resolve();
        }, 10);
      });
    });
  });
});
