/**
 * カレンダーのモーダル統合テスト
 * 記録詳細表示 → 編集 → 削除のフロー
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarPage from '@/app/calendar/page';
import {
  getRecordsByUserAction,
  deleteRecordAction,
  updateRecordAction,
} from '@/lib/actions/mood-record';
import { getQuestionByIdAction } from '@/lib/actions/daily-question';
import type { MoodRecord } from '@/lib/types/mood-record';
import type { DailyQuestion } from '@/lib/types/daily-question';

// Server Actionsをモック
jest.mock('@/lib/actions/mood-record', () => ({
  getRecordsByUserAction: jest.fn(),
  deleteRecordAction: jest.fn(),
  updateRecordAction: jest.fn(),
}));

jest.mock('@/lib/actions/daily-question', () => ({
  getQuestionByIdAction: jest.fn(),
}));

const mockGetRecordsByUserAction =
  getRecordsByUserAction as jest.MockedFunction<
    typeof getRecordsByUserAction
  >;
const mockDeleteRecordAction = deleteRecordAction as jest.MockedFunction<
  typeof deleteRecordAction
>;
const mockUpdateRecordAction = updateRecordAction as jest.MockedFunction<
  typeof updateRecordAction
>;
const mockGetQuestionByIdAction = getQuestionByIdAction as jest.MockedFunction<
  typeof getQuestionByIdAction
>;

const now = new Date();
const mockRecords: MoodRecord[] = [
  {
    id: 'record-1',
    user_id: 'test-user',
    mood_level: 4,
    reasons: ['study_school', 'hobbies'],
    question_id: 'question-1',
    answer_option: '楽しかった',
    memo: 'テストメモ',
    time_of_day: 'evening',
    weather: 'sunny',
    created_at: new Date(now.getFullYear(), now.getMonth(), 15, 18, 0, 0).toISOString(),
    updated_at: new Date(now.getFullYear(), now.getMonth(), 15, 18, 0, 0).toISOString(),
  },
];

const mockQuestion: DailyQuestion = {
  id: 'question-1',
  category: 'feeling',
  question_text: '今日の気持ちは?',
  options: ['楽しかった', '普通だった', '疲れた'],
  created_at: '2026-01-01T00:00:00Z',
};

describe('Calendar Modal Flow Integration', () => {
  // ヘルパー関数: カレンダーが読み込まれるまで待つ
  const waitForCalendarLoad = async () => {
    await waitFor(() => {
      expect(screen.getByText('カレンダー')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockGetRecordsByUserAction).toHaveBeenCalled();
    });
  };

  // ヘルパー関数: 15日の記録ボタンを取得してクリック
  const clickRecordButton = async () => {
    const dateButton = await screen.findByLabelText('15日 記録あり');
    fireEvent.click(dateButton);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのモック動作
    mockGetRecordsByUserAction.mockResolvedValue({
      success: true,
      value: mockRecords,
    });

    mockGetQuestionByIdAction.mockResolvedValue({
      success: true,
      value: mockQuestion,
    });

    mockDeleteRecordAction.mockResolvedValue({
      success: true,
      value: undefined,
    });

    mockUpdateRecordAction.mockImplementation(async (recordId, updates) => ({
      success: true,
      value: {
        ...mockRecords[0],
        ...updates,
        updated_at: new Date().toISOString(),
      },
    }));
  });

  describe('記録詳細表示フロー', () => {
    it('日付をクリックすると記録詳細モーダルが表示される', async () => {
      render(<CalendarPage />);

      // カレンダーが読み込まれるまで待つ
      await waitFor(() => {
        expect(screen.getByText('カレンダー')).toBeInTheDocument();
      });

      // データが読み込まれるまで待つ
      await waitFor(
        () => {
          expect(mockGetRecordsByUserAction).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // 記録がある日付をクリック
      const dateButton = await screen.findByLabelText('15日 記録あり');
      fireEvent.click(dateButton);

      // 詳細モーダルが表示される
      await waitFor(() => {
        expect(screen.getByText('記録の詳細')).toBeInTheDocument();
        expect(screen.getByText('良い')).toBeInTheDocument();
        expect(screen.getByText('今日の気持ちは?')).toBeInTheDocument();
        expect(screen.getByText('楽しかった')).toBeInTheDocument();
      });
    });

    it('詳細モーダルの閉じるボタンでモーダルが閉じる', async () => {
      render(<CalendarPage />);

      await waitFor(() => {
        expect(screen.getByText('カレンダー')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockGetRecordsByUserAction).toHaveBeenCalled();
      });

      const dateButton = await screen.findByLabelText('15日 記録あり');
      fireEvent.click(dateButton);

      await waitFor(() => {
        expect(screen.getByText('記録の詳細')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /閉じる/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('記録の詳細')).not.toBeInTheDocument();
      });
    });
  });

  describe('記録編集フロー', () => {
    it('詳細モーダルから編集モーダルを開ける', async () => {
      render(<CalendarPage />);
      await waitForCalendarLoad();
      await clickRecordButton();

      await waitFor(() => {
        expect(screen.getByText('記録の詳細')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /編集/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('記録の編集')).toBeInTheDocument();
      });
    });

    it('編集モーダルで記録を更新できる', async () => {
      render(<CalendarPage />);
      await waitForCalendarLoad();
      await clickRecordButton();

      await waitFor(() => {
        expect(screen.getByText('記録の詳細')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /編集/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('記録の編集')).toBeInTheDocument();
      });

      // 気分を変更
      const veryGoodButton = screen.getByRole('button', { name: /😊/ });
      fireEvent.click(veryGoodButton);

      // 保存
      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecordAction).toHaveBeenCalledWith(
          'record-1',
          expect.objectContaining({
            mood_level: 5,
          })
        );
      });

      // 編集モーダルが閉じる
      await waitFor(() => {
        expect(screen.queryByText('記録の編集')).not.toBeInTheDocument();
      });
    });
  });

  describe('記録削除フロー', () => {
    it('詳細モーダルから記録を削除できる', async () => {
      render(<CalendarPage />);
      await waitForCalendarLoad();
      await clickRecordButton();

      await waitFor(() => {
        expect(screen.getByText('記録の詳細')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);

      // 確認ダイアログが表示される
      await waitFor(() => {
        expect(
          screen.getByText(/この記録を削除しますか/)
        ).toBeInTheDocument();
      });

      // 削除を実行
      const confirmButton = screen.getByRole('button', { name: /削除する/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteRecordAction).toHaveBeenCalledWith('record-1');
      });

      // モーダルが閉じる
      await waitFor(() => {
        expect(screen.queryByText('記録の詳細')).not.toBeInTheDocument();
      });
    });

    it('削除をキャンセルできる', async () => {
      render(<CalendarPage />);
      await waitForCalendarLoad();
      await clickRecordButton();

      await waitFor(() => {
        expect(screen.getByText('記録の詳細')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByText(/この記録を削除しますか/)
        ).toBeInTheDocument();
      });

      // キャンセル
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockDeleteRecordAction).not.toHaveBeenCalled();
      });

      // 確認ダイアログが閉じる
      await waitFor(() => {
        expect(
          screen.queryByText(/この記録を削除しますか/)
        ).not.toBeInTheDocument();
      });
    });
  });
});
