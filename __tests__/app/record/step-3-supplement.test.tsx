/**
 * ステップ3 - 補足入力統合テスト
 *
 * 記録完了後の「もう少し詳しく」ボタンと補足入力の動作を検証
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionAnswerStep } from '@/app/record/components/step-3-question-answer';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getTodayQuestionAction } from '@/lib/actions/daily-question';
import {
  createRecordAction,
  updateRecordAction,
} from '@/lib/actions/mood-record';

// モック
jest.mock('@/lib/stores/mood-record-store');
jest.mock('@/lib/stores/auth-store');
jest.mock('@/lib/actions/daily-question');
jest.mock('@/lib/actions/mood-record');

describe('QuestionAnswerStep - 補足入力統合テスト', () => {
  const mockResetForm = jest.fn();
  const mockSetMemo = jest.fn();
  const mockSetTimeOfDay = jest.fn();
  const mockSetWeather = jest.fn();
  const mockSetQuestionId = jest.fn();
  const mockSetAnswer = jest.fn();

  const mockQuestion = {
    id: 'question-1',
    category: 'connection' as const,
    question_text: '今日誰かと話しましたか?',
    options: ['はい', 'いいえ', '少しだけ', 'オンラインで'],
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // useAuthStoreのモック
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });

    // useMoodRecordStoreのモック
    (useMoodRecordStore as unknown as jest.Mock).mockReturnValue({
      moodLevel: 5,
      selectedReasons: ['hobbies'],
      questionId: 'question-1',
      answerOption: 'はい',
      memo: '',
      timeOfDay: null,
      weather: null,
      isSubmitting: false,
      error: null,
      setQuestionId: mockSetQuestionId,
      setAnswer: mockSetAnswer,
      setMemo: mockSetMemo,
      setTimeOfDay: mockSetTimeOfDay,
      setWeather: mockSetWeather,
      resetForm: mockResetForm,
    });

    // getTodayQuestionActionのモック
    (getTodayQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      value: mockQuestion,
    });

    // createRecordActionのモック
    (createRecordAction as jest.Mock).mockResolvedValue({
      success: true,
      value: {
        id: 'record-1',
        user_id: 'user-1',
        mood_level: 5,
        reasons: ['hobbies'],
        question_id: 'question-1',
        answer_option: 'はい',
        memo: null,
        time_of_day: null,
        weather: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    });

    // updateRecordActionのモック
    (updateRecordAction as jest.Mock).mockResolvedValue({
      success: true,
      value: {
        id: 'record-1',
        user_id: 'user-1',
        mood_level: 5,
        reasons: ['hobbies'],
        question_id: 'question-1',
        answer_option: 'はい',
        memo: '楽しかった',
        time_of_day: 'morning',
        weather: 'sunny',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    });
  });

  it('記録完了後に「もう少し詳しく」ボタンが表示される', async () => {
    render(<QuestionAnswerStep />);

    // 質問が読み込まれるまで待機
    await waitFor(() => {
      expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
    });

    // 回答を選択
    const answerButton = screen.getByText('はい');
    fireEvent.click(answerButton);

    // 記録を完了
    const submitButton = screen.getByText('記録を完了');
    fireEvent.click(submitButton);

    // 記録完了画面が表示される
    await waitFor(() => {
      expect(screen.getByText('記録完了!')).toBeInTheDocument();
    });

    // 「もう少し詳しく」ボタンが表示される
    expect(screen.getByText('もう少し詳しく')).toBeInTheDocument();
  });

  it('「もう少し詳しく」ボタンをクリックすると補足入力フォームが表示される', async () => {
    render(<QuestionAnswerStep />);

    // 質問が読み込まれるまで待機
    await waitFor(() => {
      expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
    });

    // 回答を選択して記録を完了
    const answerButton = screen.getByText('はい');
    fireEvent.click(answerButton);
    const submitButton = screen.getByText('記録を完了');
    fireEvent.click(submitButton);

    // 記録完了画面が表示される
    await waitFor(() => {
      expect(screen.getByText('記録完了!')).toBeInTheDocument();
    });

    // 「もう少し詳しく」ボタンをクリック
    const detailButton = screen.getByText('もう少し詳しく');
    fireEvent.click(detailButton);

    // 補足入力フォームが表示される
    await waitFor(() => {
      expect(screen.getByLabelText(/メモ/i)).toBeInTheDocument();
      expect(screen.getByText('朝')).toBeInTheDocument();
      expect(screen.getByText('晴れ')).toBeInTheDocument();
    });
  });

  it('補足入力フォームでスキップすると記録が完了する', async () => {
    render(<QuestionAnswerStep />);

    // 記録完了まで進める
    await waitFor(() => {
      expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('はい'));
    fireEvent.click(screen.getByText('記録を完了'));

    await waitFor(() => {
      expect(screen.getByText('記録完了!')).toBeInTheDocument();
    });

    // 「もう少し詳しく」ボタンをクリック
    fireEvent.click(screen.getByText('もう少し詳しく'));

    // 補足入力フォームが表示される
    await waitFor(() => {
      expect(screen.getByText('スキップ')).toBeInTheDocument();
    });

    // スキップボタンをクリック
    fireEvent.click(screen.getByText('スキップ'));

    // resetFormが呼ばれる
    await waitFor(() => {
      expect(mockResetForm).toHaveBeenCalled();
    });
  });

  it('補足入力フォームで保存するとupdateRecordActionが呼ばれる', async () => {
    // メモ、時間帯、天気が設定された状態のモック
    (useMoodRecordStore as unknown as jest.Mock).mockReturnValue({
      moodLevel: 5,
      selectedReasons: ['hobbies'],
      questionId: 'question-1',
      answerOption: 'はい',
      memo: '楽しかった',
      timeOfDay: 'morning',
      weather: 'sunny',
      isSubmitting: false,
      error: null,
      setQuestionId: mockSetQuestionId,
      setAnswer: mockSetAnswer,
      setMemo: mockSetMemo,
      setTimeOfDay: mockSetTimeOfDay,
      setWeather: mockSetWeather,
      resetForm: mockResetForm,
    });

    render(<QuestionAnswerStep />);

    // 記録完了まで進める
    await waitFor(() => {
      expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('はい'));
    fireEvent.click(screen.getByText('記録を完了'));

    await waitFor(() => {
      expect(screen.getByText('記録完了!')).toBeInTheDocument();
    });

    // 「もう少し詳しく」ボタンをクリック
    fireEvent.click(screen.getByText('もう少し詳しく'));

    // 補足入力フォームが表示される
    await waitFor(() => {
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    // 保存ボタンをクリック
    fireEvent.click(screen.getByText('保存'));

    // updateRecordActionが呼ばれる
    await waitFor(() => {
      expect(updateRecordAction).toHaveBeenCalledWith('record-1', {
        memo: '楽しかった',
        time_of_day: 'morning',
        weather: 'sunny',
      });
    });

    // resetFormが呼ばれる
    await waitFor(() => {
      expect(mockResetForm).toHaveBeenCalled();
    });
  });

  it('「スキップして完了」ボタンで直接完了できる', async () => {
    render(<QuestionAnswerStep />);

    // 記録完了まで進める
    await waitFor(() => {
      expect(screen.getByText('今日誰かと話しましたか?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('はい'));
    fireEvent.click(screen.getByText('記録を完了'));

    await waitFor(() => {
      expect(screen.getByText('記録完了!')).toBeInTheDocument();
    });

    // 「スキップして完了」ボタンをクリック
    fireEvent.click(screen.getByText('スキップして完了'));

    // resetFormが呼ばれる
    await waitFor(() => {
      expect(mockResetForm).toHaveBeenCalled();
    });
  });
});
