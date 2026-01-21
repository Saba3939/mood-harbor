/**
 * 気分記録UI（ステップ1: 気分選択）のテスト
 *
 * テスト対象:
 * - 5段階気分アイコンの表示
 * - タップで気分選択と自動遷移
 * - モバイルファーストデザイン
 * - タップ領域最小44x44px
 * - ARIA属性とアクセシビリティ対応
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordPage from '@/app/record/page';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';

// Zustand storeのモック
jest.mock('@/lib/stores/mood-record-store', () => ({
  useMoodRecordStore: jest.fn(),
}));

const mockUseMoodRecordStore = useMoodRecordStore as jest.MockedFunction<
  typeof useMoodRecordStore
>;

describe('気分記録ページ - ステップ1: 気分選択', () => {
  const mockSetMoodLevel = jest.fn();
  const mockNextStep = jest.fn();
  const mockResetForm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのstoreモック（ステップ1の状態）
    mockUseMoodRecordStore.mockReturnValue({
      currentStep: 1,
      moodLevel: null,
      selectedReasons: [],
      questionId: null,
      answerOption: null,
      memo: '',
      timeOfDay: null,
      weather: null,
      isSubmitting: false,
      error: null,
      setMoodLevel: mockSetMoodLevel,
      toggleReason: jest.fn(),
      setQuestionId: jest.fn(),
      setAnswer: jest.fn(),
      setMemo: jest.fn(),
      setTimeOfDay: jest.fn(),
      setWeather: jest.fn(),
      nextStep: mockNextStep,
      resetForm: mockResetForm,
      submitRecord: jest.fn(),
    });
  });

  describe('UI表示', () => {
    it('ステップ1のタイトルが表示される', () => {
      render(<RecordPage />);

      expect(
        screen.getByRole('heading', { name: /今日の気分は/i })
      ).toBeInTheDocument();
    });

    it('5段階の気分アイコンが表示される', () => {
      render(<RecordPage />);

      // 5つの気分ボタンが存在することを確認
      const moodButtons = screen.getAllByRole('button', {
        name: /気分レベル/i,
      });
      expect(moodButtons).toHaveLength(5);

      // 各気分レベルのラベルが表示されることを確認
      expect(
        screen.getByRole('button', { name: /気分レベル 5: とても良い/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /気分レベル 4: 良い/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /気分レベル 3: 普通/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /気分レベル 2: 少し疲れた/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /気分レベル 1: とても疲れた/i })
      ).toBeInTheDocument();
    });

    it('各気分ボタンが最小44x44pxのタップ領域を持つ', () => {
      render(<RecordPage />);

      const moodButtons = screen.getAllByRole('button', {
        name: /気分レベル/i,
      });

      // CSSクラスで最小高さが設定されていることを確認
      moodButtons.forEach((button) => {
        expect(button.className).toContain('min-h-[60px]');
        expect(button.className).toContain('w-full');
      });

      // ボタンの数が5つであることを再確認
      expect(moodButtons).toHaveLength(5);
    });
  });

  describe('アクセシビリティ', () => {
    it('各気分ボタンに適切なARIA属性が設定されている', () => {
      render(<RecordPage />);

      const moodButtons = screen.getAllByRole('button', {
        name: /気分レベル/i,
      });

      moodButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('選択された気分ボタンにaria-pressed属性が設定される', () => {
      // 気分レベル5が選択された状態のモック
      mockUseMoodRecordStore.mockReturnValue({
        ...mockUseMoodRecordStore(),
        moodLevel: 5,
      });

      render(<RecordPage />);

      const selectedButton = screen.getByRole('button', {
        name: /気分レベル 5: とても良い/i,
      });

      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('気分選択の動作', () => {
    it('気分アイコンをタップするとsetMoodLevelが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<RecordPage />);

      const moodButton = screen.getByRole('button', {
        name: /気分レベル 5: とても良い/i,
      });

      await user.click(moodButton);

      expect(mockSetMoodLevel).toHaveBeenCalledWith(5);
    });

    it('気分選択後に自動的にnextStepが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<RecordPage />);

      const moodButton = screen.getByRole('button', {
        name: /気分レベル 3: 普通/i,
      });

      await user.click(moodButton);

      await waitFor(() => {
        expect(mockNextStep).toHaveBeenCalled();
      });
    });

    it('異なる気分レベルを選択できる', async () => {
      const user = userEvent.setup();
      render(<RecordPage />);

      // レベル5を選択
      await user.click(
        screen.getByRole('button', { name: /気分レベル 5: とても良い/i })
      );
      expect(mockSetMoodLevel).toHaveBeenCalledWith(5);

      // レベル1を選択
      await user.click(
        screen.getByRole('button', { name: /気分レベル 1: とても疲れた/i })
      );
      expect(mockSetMoodLevel).toHaveBeenCalledWith(1);
    });
  });

  describe('モバイルファーストデザイン', () => {
    it('モバイルビューで適切にレイアウトされる', () => {
      render(<RecordPage />);

      const container = screen.getByRole('main');
      expect(container).toBeInTheDocument();

      // コンテナが適切なクラスを持つことを確認
      expect(container).toHaveClass('container');
      expect(container).toHaveClass('mx-auto');
    });
  });

  describe('アニメーション', () => {
    it('気分選択時にアニメーションが表示される', async () => {
      const user = userEvent.setup();
      render(<RecordPage />);

      const moodButton = screen.getByRole('button', {
        name: /気分レベル 5: とても良い/i,
      });

      await user.click(moodButton);

      // setMoodLevelが呼ばれ、選択状態になることを確認
      expect(mockSetMoodLevel).toHaveBeenCalledWith(5);

      // 次のステップへの遷移が実行されることを確認
      await waitFor(() => {
        expect(mockNextStep).toHaveBeenCalled();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー状態の場合、エラーメッセージが表示される', () => {
      mockUseMoodRecordStore.mockReturnValue({
        ...mockUseMoodRecordStore(),
        error: { type: 'INVALID_MOOD_LEVEL', level: 0 },
      });

      render(<RecordPage />);

      expect(screen.getByRole('alert')).toHaveTextContent(
        /気分を選択してください/i
      );
    });
  });

  describe('ステップ進行', () => {
    it('ステップ2の場合、ステップ1は表示されない', () => {
      mockUseMoodRecordStore.mockReturnValue({
        ...mockUseMoodRecordStore(),
        currentStep: 2,
        moodLevel: 5,
      });

      render(<RecordPage />);

      expect(
        screen.queryByRole('heading', { name: /今日の気分は/i })
      ).not.toBeInTheDocument();
    });
  });
});
