import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MoodRecordService } from '@/lib/services/mood-record';
import type {
  MoodLevel,
  ReasonCategory,
  CreateRecordParams,
} from '@/lib/types/mood-record';

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn(),
};

describe('MoodRecordService', () => {
  let service: MoodRecordService;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error - モックのため型エラーを無視
    service = new MoodRecordService(mockSupabase);
  });

  describe('createRecord', () => {
    const validParams: CreateRecordParams = {
      user_id: 'user-123',
      mood_level: 4 as MoodLevel,
      reasons: ['study_school', 'relationships'] as ReasonCategory[],
      question_id: 'question-456',
      answer_option: 'とても楽しかった',
    };

    it('有効なパラメータで記録を作成できる', async () => {
      const mockRecord = {
        id: 'record-789',
        ...validParams,
        memo: null,
        time_of_day: null,
        weather: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockRecord,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createRecord(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.mood_level).toBe(4);
        expect(result.value.reasons).toEqual(['study_school', 'relationships']);
        expect(result.value.user_id).toBe('user-123');
      }
    });

    it('メモ付きで記録を作成できる', async () => {
      const paramsWithMemo: CreateRecordParams = {
        ...validParams,
        memo: 'テスト',
        time_of_day: 'evening',
        weather: 'sunny',
      };

      const mockRecord = {
        id: 'record-790',
        ...paramsWithMemo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockRecord,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createRecord(paramsWithMemo);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.memo).toBe('テスト');
        expect(result.value.time_of_day).toBe('evening');
        expect(result.value.weather).toBe('sunny');
      }
    });

    it('無効なmood_levelでエラーを返す', async () => {
      const invalidParams = {
        ...validParams,
        mood_level: 6 as MoodLevel,
      };

      const result = await service.createRecord(invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_MOOD_LEVEL');
        if (result.error.type === 'INVALID_MOOD_LEVEL') {
          expect(result.error.level).toBe(6);
        }
      }
    });

    it('3つ以上の理由でエラーを返す', async () => {
      const invalidParams = {
        ...validParams,
        reasons: [
          'study_school',
          'relationships',
          'health',
        ] as ReasonCategory[],
      };

      const result = await service.createRecord(invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('TOO_MANY_REASONS');
        if (result.error.type === 'TOO_MANY_REASONS') {
          expect(result.error.max).toBe(2);
        }
      }
    });

    it('10文字を超えるメモでエラーを返す', async () => {
      const invalidParams = {
        ...validParams,
        memo: 'これは11文字以上です',
      };

      const result = await service.createRecord(invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MEMO_TOO_LONG');
        if (result.error.type === 'MEMO_TOO_LONG') {
          expect(result.error.max).toBe(10);
        }
      }
    });
  });

  describe('getRecord', () => {
    it('指定したIDの記録を返す', async () => {
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
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockRecord,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getRecord('record-123');

      expect(result.success).toBe(true);
      if (result.success && result.value) {
        expect(result.value.id).toBe('record-123');
        expect(result.value.mood_level).toBe(3);
      }
    });

    it('記録が見つからない場合、エラーを返す', async () => {
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

      const result = await service.getRecord('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success && result.error.type === 'RECORD_NOT_FOUND') {
        expect(result.error.record_id).toBe('non-existent-id');
      }
    });
  });

  describe('getRecordsByUser', () => {
    it('ユーザーの全記録を返す', async () => {
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
        {
          id: 'record-2',
          user_id: 'user-123',
          mood_level: 3,
          reasons: ['work', 'sleep'],
          question_id: 'q2',
          answer_option: 'option2',
          memo: 'メモ',
          time_of_day: 'morning',
          weather: 'rainy',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getRecordsByUser('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe('record-1');
        expect(result.value[1].id).toBe('record-2');
      }
    });

    it('日付フィルターを適用できる', async () => {
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
          created_at: '2026-01-15T00:00:00Z',
          updated_at: '2026-01-15T00:00:00Z',
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockRecords,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getRecordsByUser('user-123', {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('updateRecord', () => {
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
      (mockSupabase.from as any).mockReturnValue({
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

      const result = await service.updateRecord('record-123', {
        mood_level: 5,
        memo: '更新後',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.mood_level).toBe(5);
        expect(result.value.memo).toBe('更新後');
      }
    });

    it('更新時も10文字を超えるメモでエラーを返す', async () => {
      const result = await service.updateRecord('record-123', {
        memo: 'これは11文字以上です',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MEMO_TOO_LONG');
      }
    });
  });

  describe('deleteRecord', () => {
    it('記録を削除できる', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await service.deleteRecord('record-123');

      expect(result.success).toBe(true);
    });

    it('削除時にエラーが発生した場合、エラーを返す', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      });

      const result = await service.deleteRecord('record-123');

      expect(result.success).toBe(false);
      if (!result.success && result.error.type === 'RECORD_NOT_FOUND') {
        expect(result.error.record_id).toBe('record-123');
      }
    });
  });
});
