import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createRecordAction,
  getRecordAction,
  getRecordsByUserAction,
  updateRecordAction,
  deleteRecordAction,
} from '@/lib/actions/mood-record';
import type { CreateRecordParams, MoodLevel } from '@/lib/types/mood-record';

// Supabaseクライアントのモック
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@/lib/supabase/server');

describe('Mood Record Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('createRecordAction', () => {
    it('記録を作成できる', async () => {
      const params: CreateRecordParams = {
        user_id: 'user-123',
        mood_level: 4 as MoodLevel,
        reasons: ['study_school'],
        question_id: 'question-456',
        answer_option: '良かった',
      };

      const mockRecord = {
        id: 'record-789',
        ...params,
        memo: null,
        time_of_day: null,
        weather: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient.from as any).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockRecord,
              error: null,
            }),
          }),
        }),
      });

      const result = await createRecordAction(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('record-789');
        expect(result.value.mood_level).toBe(4);
      }
    });

    it('バリデーションエラーを返す', async () => {
      const params: CreateRecordParams = {
        user_id: 'user-123',
        mood_level: 6 as MoodLevel,
        reasons: ['study_school'],
        question_id: 'question-456',
        answer_option: '良かった',
      };

      const result = await createRecordAction(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_MOOD_LEVEL');
      }
    });
  });

  describe('getRecordAction', () => {
    it('記録を取得できる', async () => {
      const mockRecord = {
        id: 'record-123',
        user_id: 'user-456',
        mood_level: 3,
        reasons: ['health'],
        question_id: 'question-789',
        answer_option: 'まあまあ',
        memo: null,
        time_of_day: null,
        weather: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockRecord,
              error: null,
            }),
          }),
        }),
      });

      const result = await getRecordAction('record-123');

      expect(result.success).toBe(true);
      if (result.success && result.value) {
        expect(result.value.id).toBe('record-123');
      }
    });
  });

  describe('getRecordsByUserAction', () => {
    it('ユーザーの全記録を取得できる', async () => {
      const mockRecords = [
        {
          id: 'record-1',
          user_id: 'user-123',
          mood_level: 4,
          reasons: ['hobbies'],
          question_id: 'q1',
          answer_option: 'option1',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      });

      const result = await getRecordsByUserAction('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('updateRecordAction', () => {
    it('記録を更新できる', async () => {
      const mockUpdatedRecord = {
        id: 'record-123',
        user_id: 'user-456',
        mood_level: 5,
        reasons: ['hobbies'],
        question_id: 'question-789',
        answer_option: 'とても楽しかった',
        memo: '更新後',
        time_of_day: 'evening',
        weather: 'sunny',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient.from as any).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedRecord,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updateRecordAction('record-123', {
        mood_level: 5,
        memo: '更新後',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.mood_level).toBe(5);
      }
    });
  });

  describe('deleteRecordAction', () => {
    it('記録を削除できる', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient.from as any).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await deleteRecordAction('record-123');

      expect(result.success).toBe(true);
    });
  });
});
