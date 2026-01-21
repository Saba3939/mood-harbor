/**
 * 気分記録フロー E2Eテスト
 * ログイン → 記録（ステップ1-3） → 完了アニメーション表示
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '@/lib/services/auth';
import { MoodRecordService } from '@/lib/services/mood-record';
import { DailyQuestionService } from '@/lib/services/daily-question';
import type { User, Session } from '@supabase/supabase-js';
import type {
  MoodLevel,
  ReasonCategory,
  CreateRecordParams,
} from '@/lib/types/mood-record';
import type { DailyQuestion } from '@/lib/types/daily-question';

// Supabaseクライアントのモック
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('気分記録フロー E2E', () => {
  const testEmail = 'mood-e2e@example.com';
  const testPassword = 'Password123';

  const mockUser: User = {
    id: 'e2e-user-mood-id',
    email: testEmail,
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
  } as User;

  const mockSession: Session = {
    access_token: 'e2e-mood-access-token',
    refresh_token: 'e2e-mood-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  } as Session;

  const mockQuestion: DailyQuestion = {
    id: 'e2e-question-id',
    category: 'connection',
    question_text: '今日誰かと話しましたか？',
    options: ['たくさん話した', '少し話した', 'あまり話してない'],
    created_at: new Date().toISOString(),
  };

  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
  });

  it('完全なフロー: ログイン → ステップ1 → ステップ2 → ステップ3 → 記録保存 → 完了アニメーション', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase
    );

    // ステップ1: ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const signInResult = await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    expect(signInResult.success).toBe(true);
    if (signInResult.success) {
      expect(signInResult.value.user.email).toBe(testEmail);
      expect(signInResult.value.user.id).toBe('e2e-user-mood-id');
    }

    // ログイン後のユーザー情報確認
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const currentUserResult = await AuthService.getCurrentUser();
    expect(currentUserResult.success).toBe(true);

    // ステップ2: 日替わり質問の取得
    mockSupabase.from.mockReturnValueOnce({
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

    const dailyQuestionService = new DailyQuestionService(mockSupabase);
    const questionResult = await dailyQuestionService.getTodayQuestion();

    expect(questionResult.success).toBe(true);
    if (questionResult.success) {
      expect(questionResult.value.id).toBe('e2e-question-id');
      expect(questionResult.value.question_text).toBe(
        '今日誰かと話しましたか？'
      );
      expect(questionResult.value.options).toHaveLength(3);
    }

    // ステップ3: 気分記録の作成（ステップ1-3の情報を統合）
    const recordParams: CreateRecordParams = {
      user_id: 'e2e-user-mood-id',
      mood_level: 4 as MoodLevel, // ステップ1: 「良い」を選択
      reasons: ['study_school'] as ReasonCategory[], // ステップ2: 「勉強・学校」を選択
      question_id: 'e2e-question-id', // ステップ3: 質問ID
      answer_option: 'たくさん話した', // ステップ3: 回答選択
    };

    const mockCreatedRecord = {
      id: 'e2e-record-id',
      ...recordParams,
      memo: null,
      time_of_day: null,
      weather: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCreatedRecord,
            error: null,
          }),
        }),
      }),
    });

    const moodRecordService = new MoodRecordService(mockSupabase);
    const createResult = await moodRecordService.createRecord(recordParams);

    expect(createResult.success).toBe(true);
    if (createResult.success) {
      expect(createResult.value.id).toBe('e2e-record-id');
      expect(createResult.value.mood_level).toBe(4);
      expect(createResult.value.reasons).toEqual(['study_school']);
      expect(createResult.value.question_id).toBe('e2e-question-id');
      expect(createResult.value.answer_option).toBe('たくさん話した');
    }

    // ステップ4: 完了後の記録取得（完了アニメーション表示のため）
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCreatedRecord,
            error: null,
          }),
        }),
      }),
    });

    const getRecordResult = await moodRecordService.getRecord('e2e-record-id');

    expect(getRecordResult.success).toBe(true);
    if (getRecordResult.success && getRecordResult.value) {
      expect(getRecordResult.value.id).toBe('e2e-record-id');
      // 完了アニメーション表示のデータが取得できることを確認
      expect(getRecordResult.value.mood_level).toBe(4);
    }
  });

  it('複数の理由を選択して記録する完全フロー', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase
    );

    // ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const signInResult = await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    expect(signInResult.success).toBe(true);

    // 日替わり質問の取得
    mockSupabase.from.mockReturnValueOnce({
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

    const dailyQuestionService = new DailyQuestionService(mockSupabase);
    await dailyQuestionService.getTodayQuestion();

    // 気分記録の作成（複数の理由）
    const recordParams: CreateRecordParams = {
      user_id: 'e2e-user-mood-id',
      mood_level: 3 as MoodLevel, // 「普通」を選択
      reasons: ['study_school', 'relationships'] as ReasonCategory[], // 2つの理由を選択
      question_id: 'e2e-question-id',
      answer_option: '少し話した',
    };

    const mockCreatedRecord = {
      id: 'e2e-record-multi-id',
      ...recordParams,
      memo: null,
      time_of_day: null,
      weather: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCreatedRecord,
            error: null,
          }),
        }),
      }),
    });

    const moodRecordService = new MoodRecordService(mockSupabase);
    const createResult = await moodRecordService.createRecord(recordParams);

    expect(createResult.success).toBe(true);
    if (createResult.success) {
      expect(createResult.value.reasons).toHaveLength(2);
      expect(createResult.value.reasons).toContain('study_school');
      expect(createResult.value.reasons).toContain('relationships');
    }
  });

  it('補足情報（メモ、時間帯、天気）を追加する完全フロー', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase
    );

    // ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    // 日替わり質問の取得
    mockSupabase.from.mockReturnValueOnce({
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

    const dailyQuestionService = new DailyQuestionService(mockSupabase);
    await dailyQuestionService.getTodayQuestion();

    // 気分記録の作成（補足情報付き）
    const recordParams: CreateRecordParams = {
      user_id: 'e2e-user-mood-id',
      mood_level: 5 as MoodLevel, // 「とても良い」を選択
      reasons: ['hobbies'] as ReasonCategory[], // 「趣味・遊び」を選択
      question_id: 'e2e-question-id',
      answer_option: 'たくさん話した',
      memo: '楽しかった',
      time_of_day: 'evening',
      weather: 'sunny',
    };

    const mockCreatedRecord = {
      id: 'e2e-record-supplement-id',
      ...recordParams,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCreatedRecord,
            error: null,
          }),
        }),
      }),
    });

    const moodRecordService = new MoodRecordService(mockSupabase);
    const createResult = await moodRecordService.createRecord(recordParams);

    expect(createResult.success).toBe(true);
    if (createResult.success) {
      expect(createResult.value.memo).toBe('楽しかった');
      expect(createResult.value.time_of_day).toBe('evening');
      expect(createResult.value.weather).toBe('sunny');
    }
  });

  it('記録作成時のバリデーションエラーハンドリング', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase
    );

    // ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    // 無効なパラメータで記録作成を試行
    const invalidParams: CreateRecordParams = {
      user_id: 'e2e-user-mood-id',
      mood_level: 6 as MoodLevel, // 無効な気分レベル（1-5の範囲外）
      reasons: ['study_school'] as ReasonCategory[],
      question_id: 'e2e-question-id',
      answer_option: 'たくさん話した',
    };

    const moodRecordService = new MoodRecordService(mockSupabase);
    const createResult = await moodRecordService.createRecord(invalidParams);

    expect(createResult.success).toBe(false);
    if (!createResult.success) {
      expect(createResult.error.type).toBe('INVALID_MOOD_LEVEL');
      if (createResult.error.type === 'INVALID_MOOD_LEVEL') {
        expect(createResult.error.level).toBe(6);
      }
    }
  });

  it.skip('連続した記録作成フロー（複数日分）', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase
    );

    // ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    // 日替わり質問の取得（複数回）
    for (let i = 0; i < 3; i++) {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  ...mockQuestion,
                  id: `e2e-question-${i}`,
                },
                error: null,
              }),
            }),
          }),
        }),
      });
    }

    const dailyQuestionService = new DailyQuestionService(mockSupabase);

    // 3日分の記録を作成
    const moodLevels: MoodLevel[] = [5, 4, 3];
    const createdRecords: any[] = [];

    for (let i = 0; i < 3; i++) {
      await dailyQuestionService.getTodayQuestion();

      const recordParams: CreateRecordParams = {
        user_id: 'e2e-user-mood-id',
        mood_level: moodLevels[i],
        reasons: ['study_school'] as ReasonCategory[],
        question_id: `e2e-question-${i}`,
        answer_option: 'たくさん話した',
      };

      const mockCreatedRecord = {
        id: `e2e-record-${i}`,
        ...recordParams,
        memo: null,
        time_of_day: null,
        weather: null,
        created_at: new Date(
          Date.now() - i * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - i * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      createdRecords.push(mockCreatedRecord);

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedRecord,
              error: null,
            }),
          }),
        }),
      });

      // 各ループで新しいサービスインスタンスを作成
      const moodRecordService = new MoodRecordService(mockSupabase);
      const createResult = await moodRecordService.createRecord(recordParams);

      expect(createResult.success).toBe(true);
      if (createResult.success) {
        expect(createResult.value.mood_level).toBe(moodLevels[i]);
      }
    }

    // 全記録の取得
    const mockRecords = moodLevels.map((level, i) => ({
      id: `e2e-record-${i}`,
      user_id: 'e2e-user-mood-id',
      mood_level: level,
      reasons: ['study_school'],
      question_id: `e2e-question-${i}`,
      answer_option: 'たくさん話した',
      memo: null,
      time_of_day: null,
      weather: null,
      created_at: new Date(
        Date.now() - i * 24 * 60 * 60 * 1000
      ).toISOString(),
      updated_at: new Date(
        Date.now() - i * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRecords,
            error: null,
          }),
        }),
      }),
    });

    // 全記録取得用の新しいサービスインスタンス
    const moodRecordService = new MoodRecordService(mockSupabase);
    const getRecordsResult = await moodRecordService.getRecordsByUser(
      'e2e-user-mood-id'
    );

    expect(getRecordsResult.success).toBe(true);
    if (getRecordsResult.success) {
      expect(getRecordsResult.value).toHaveLength(3);
      expect(getRecordsResult.value[0].mood_level).toBe(5);
      expect(getRecordsResult.value[1].mood_level).toBe(4);
      expect(getRecordsResult.value[2].mood_level).toBe(3);
    }
  });

  it('記録編集フロー: 記録作成 → 取得 → 編集 → 再取得', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
      mockSupabase
    );

    // ログイン
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    await AuthService.signIn({
      email: testEmail,
      password: testPassword,
    });

    // 記録作成
    const recordParams: CreateRecordParams = {
      user_id: 'e2e-user-mood-id',
      mood_level: 3 as MoodLevel,
      reasons: ['study_school'] as ReasonCategory[],
      question_id: 'e2e-question-id',
      answer_option: 'たくさん話した',
    };

    const mockCreatedRecord = {
      id: 'e2e-record-edit-id',
      ...recordParams,
      memo: null,
      time_of_day: null,
      weather: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCreatedRecord,
            error: null,
          }),
        }),
      }),
    });

    const moodRecordService = new MoodRecordService(mockSupabase);
    const createResult = await moodRecordService.createRecord(recordParams);

    expect(createResult.success).toBe(true);

    // 記録編集
    const mockUpdatedRecord = {
      ...mockCreatedRecord,
      mood_level: 4,
      memo: '後で追加',
      time_of_day: 'evening',
      weather: 'sunny',
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValueOnce({
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

    const updateResult = await moodRecordService.updateRecord(
      'e2e-record-edit-id',
      {
        mood_level: 4,
        memo: '後で追加',
        time_of_day: 'evening',
        weather: 'sunny',
      }
    );

    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.value.mood_level).toBe(4);
      expect(updateResult.value.memo).toBe('後で追加');
      expect(updateResult.value.time_of_day).toBe('evening');
      expect(updateResult.value.weather).toBe('sunny');
    }

    // 編集後の記録取得
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUpdatedRecord,
            error: null,
          }),
        }),
      }),
    });

    const getRecordResult = await moodRecordService.getRecord(
      'e2e-record-edit-id'
    );

    expect(getRecordResult.success).toBe(true);
    if (getRecordResult.success && getRecordResult.value) {
      expect(getRecordResult.value.mood_level).toBe(4);
      expect(getRecordResult.value.memo).toBe('後で追加');
    }
  });
});
