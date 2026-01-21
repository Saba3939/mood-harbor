/**
 * 補足入力フォームのテスト
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupplementForm } from '@/app/record/components/supplement-form';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';

// Zustand storeのモック
jest.mock('@/lib/stores/mood-record-store');

describe('SupplementForm', () => {
  const mockSetMemo = jest.fn();
  const mockSetTimeOfDay = jest.fn();
  const mockSetWeather = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Zustand storeのモック初期値
    (useMoodRecordStore as unknown as jest.Mock).mockReturnValue({
      memo: '',
      timeOfDay: null,
      weather: null,
      setMemo: mockSetMemo,
      setTimeOfDay: mockSetTimeOfDay,
      setWeather: mockSetWeather,
    });
  });

  describe('メモ入力フィールド', () => {
    it('メモ入力フィールドが表示される', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const memoInput = screen.getByLabelText(/メモ/i);
      expect(memoInput).toBeInTheDocument();
    });

    it('メモを入力するとsetMemoが呼ばれる', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const memoInput = screen.getByLabelText(/メモ/i);
      fireEvent.change(memoInput, { target: { value: 'テスト' } });

      expect(mockSetMemo).toHaveBeenCalledWith('テスト');
    });

    it('10文字以内のメモは入力できる', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const memoInput = screen.getByLabelText(/メモ/i);
      fireEvent.change(memoInput, { target: { value: '1234567890' } });

      expect(mockSetMemo).toHaveBeenCalledWith('1234567890');
    });

    it('10文字を超えるメモは入力が拒否される', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const memoInput = screen.getByLabelText(/メモ/i) as HTMLInputElement;
      expect(memoInput.maxLength).toBe(10);
    });

    it('リアルタイム文字数表示が機能する', () => {
      (useMoodRecordStore as unknown as jest.Mock).mockReturnValue({
        memo: 'テスト',
        timeOfDay: null,
        weather: null,
        setMemo: mockSetMemo,
        setTimeOfDay: mockSetTimeOfDay,
        setWeather: mockSetWeather,
      });

      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      expect(screen.getByText(/3\/10/)).toBeInTheDocument();
    });
  });

  describe('時間帯タグ選択', () => {
    it('4つの時間帯タグが表示される', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      expect(screen.getByText('朝')).toBeInTheDocument();
      expect(screen.getByText('昼')).toBeInTheDocument();
      expect(screen.getByText('夕方')).toBeInTheDocument();
      expect(screen.getByText('夜')).toBeInTheDocument();
    });

    it('時間帯をクリックするとsetTimeOfDayが呼ばれる', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const morningButton = screen.getByText('朝');
      fireEvent.click(morningButton);

      expect(mockSetTimeOfDay).toHaveBeenCalledWith('morning');
    });

    it('選択された時間帯がハイライト表示される', () => {
      (useMoodRecordStore as unknown as jest.Mock).mockReturnValue({
        memo: '',
        timeOfDay: 'morning',
        weather: null,
        setMemo: mockSetMemo,
        setTimeOfDay: mockSetTimeOfDay,
        setWeather: mockSetWeather,
      });

      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const morningButton = screen.getByText('朝');
      expect(morningButton).toHaveClass('bg-blue-500');
    });
  });

  describe('天気選択', () => {
    it('4つの天気選択肢が表示される', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      expect(screen.getByText('晴れ')).toBeInTheDocument();
      expect(screen.getByText('曇り')).toBeInTheDocument();
      expect(screen.getByText('雨')).toBeInTheDocument();
      expect(screen.getByText('その他')).toBeInTheDocument();
    });

    it('天気をクリックするとsetWeatherが呼ばれる', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const sunnyButton = screen.getByText('晴れ');
      fireEvent.click(sunnyButton);

      expect(mockSetWeather).toHaveBeenCalledWith('sunny');
    });

    it('選択された天気がハイライト表示される', () => {
      (useMoodRecordStore as unknown as jest.Mock).mockReturnValue({
        memo: '',
        timeOfDay: null,
        weather: 'sunny',
        setMemo: mockSetMemo,
        setTimeOfDay: mockSetTimeOfDay,
        setWeather: mockSetWeather,
      });

      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const sunnyButton = screen.getByText('晴れ');
      expect(sunnyButton).toHaveClass('bg-blue-500');
    });
  });

  describe('スキップボタン', () => {
    it('スキップボタンが表示される', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const skipButton = screen.getByText(/スキップ/i);
      expect(skipButton).toBeInTheDocument();
    });

    it('スキップボタンをクリックするとonSkipが呼ばれる', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const skipButton = screen.getByText(/スキップ/i);
      fireEvent.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  describe('保存ボタン', () => {
    it('保存ボタンが表示される', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const saveButton = screen.getByText(/保存/i);
      expect(saveButton).toBeInTheDocument();
    });

    it('保存ボタンをクリックするとonSubmitが呼ばれる', async () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const saveButton = screen.getByText(/保存/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('メモ入力フィールドにaria-labelが設定されている', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const memoInput = screen.getByLabelText(/メモ/i);
      expect(memoInput).toHaveAttribute('aria-label');
    });

    it('時間帯ボタンにaria-pressedが設定されている', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const morningButton = screen.getByText('朝');
      expect(morningButton).toHaveAttribute('aria-pressed');
    });

    it('天気ボタンにaria-pressedが設定されている', () => {
      render(
        <SupplementForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
      );

      const sunnyButton = screen.getByText('晴れ');
      expect(sunnyButton).toHaveAttribute('aria-pressed');
    });
  });
});
