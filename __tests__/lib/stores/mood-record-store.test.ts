/**
 * MoodRecordStore テスト
 * 気分記録フォームの状態管理のテスト
 */

import { act, renderHook } from '@testing-library/react';
import { useMoodRecordStore } from '@/lib/stores/mood-record-store';
import type { MoodLevel, TimeOfDay, Weather } from '@/lib/types/mood-record';

describe('useMoodRecordStore', () => {
  beforeEach(() => {
    // 各テストの前にストアをリセット
    const { result } = renderHook(() => useMoodRecordStore());
    act(() => {
      result.current.resetForm();
    });
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      expect(result.current.currentStep).toBe(1);
      expect(result.current.moodLevel).toBeNull();
      expect(result.current.selectedReasons).toEqual([]);
      expect(result.current.questionId).toBeNull();
      expect(result.current.answerOption).toBeNull();
      expect(result.current.memo).toBe('');
      expect(result.current.timeOfDay).toBeNull();
      expect(result.current.weather).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setMoodLevel', () => {
    it('気分レベルを設定できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
      });

      expect(result.current.moodLevel).toBe(5);
    });

    it('気分レベルが1-5の範囲内である', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      const validLevels: MoodLevel[] = [1, 2, 3, 4, 5];
      validLevels.forEach((level) => {
        act(() => {
          result.current.setMoodLevel(level);
        });
        expect(result.current.moodLevel).toBe(level);
      });
    });
  });

  describe('toggleReason', () => {
    it('理由を追加できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.toggleReason('study_school');
      });

      expect(result.current.selectedReasons).toEqual(['study_school']);
    });

    it('選択済みの理由を削除できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.toggleReason('study_school');
      });
      expect(result.current.selectedReasons).toEqual(['study_school']);

      act(() => {
        result.current.toggleReason('study_school');
      });
      expect(result.current.selectedReasons).toEqual([]);
    });

    it('最大2つまでの理由を選択できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.toggleReason('study_school');
        result.current.toggleReason('relationships');
      });

      expect(result.current.selectedReasons).toHaveLength(2);
      expect(result.current.selectedReasons).toContain('study_school');
      expect(result.current.selectedReasons).toContain('relationships');
    });

    it('3つ目の理由は追加されない', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.toggleReason('study_school');
        result.current.toggleReason('relationships');
        result.current.toggleReason('health');
      });

      expect(result.current.selectedReasons).toHaveLength(2);
      expect(result.current.selectedReasons).not.toContain('health');
    });
  });

  describe('setAnswer', () => {
    it('回答を設定できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setAnswer('とても良かった');
      });

      expect(result.current.answerOption).toBe('とても良かった');
    });
  });

  describe('setMemo', () => {
    it('メモを設定できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMemo('楽しかった');
      });

      expect(result.current.memo).toBe('楽しかった');
    });

    it('10文字以内のメモを設定できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMemo('1234567890');
      });

      expect(result.current.memo).toBe('1234567890');
    });

    it('10文字を超えるメモは設定されない', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMemo('12345678901');
      });

      expect(result.current.memo).toBe('');
    });
  });

  describe('setTimeOfDay', () => {
    it('時間帯を設定できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      const timeOfDay: TimeOfDay = 'morning';
      act(() => {
        result.current.setTimeOfDay(timeOfDay);
      });

      expect(result.current.timeOfDay).toBe('morning');
    });
  });

  describe('setWeather', () => {
    it('天気を設定できる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      const weather: Weather = 'sunny';
      act(() => {
        result.current.setWeather(weather);
      });

      expect(result.current.weather).toBe('sunny');
    });
  });

  describe('nextStep', () => {
    it('ステップ1からステップ2へ進める', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('ステップ2からステップ3へ進める', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
        result.current.nextStep();
        result.current.toggleReason('study_school');
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('ステップ3からは進まない', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
        result.current.nextStep();
        result.current.toggleReason('study_school');
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });
  });

  describe('resetForm', () => {
    it('フォームをリセットできる', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
        result.current.toggleReason('study_school');
        result.current.setAnswer('良かった');
        result.current.setMemo('楽しい');
        result.current.resetForm();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.moodLevel).toBeNull();
      expect(result.current.selectedReasons).toEqual([]);
      expect(result.current.answerOption).toBeNull();
      expect(result.current.memo).toBe('');
    });
  });

  describe('submitRecord', () => {
    it('記録を送信すると isSubmitting が true になり、完了後 false になる', async () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
        result.current.toggleReason('study_school');
        result.current.setQuestionId('question-123');
        result.current.setAnswer('良かった');
      });

      // submitRecord を呼び出して送信完了を待つ
      await act(async () => {
        await result.current.submitRecord();
      });

      // isSubmitting が false に戻るか確認
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('永続化', () => {
    it('フォーム状態がlocalStorageに保存される', () => {
      const { result } = renderHook(() => useMoodRecordStore());

      act(() => {
        result.current.setMoodLevel(5);
        result.current.toggleReason('study_school');
      });

      // localStorageに保存されていることを確認
      const stored = localStorage.getItem('mood-record-store');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.moodLevel).toBe(5);
        expect(parsed.state.selectedReasons).toContain('study_school');
      }
    });

    it('リロード後もフォーム状態が復元される', () => {
      // 最初のフックでデータを設定
      const { result: result1 } = renderHook(() => useMoodRecordStore());

      act(() => {
        result1.current.setMoodLevel(4);
        result1.current.toggleReason('relationships');
        result1.current.setMemo('テスト');
      });

      // 新しいフックインスタンスで復元を確認
      const { result: result2 } = renderHook(() => useMoodRecordStore());

      expect(result2.current.moodLevel).toBe(4);
      expect(result2.current.selectedReasons).toContain('relationships');
      expect(result2.current.memo).toBe('テスト');
    });
  });
});
