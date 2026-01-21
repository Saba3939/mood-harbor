import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DailyQuestionService } from '@/lib/services/daily-question';
import type { QuestionCategory } from '@/lib/types/daily-question';

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn(),
};

describe('DailyQuestionService', () => {
  let service: DailyQuestionService;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error - モックのため型エラーを無視
    service = new DailyQuestionService(mockSupabase);
  });

  describe('getTodayQuestion', () => {
    it('金曜日の場合、weekend カテゴリーの質問を返す', async () => {
      // 金曜日をモック（2026-01-16は金曜日）
      const mockDate = new Date('2026-01-16');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mockQuestion = {
        id: 'test-id-1',
        category: 'weekend' as QuestionCategory,
        question_text: '今週どうだった?',
        options: ['良かった', '普通', '大変だった', 'まあまあ'],
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockQuestion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getTodayQuestion();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.category).toBe('weekend');
        expect(result.value.question_text).toBe('今週どうだった?');
        expect(result.value.options).toHaveLength(4);
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('daily_questions');
    });

    it('土曜日の場合、weekend カテゴリーの質問を返す', async () => {
      // 土曜日をモック（2026-01-17は土曜日）
      const mockDate = new Date('2026-01-17');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mockQuestion = {
        id: 'test-id-2',
        category: 'weekend' as QuestionCategory,
        question_text: '週末の予定は?',
        options: ['リラックス', '外出', '勉強', '特になし'],
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockQuestion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getTodayQuestion();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.category).toBe('weekend');
      }
    });

    it('日曜日の場合、sunday カテゴリーの質問を返す', async () => {
      // 日曜日をモック（2026-01-18は日曜日）
      const mockDate = new Date('2026-01-18');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mockQuestion = {
        id: 'test-id-3',
        category: 'sunday' as QuestionCategory,
        question_text: '来週の気持ちは?',
        options: ['楽しみ', '不安', '普通', 'わからない'],
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockQuestion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getTodayQuestion();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.category).toBe('sunday');
      }
    });

    it('平日の場合、カテゴリーローテーションの質問を返す', async () => {
      // 月曜日をモック（2026-01-12は月曜日）
      const mockDate = new Date('2026-01-12');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mockQuestion = {
        id: 'test-id-4',
        category: 'connection' as QuestionCategory,
        question_text: '今日誰かと話した?',
        options: ['たくさん話した', '少し話した', 'あまり話してない'],
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockQuestion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getTodayQuestion();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(['connection', 'activity', 'achievement', 'feeling']).toContain(
          result.value.category
        );
      }
    });

    it('質問が見つからない場合、エラーを返す', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No question found' },
              }),
            }),
          }),
        }),
      });

      const result = await service.getTodayQuestion();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NO_QUESTION_FOR_TODAY');
      }
    });
  });

  describe('getQuestionById', () => {
    it('指定したIDの質問を返す', async () => {
      const mockQuestion = {
        id: 'test-id-5',
        category: 'activity' as QuestionCategory,
        question_text: '今日何かした?',
        options: ['運動した', '勉強した', '遊んだ', '休んだ'],
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from as any).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockQuestion,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getQuestionById('test-id-5');

      expect(result.success).toBe(true);
      if (result.success && result.value) {
        expect(result.value.id).toBe('test-id-5');
        expect(result.value.question_text).toBe('今日何かした?');
      }
    });

    it('質問が見つからない場合、エラーを返す', async () => {
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

      const result = await service.getQuestionById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success && result.error.type === 'QUESTION_NOT_FOUND') {
        expect(result.error.question_id).toBe('non-existent-id');
      }
    });
  });
});
