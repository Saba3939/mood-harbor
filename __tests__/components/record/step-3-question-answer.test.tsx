/**
 * ステップ3: 日替わり質問回答コンポーネントのテスト
 *
 * Requirements: 3.4, 3.6, 4.1, 4.6, 18.2, 21.4
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionAnswerStep } from '@/app/record/components/step-3-question-answer';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getTodayQuestionAction } from '@/lib/actions/daily-question';
import { createRecordAction } from '@/lib/actions/mood-record';

// モックを設定
jest.mock('@/lib/stores/mood-record-store');
jest.mock('@/lib/stores/auth-store');
jest.mock('@/lib/actions/daily-question');
jest.mock('@/lib/actions/mood-record');

const mockUseMoodRecordStore = useMoodRecordStore as jest.MockedFunction<
  typeof useMoodRecordStore
>;

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

const mockGetTodayQuestionAction =
  getTodayQuestionAction as jest.MockedFunction<typeof getTodayQuestionAction>;

const mockCreateRecordAction = createRecordAction as jest.MockedFunction<
  typeof createRecordAction
>;

describe('QuestionAnswerStep', () => {
  // 各テスト前に初期化
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトの認証状態をモック
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      },
      session: null,
      isLoading: false,
      error: null,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      clearError: jest.fn(),
    });

    // デフォルトのストア状態をモック
    mockUseMoodRecordStore.mockReturnValue({
      currentStep: 3,
      moodLevel: 4,
      selectedReasons: ['study_school'],
      questionId: null,
      answerOption: null,
      memo: '',
      timeOfDay: null,
      weather: null,
      isSubmitting: false,
      error: null,
      setMoodLevel: jest.fn(),
      toggleReason: jest.fn(),
      setQuestionId: jest.fn(),
      setAnswer: jest.fn(),
      setMemo: jest.fn(),
      setTimeOfDay: jest.fn(),
      setWeather: jest.fn(),
      nextStep: jest.fn(),
      resetForm: jest.fn(),
      submitRecord: jest.fn(),
    });
  });

  describe('質問の取得と表示', () => {
    it('コンポーネント表示時に今日の質問を取得する', async () => {
      // 質問データをモック
      mockGetTodayQuestionAction.mockResolvedValue({
        success: true,
        value: {
          id: 'q1',
          category: 'connection',
          question_text: '今日誰かと話しましたか?',
          options: ['たくさん話した', '少し話した', 'あまり話さなかった'],
          created_at: new Date().toISOString(),
        },
      });

      render(<QuestionAnswerStep />);

      // 質問が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
      });

      // 質問取得アクションが呼ばれたことを確認
      expect(mockGetTodayQuestionAction).toHaveBeenCalledTimes(1);

      // 選択肢が表示されることを確認
      expect(screen.getByText('たくさん話した')).toBeInTheDocument();
      expect(screen.getByText('少し話した')).toBeInTheDocument();
      expect(screen.getByText('あまり話さなかった')).toBeInTheDocument();
    });

    it('質問の取得に失敗した場合、エラーメッセージを表示する', async () => {
      mockGetTodayQuestionAction.mockResolvedValue({
        success: false,
        error: { type: 'NO_QUESTION_FOR_TODAY' },
      });

      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(
          screen.getByText(/質問の取得に失敗しました/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('回答の選択', () => {
    beforeEach(async () => {
      mockGetTodayQuestionAction.mockResolvedValue({
        success: true,
        value: {
          id: 'q1',
          category: 'connection',
          question_text: '今日誰かと話しましたか?',
          options: ['たくさん話した', '少し話した', 'あまり話さなかった'],
          created_at: new Date().toISOString(),
        },
      });
    });

    it('選択肢をタップすると回答が選択される', async () => {
      const mockSetQuestionId = jest.fn();
      const mockSetAnswer = jest.fn();

      mockUseMoodRecordStore.mockReturnValue({
        currentStep: 3,
        moodLevel: 4,
        selectedReasons: ['study_school'],
        questionId: null,
        answerOption: null,
        memo: '',
        timeOfDay: null,
        weather: null,
        isSubmitting: false,
        error: null,
        setMoodLevel: jest.fn(),
        toggleReason: jest.fn(),
        setQuestionId: mockSetQuestionId,
        setAnswer: mockSetAnswer,
        setMemo: jest.fn(),
        setTimeOfDay: jest.fn(),
        setWeather: jest.fn(),
        nextStep: jest.fn(),
        resetForm: jest.fn(),
        submitRecord: jest.fn(),
      });

      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(screen.getByText('たくさん話した')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const optionButton = screen.getByRole('button', {
        name: /たくさん話した/i,
      });

      await user.click(optionButton);

      // setQuestionIdとsetAnswerが呼ばれることを確認
      expect(mockSetQuestionId).toHaveBeenCalledWith('q1');
      expect(mockSetAnswer).toHaveBeenCalledWith('たくさん話した');
    });

    it('選択した回答が視覚的にハイライトされる', async () => {
      mockUseMoodRecordStore.mockReturnValue({
        currentStep: 3,
        moodLevel: 4,
        selectedReasons: ['study_school'],
        questionId: 'q1',
        answerOption: 'たくさん話した',
        memo: '',
        timeOfDay: null,
        weather: null,
        isSubmitting: false,
        error: null,
        setMoodLevel: jest.fn(),
        toggleReason: jest.fn(),
        setQuestionId: jest.fn(),
        setAnswer: jest.fn(),
        setMemo: jest.fn(),
        setTimeOfDay: jest.fn(),
        setWeather: jest.fn(),
        nextStep: jest.fn(),
        resetForm: jest.fn(),
        submitRecord: jest.fn(),
      });

      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(screen.getByText('たくさん話した')).toBeInTheDocument();
      });

      const selectedButton = screen.getByRole('button', {
        name: /たくさん話した/i,
      });

      // aria-pressed属性で選択状態を確認
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('記録の送信', () => {
    beforeEach(() => {
      mockGetTodayQuestionAction.mockResolvedValue({
        success: true,
        value: {
          id: 'q1',
          category: 'connection',
          question_text: '今日誰かと話しましたか?',
          options: ['たくさん話した', '少し話した', 'あまり話さなかった'],
          created_at: new Date().toISOString(),
        },
      });
    });

    it('回答選択後、記録ボタンをタップすると記録が送信される', async () => {
      const mockResetForm = jest.fn();
      const user_id = 'user123';

      mockUseMoodRecordStore.mockReturnValue({
        currentStep: 3,
        moodLevel: 4,
        selectedReasons: ['study_school', 'relationships'],
        questionId: 'q1',
        answerOption: 'たくさん話した',
        memo: '',
        timeOfDay: null,
        weather: null,
        isSubmitting: false,
        error: null,
        setMoodLevel: jest.fn(),
        toggleReason: jest.fn(),
        setQuestionId: jest.fn(),
        setAnswer: jest.fn(),
        setMemo: jest.fn(),
        setTimeOfDay: jest.fn(),
        setWeather: jest.fn(),
        nextStep: jest.fn(),
        resetForm: mockResetForm,
        submitRecord: jest.fn(),
      });

      mockCreateRecordAction.mockResolvedValue({
        success: true,
        value: {
          id: 'record123',
          user_id,
          mood_level: 4,
          reasons: ['study_school', 'relationships'],
          question_id: 'q1',
          answer_option: 'たくさん話した',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(screen.getByText('記録を完了')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /記録を完了/i });

      await user.click(submitButton);

      // 記録作成アクションが呼ばれることを確認
      await waitFor(() => {
        expect(mockCreateRecordAction).toHaveBeenCalledWith({
          user_id: expect.any(String),
          mood_level: 4,
          reasons: ['study_school', 'relationships'],
          question_id: 'q1',
          answer_option: 'たくさん話した',
          memo: undefined,
          time_of_day: undefined,
          weather: undefined,
        });
      });
    });

    it('送信中はローディング表示になる', async () => {
      mockUseMoodRecordStore.mockReturnValue({
        currentStep: 3,
        moodLevel: 4,
        selectedReasons: ['study_school'],
        questionId: 'q1',
        answerOption: 'たくさん話した',
        memo: '',
        timeOfDay: null,
        weather: null,
        isSubmitting: true,
        error: null,
        setMoodLevel: jest.fn(),
        toggleReason: jest.fn(),
        setQuestionId: jest.fn(),
        setAnswer: jest.fn(),
        setMemo: jest.fn(),
        setTimeOfDay: jest.fn(),
        setWeather: jest.fn(),
        nextStep: jest.fn(),
        resetForm: jest.fn(),
        submitRecord: jest.fn(),
      });

      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(screen.getByText(/送信中/i)).toBeInTheDocument();
      });
    });

    it('送信成功後、完了アニメーションを表示する', async () => {
      mockUseMoodRecordStore.mockReturnValue({
        currentStep: 3,
        moodLevel: 4,
        selectedReasons: ['study_school'],
        questionId: 'q1',
        answerOption: 'たくさん話した',
        memo: '',
        timeOfDay: null,
        weather: null,
        isSubmitting: false,
        error: null,
        setMoodLevel: jest.fn(),
        toggleReason: jest.fn(),
        setQuestionId: jest.fn(),
        setAnswer: jest.fn(),
        setMemo: jest.fn(),
        setTimeOfDay: jest.fn(),
        setWeather: jest.fn(),
        nextStep: jest.fn(),
        resetForm: jest.fn(),
        submitRecord: jest.fn(),
      });

      mockCreateRecordAction.mockResolvedValue({
        success: true,
        value: {
          id: 'record123',
          user_id: 'user123',
          mood_level: 4,
          reasons: ['study_school'],
          question_id: 'q1',
          answer_option: 'たくさん話した',
          memo: null,
          time_of_day: null,
          weather: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(screen.getByText('記録を完了')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /記録を完了/i });

      await user.click(submitButton);

      // 完了メッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/記録完了/i)).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      mockGetTodayQuestionAction.mockResolvedValue({
        success: true,
        value: {
          id: 'q1',
          category: 'connection',
          question_text: '今日誰かと話しましたか?',
          options: ['たくさん話した', '少し話した', 'あまり話さなかった'],
          created_at: new Date().toISOString(),
        },
      });
    });

    it('適切なARIA属性が設定されている', async () => {
      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
      });

      const optionButtons = screen.getAllByRole('button', {
        name: /選択肢/i,
      });

      optionButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('ステップインジケーターが適切なラベルを持つ', async () => {
      render(<QuestionAnswerStep />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/ステップ3: 質問回答 \(現在\)/i)
        ).toBeInTheDocument();
      });
    });
  });
});
