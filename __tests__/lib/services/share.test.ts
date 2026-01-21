/**
 * ShareService のテスト
 * TDD: テストを先に書いてから実装する
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShareService } from '@/lib/services/share';
import type { CreateShareParams, Share } from '@/lib/types/share';

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn(),
  channel: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue({ error: null }),
    on: jest.fn(),
    unsubscribe: jest.fn(),
  }),
};

describe('ShareService', () => {
  let shareService: ShareService;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error - モックのため型エラーを無視
    shareService = new ShareService(mockSupabase);
  });

  describe('createShare', () => {
    it('正常なパラメータでシェアを作成できる', async () => {
      const params: CreateShareParams = {
        user_id: 'user-123',
        mood_record_id: 'record-456',
        share_type: 'support_needed',
        feeling: 'とても辛い',
        message: 'つらいです',
      };

      const mockShare: Share = {
        id: 'share-789',
        user_id: params.user_id,
        mood_record_id: params.mood_record_id,
        share_type: params.share_type,
        feeling: params.feeling,
        message: params.message || null,
        reaction_count: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockShare,
              error: null,
            }),
          }),
        }),
      });

      const result = await shareService.createShare(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('share-789');
        expect(result.value.share_type).toBe('support_needed');
        expect(result.value.feeling).toBe('とても辛い');
      }
    });

    it('メッセージが10文字を超えるとエラーを返す', async () => {
      const params: CreateShareParams = {
        user_id: 'user-123',
        mood_record_id: 'record-456',
        share_type: 'support_needed',
        feeling: 'とても辛い',
        message: '12345678901', // 11文字
      };

      const result = await shareService.createShare(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MESSAGE_TOO_LONG');
        expect(result.error.max).toBe(10);
      }
    });

    it('無効なshare_typeでエラーを返す', async () => {
      const params = {
        user_id: 'user-123',
        mood_record_id: 'record-456',
        share_type: 'invalid_type',
        feeling: 'とても辛い',
      } as CreateShareParams;

      const result = await shareService.createShare(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_SHARE_TYPE');
      }
    });

    it('share_typeに対応しないfeelingでエラーを返す', async () => {
      const params: CreateShareParams = {
        user_id: 'user-123',
        mood_record_id: 'record-456',
        share_type: 'support_needed',
        feeling: 'すごく嬉しい！', // joy_shareの気持ち
      };

      const result = await shareService.createShare(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FEELING');
      }
    });

    it('expires_atがcreated_atから24時間後に設定される', async () => {
      const params: CreateShareParams = {
        user_id: 'user-123',
        mood_record_id: 'record-456',
        share_type: 'joy_share',
        feeling: 'すごく嬉しい！',
      };

      const now = new Date('2024-01-15T10:00:00Z');
      const expectedExpires = new Date('2024-01-16T10:00:00Z');

      const mockShare: Share = {
        id: 'share-789',
        user_id: params.user_id,
        mood_record_id: params.mood_record_id,
        share_type: params.share_type,
        feeling: params.feeling,
        message: null,
        reaction_count: 0,
        created_at: now.toISOString(),
        expires_at: expectedExpires.toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockShare,
              error: null,
            }),
          }),
        }),
      });

      const result = await shareService.createShare(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const createdAt = new Date(result.value.created_at);
        const expiresAt = new Date(result.value.expires_at);
        const diff = expiresAt.getTime() - createdAt.getTime();
        expect(diff).toBe(24 * 60 * 60 * 1000); // 24時間
      }
    });
  });

  describe('getShare', () => {
    it('指定したIDのシェアを取得できる', async () => {
      const mockShare: Share = {
        id: 'share-789',
        user_id: 'user-123',
        mood_record_id: 'record-456',
        share_type: 'achievement',
        feeling: 'やり切った!',
        message: null,
        reaction_count: 5,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockShare,
              error: null,
            }),
          }),
        }),
      });

      const result = await shareService.getShare('share-789');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value?.id).toBe('share-789');
        expect(result.value?.reaction_count).toBe(5);
      }
    });

    it('存在しないIDの場合はnullを返す', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await shareService.getShare('invalid-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SHARE_NOT_FOUND');
      }
    });
  });

  describe('deleteShare', () => {
    it('シェアを削除できる', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const result = await shareService.deleteShare('share-789', 'user-123');

      expect(result.success).toBe(true);
    });

    it('削除エラーが発生した場合はエラーを返す', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      });

      const result = await shareService.deleteShare('share-789', 'user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SHARE_NOT_FOUND');
      }
    });
  });
});
