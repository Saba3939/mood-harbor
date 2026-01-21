/**
 * 気分記録フローの統合テスト
 * ステップ1 → ステップ2 → ステップ3 → 記録保存 → Server Actions成功
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordPage from '@/app/record/page';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import * as moodRecordActions from '@/lib/actions/mood-record';
import * as dailyQuestionActions from '@/lib/actions/daily-question';

// Server Actionsのモック
jest.mock('@/lib/actions/mood-record');
jest.mock('@/lib/actions/daily-question');

// Framer Motionのモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('気分記録フロー統合テスト', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockQuestion = {
    id: 'question-456',
    category: 'connection' as const,
    question_text: '今日誰かと話しましたか？',
    options: ['たくさん話した', '少し話した', 'あまり話してない'],
    created_at: new Date().toISOString(),
  };

  const mockCreatedRecord = {
    id: 'record-789',
    user_id: 'user-123',
    mood_level: 4,
    reasons: ['study_school'],
    question_id: 'question-456',
    answer_option: 'たくさん話した',
    memo: null,
    time_of_day: null,
    weather: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // ストアをリセット
    const store = useMoodRecordStore.getState();
    store.resetForm();

    // 日替わり質問のモック
    jest
      .spyOn(dailyQuestionActions, 'getTodayQuestionAction')
      .mockResolvedValue({
        success: true,
        value: mockQuestion,
      });

    // 記録作成のモック
    jest
      .spyOn(moodRecordActions, 'createRecordAction')
      .mockResolvedValue({
        success: true,
        value: mockCreatedRecord,
      });
  });

  it('完全な記録フロー: ステップ1 → ステップ2 → ステップ3 → 記録保存', async () => {
    const user = userEvent.setup();

    render(<RecordPage />);

    // ステップ1: 気分選択
    await waitFor(() => {
      expect(screen.getByText(/今日の気分は？/i)).toBeInTheDocument();
    });

    // 気分アイコン「良い」をクリック（mood_level = 4）
    const moodButton = screen.getByRole('button', {
      name: /気分レベル 4: 良い/i,
    });
    await user.click(moodButton);

    // ステップ2に自動遷移することを確認
    await waitFor(() => {
      expect(screen.getByText(/理由は何ですか？/i)).toBeInTheDocument();
    });

    // ステップ2: 理由カテゴリー選択
    const reasonButton = screen.getByRole('button', {
      name: /勉強・学校/i,
    });
    await user.click(reasonButton);

    // 次へボタンをクリック
    const nextButton = screen.getByRole('button', { name: /次へ/i });
    await user.click(nextButton);

    // ステップ3に遷移することを確認
    await waitFor(() => {
      expect(screen.getByText(/今日誰かと話しましたか？/i)).toBeInTheDocument();
    });

    // ステップ3: 日替わり質問に回答
    const answerButton = screen.getByRole('button', {
      name: /たくさん話した/i,
    });
    await user.click(answerButton);

    // 記録保存が呼ばれることを確認
    await waitFor(() => {
      expect(moodRecordActions.createRecordAction).toHaveBeenCalledWith({
        user_id: expect.any(String),
        mood_level: 4,
        reasons: ['study_school'],
        question_id: 'question-456',
        answer_option: 'たくさん話した',
      });
    });

    // 完了画面が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/記録完了/i)).toBeInTheDocument();
    });
  });

  it('複数の理由を選択して記録できる', async () => {
    const user = userEvent.setup();

    render(<RecordPage />);

    // ステップ1: 気分選択
    await waitFor(() => {
      expect(screen.getByText(/今日の気分は？/i)).toBeInTheDocument();
    });

    const moodButton = screen.getByRole('button', {
      name: /気分レベル 3: 普通/i,
    });
    await user.click(moodButton);

    // ステップ2: 理由カテゴリー選択（2つ）
    await waitFor(() => {
      expect(screen.getByText(/理由は何ですか？/i)).toBeInTheDocument();
    });

    const reason1 = screen.getByRole('button', { name: /勉強・学校/i });
    const reason2 = screen.getByRole('button', { name: /人間関係/i });

    await user.click(reason1);
    await user.click(reason2);

    const nextButton = screen.getByRole('button', { name: /次へ/i });
    await user.click(nextButton);

    // ステップ3: 日替わり質問に回答
    await waitFor(() => {
      expect(screen.getByText(/今日誰かと話しましたか？/i)).toBeInTheDocument();
    });

    const answerButton = screen.getByRole('button', {
      name: /少し話した/i,
    });
    await user.click(answerButton);

    // 記録保存時に2つの理由が送信されることを確認
    await waitFor(() => {
      expect(moodRecordActions.createRecordAction).toHaveBeenCalledWith(
        expect.objectContaining({
          reasons: expect.arrayContaining(['study_school', 'relationships']),
        })
      );
    });
  });

  it('補足入力（メモ、時間帯、天気）を追加して記録できる', async () => {
    const user = userEvent.setup();

    render(<RecordPage />);

    // ステップ1-3を完了
    await waitFor(() => {
      expect(screen.getByText(/今日の気分は？/i)).toBeInTheDocument();
    });

    const moodButton = screen.getByRole('button', {
      name: /気分レベル 5: とても良い/i,
    });
    await user.click(moodButton);

    await waitFor(() => {
      expect(screen.getByText(/理由は何ですか？/i)).toBeInTheDocument();
    });

    const reasonButton = screen.getByRole('button', { name: /趣味・遊び/i });
    await user.click(reasonButton);

    const nextButton = screen.getByRole('button', { name: /次へ/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/今日誰かと話しましたか？/i)).toBeInTheDocument();
    });

    const answerButton = screen.getByRole('button', {
      name: /たくさん話した/i,
    });
    await user.click(answerButton);

    // 完了後、「もう少し詳しく」ボタンをクリック
    await waitFor(() => {
      expect(screen.getByText(/記録完了/i)).toBeInTheDocument();
    });

    const detailButton = screen.getByRole('button', {
      name: /もう少し詳しく/i,
    });
    await user.click(detailButton);

    // 補足入力フォームが表示されることを確認
    await waitFor(() => {
      expect(screen.getByLabelText(/メモ/i)).toBeInTheDocument();
    });

    // メモを入力
    const memoInput = screen.getByLabelText(/メモ/i);
    await user.type(memoInput, '楽しかった');

    // 時間帯を選択
    const timeButton = screen.getByRole('button', { name: /夕方/i });
    await user.click(timeButton);

    // 天気を選択
    const weatherButton = screen.getByRole('button', { name: /晴れ/i });
    await user.click(weatherButton);

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    // 補足情報付きで記録更新が呼ばれることを確認
    await waitFor(() => {
      expect(moodRecordActions.updateRecordAction).toHaveBeenCalledWith(
        'record-789',
        {
          memo: '楽しかった',
          time_of_day: 'evening',
          weather: 'sunny',
        }
      );
    });
  });

  it('記録保存時にエラーが発生した場合、エラーメッセージを表示', async () => {
    const user = userEvent.setup();

    // 記録作成をエラーでモック
    jest
      .spyOn(moodRecordActions, 'createRecordAction')
      .mockResolvedValue({
        success: false,
        error: {
          type: 'MEMO_TOO_LONG',
          max: 10,
        },
      });

    render(<RecordPage />);

    // ステップ1-3を完了
    await waitFor(() => {
      expect(screen.getByText(/今日の気分は？/i)).toBeInTheDocument();
    });

    const moodButton = screen.getByRole('button', {
      name: /気分レベル 4: 良い/i,
    });
    await user.click(moodButton);

    await waitFor(() => {
      expect(screen.getByText(/理由は何ですか？/i)).toBeInTheDocument();
    });

    const reasonButton = screen.getByRole('button', { name: /勉強・学校/i });
    await user.click(reasonButton);

    const nextButton = screen.getByRole('button', { name: /次へ/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/今日誰かと話しましたか？/i)).toBeInTheDocument();
    });

    const answerButton = screen.getByRole('button', {
      name: /たくさん話した/i,
    });
    await user.click(answerButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText(/メモは10文字以内で入力してください/i)
      ).toBeInTheDocument();
    });
  });

  it('フォーム未完成時にリロードしても状態が復元される', async () => {
    const user = userEvent.setup();

    const { unmount } = render(<RecordPage />);

    // ステップ1: 気分選択
    await waitFor(() => {
      expect(screen.getByText(/今日の気分は？/i)).toBeInTheDocument();
    });

    const moodButton = screen.getByRole('button', {
      name: /気分レベル 4: 良い/i,
    });
    await user.click(moodButton);

    // ステップ2: 理由カテゴリー選択
    await waitFor(() => {
      expect(screen.getByText(/理由は何ですか？/i)).toBeInTheDocument();
    });

    const reasonButton = screen.getByRole('button', { name: /勉強・学校/i });
    await user.click(reasonButton);

    // コンポーネントをアンマウント（リロードをシミュレート）
    unmount();

    // 再度レンダリング
    render(<RecordPage />);

    // ステップ2に復元され、選択した理由が保持されていることを確認
    await waitFor(() => {
      expect(screen.getByText(/理由は何ですか？/i)).toBeInTheDocument();
    });

    const store = useMoodRecordStore.getState();
    expect(store.moodLevel).toBe(4);
    expect(store.selectedReasons).toContain('study_school');
    expect(store.currentStep).toBe(2);
  });
});
